import * as Path from 'path';
import * as FS from 'fs';

import * as Archiver from 'archiver';
import { ExpectedError } from 'clime';
import P, { invoke } from 'thenfail';

import { FileWalker, Capture } from '../utils/file-walker';
import * as Style from '../utils/style';

export interface FileMappingDescriptor {
    pattern: string;
    baseDir?: string;
    package?: string;
    path?: string;
    platform?: string;
    platforms?: string[];
}

export type FileMappingConfiguration = string | FileMappingDescriptor;

export type PackageFormat = 'zip' | 'tar';

export interface FileMapping {
    package: string | undefined;
    baseDir: string | undefined;
    pattern: string;
    path: string;
    platformSet: Set<string> | undefined;
}

interface FileInfo {
    path: string;
    captures: Capture[];
}

export interface ArtifactMetadataItem {
    id: string;
    name: string;
    platform?: string;
    path: string;
}

export interface ArtifactMetadata {
    name: string;
    version: string;
    commit: string;
    artifacts: ArtifactMetadataItem[];
}

export interface ArtifactConfiguration {
    name?: string;
    root?: string;
    files: FileMappingConfiguration[];
}

export interface ArtifactOptions {
    projectName: string;
    distDir: string;
    platformSpecified: boolean;
    platforms: string[];
    dependencyDirMap: Map<string, string>;
}

export class Artifact {
    readonly name: string;

    private distDir: string;
    private platformSpecified: boolean;
    private platforms: string[];
    private dependencyDirMap: Map<string, string>;

    private mappings: FileMapping[];

    constructor(
        private config: ArtifactConfiguration,
        options: ArtifactOptions
    ) {
        if (!config) {
            throw new ExpectedError('Missing `artifact` configuration');
        }

        if (!config.files) {
            throw new ExpectedError('Missing `files` field in `artifact` configuration');
        }

        this.name = config.name || options.projectName;

        this.distDir = options.distDir;

        this.platformSpecified = options.platformSpecified;
        this.platforms = options.platforms;
        this.dependencyDirMap = options.dependencyDirMap;

        let cwd = process.cwd();

        this.mappings = config.files.map(config => Artifact.normalizeMapping(config));
    }

    private async walk(mappings: FileMapping[], platform: string, archiver: Archiver.Archiver): Promise<void> {
        for (let mapping of mappings) {
            let walker = new FileWalker(mapping.pattern);
            let baseDir = this.resolveBaseDir(mapping, platform);
            let mappingPath = mapping.path;

            await walker.walk(baseDir, (path, captures) => {
                // archiver.
                let pathInArtifact = Artifact.buildPath(mappingPath, captures);

                archiver.file(Path.join(baseDir, path), {
                    name: pathInArtifact
                });

                console.log(path, Style.dim('->'), pathInArtifact);
            });
        }
    }

    private resolveBaseDir(mapping: FileMapping, platform: string): string {
        let baseDir: string;

        let packageName = mapping.package;

        if (packageName) {
            baseDir =
                this.platformSpecified && this.dependencyDirMap.get(`${packageName}\t${platform}`) ||
                this.dependencyDirMap.get(packageName) ||
                process.cwd();

            if (mapping.baseDir) {
                baseDir = Path.resolve(baseDir, mapping.baseDir);
            }
        } else if (mapping.baseDir){
            baseDir = Path.resolve(mapping.baseDir);
        } else {
            baseDir = process.cwd();
        }

        return baseDir;
    }

    async generate(): Promise<void> {
        let name = this.name;

        let artifacts: ArtifactMetadataItem[] = [];

        let metadata: ArtifactMetadata = {
            name,
            version: '',
            commit: '',
            artifacts
        };

        for (let platform of this.platforms) {
            console.log();
            console.log(
                this.platformSpecified ?
                    `Generating artifact of project ${Style.project(name)} ${Style.dim(`(${platform})`)}...` :
                    `Generating artifact of project ${Style.project(name)}...`
            );
            console.log();

            let id = this.platformSpecified ?
                `${name}-${platform}` : name;

            let archiver = Archiver.create('zip', {});

            let mappings = this
                .mappings
                .filter(mapping => !mapping.platformSet || mapping.platformSet.has(platform));

            await this.walk(mappings, platform, archiver);

            archiver.finalize();

            let path = Path.join(this.distDir, `${id}.zip`);

            let writeStream = FS.createWriteStream(path);

            archiver.pipe(writeStream);

            await P.for(writeStream, 'close', [archiver]);

            console.log();
            console.log(`Artifact generated at path ${Style.path(path)}.`);

            artifacts.push({
                id,
                name,
                platform: this.platformSpecified ? platform : undefined,
                path: Path.relative(process.cwd(), path)
            });
        }

        let metadataFilePath = Path.join(this.distDir, `${name}.json`);
        let metadataJSON = JSON.stringify(metadata, undefined, 4);

        await invoke(FS.writeFile, metadataFilePath, metadataJSON);

        console.log();
        console.log(`Artifact metadata generated at path ${Style.path(metadataFilePath)}.`);
    }

    private static normalizeMapping(config: FileMappingConfiguration): FileMapping {
        let packageName: string | undefined;
        let pattern: string;
        let baseDir: string | undefined;
        let path: string;
        let platformSet: Set<string> | undefined;

        if (typeof config === 'string') {
            pattern = Path.normalize(config);
            path = pattern;
        } else {
            packageName = config.package;
            pattern = config.pattern && Path.normalize(config.pattern);
            baseDir = config.baseDir && Path.normalize(config.baseDir);
            path = config.path ? Path.normalize(config.path) : pattern;

            let platforms = config.platforms || (config.platform ? [config.platform] : undefined);

            if (platforms) {
                platformSet = new Set(platforms);
            }
        }

        if (!pattern) {
            throw new ExpectedError(`Property \`pattern\` is required for mapping \`${JSON.stringify(config)}\``);
        }

        if (pattern.endsWith(Path.sep)) {
            throw new ExpectedError('Expecting mapping pattern to match files instead of directories');
        }

        let baseName = Path.basename(pattern);

        if (!/(?:^|[\\/])\*\*[\\/]?$/.test(path)) {
            // If not something like "**/", "foo/**".
            path = Path.join(path, '**');
        }

        if (baseName !== '**') {
            path = Path.join(path, baseName);
        }

        return {
            package: packageName,
            pattern,
            baseDir,
            path,
            platformSet
        };
    }

    private static buildPath(pattern: string, captures: Capture[]): string {
        let starCaptures: string[] = [];
        let globStarsCaptures: string[][] = [];

        for (let capture of captures) {
            if (typeof capture === 'string') {
                starCaptures.push(capture);
            } else {
                globStarsCaptures.push(capture);
            }
        }

        let startWithSlash = pattern.startsWith(Path.sep);
        let parts = pattern.split('**');

        if (parts.length > 1) {
            for (let i = parts.length - 1; i > 0 && globStarsCaptures.length; i--) {
                let capture = globStarsCaptures.pop() as string[];

                if (capture.length) {
                    parts.splice(i, 0, Path.join(...capture));
                }
            }
        }

        parts = parts.join('').split('*');

        if (parts.length > 1) {
            for (let i = parts.length - 1; i > 0 && starCaptures.length; i--) {
                parts.splice(i, 0, starCaptures.pop() as string);
            }
        }

        let path = Path.normalize(parts.join(''));

        if (!startWithSlash && path.startsWith(Path.sep)) {
            path = path.substr(1);
        }

        return path;
    }
}
