import * as Path from 'path';
import * as URL from 'url';

import { ExpectedError } from 'clime';
import * as FS from 'fs-extra';
import * as extractZip from 'extract-zip';
import * as fetch from 'node-fetch';
import P, { invoke } from 'thenfail';

import {
    ArtifactMetadata,
    Configuration,
    DependencyConfiguration,
    Plugin,
    PlatformInfo,
    PlatformSpecifier,
    Project
} from './';

import * as Style from '../utils/style';

export interface DependencyResult {
    url: string;
    metadata?: boolean;
}

export interface DependencyInfo extends DependencyResult {
    name: string;
    platform: string;
    url: string;
    dir: string;
    packagePath: string;
}

export class Dependency {
    readonly name: string;
    readonly platformSpecified: boolean;
    readonly kit: boolean;

    private platforms: PlatformInfo[];

    private static metadataCache = new Map<string, ArtifactMetadata>();

    constructor(
        private config: DependencyConfiguration,
        private project: Project
    ) {
        this.name = config.name;

        let {
            platforms,
            specified: platformSpecified
        } = Configuration.getMatchedDependencyPlatforms(config, project.platforms, project.host.platform);

        this.platforms = platforms;
        this.platformSpecified = platformSpecified;
        this.kit = !!config.kit;
    }

    private async resolve(platform: PlatformInfo): Promise<DependencyInfo> {
        let project = this.project;

        let {
            plugins,
            depsDir
        } = project;

        let name = this.name;

        for (let plugin of plugins) {
            if (!plugin.resolveDependency) {
                continue;
            }

            let result = await plugin.resolveDependency(this.config, this.platformSpecified ? platform : undefined);

            if (!result) {
                continue;
            }

            let url: string | undefined;

            if (result.metadata) {
                let metadataUrl = result.url;

                let metadata = Dependency.metadataCache.get(metadataUrl);

                if (!metadata) {
                    let response = await fetch(metadataUrl);

                    try {
                        metadata = await response.json<ArtifactMetadata>();
                    } catch (error) {
                        throw new ExpectedError(`Error parsing metadata of dependency "${name}" from URL "${metadataUrl}"`);
                    }

                    Dependency.metadataCache.set(metadataUrl, metadata);
                }

                for (let artifact of metadata.artifacts || []) {
                    if (this.platformSpecified && artifact.platform && artifact.platform !== platform.name) {
                        continue;
                    }

                    url = URL.resolve(metadataUrl, artifact.path);
                    break;
                }

                if (!url) {
                    throw new ExpectedError(`No matching artifact found in dependency "${name}"`);
                }
            } else {
                url = result.url;
            }

            let dir = Path.join(depsDir, name);

            if (this.platformSpecified && !this.kit) {
                dir += `-${platform.name}`;
            }

            return {
                name,
                platform: platform.name,
                url,
                dir,
                packagePath: dir + '.zip'
            };
        }

        throw new ExpectedError(`Unknown dependency \`${JSON.stringify(this.config)}\``);
    }

    private async download(info: DependencyInfo): Promise<void> {
        let response = await fetch(info.url);

        if (response.status !== 200) {
            throw new ExpectedError(`Failed downloading dependency (status code ${response.status})`);
        }

        let responseStream = response.body;
        let writeStream = FS.createWriteStream(info.packagePath);

        responseStream.pipe(writeStream);

        await P.for(writeStream, 'close', [responseStream]);
    }

    private async extract(info: DependencyInfo): Promise<void> {
        await invoke(extractZip, info.packagePath, {
            dir: info.dir
        } as extractZip.Options);
    }

    async prepare(): Promise<DependencyInfo[]> {
        let packageSet = new Set<string>();

        let name = this.name;
        let project = this.project;
        let platforms = this.platforms;
        let infos: DependencyInfo[] = [];

        console.log();

        for (let platform of platforms) {
            console.log(
                this.platformSpecified ?
                    `Resolving dependency ${Style.id(name)} ${Style.dim(`(${platform.name})`)}...` :
                    `Resolving dependency ${Style.id(name)}...`
            );

            let info = await this.resolve(platform);

            if (packageSet.has(info.packagePath)) {
                continue;
            }

            infos.push(info);

            packageSet.add(info.packagePath);

            console.log(
                this.platformSpecified ?
                    `Downloading dependency ${Style.id(name)} ${Style.dim(`(${platform.name})`)} from ${Style.url(info.url)}...` :
                    `Downloading dependency ${Style.id(name)} from ${Style.url(info.url)}...`
            );

            await this.download(info);

            console.log(
                this.platformSpecified ?
                    `Extracting dependency ${Style.id(name)} ${Style.dim(`(${platform.name})`)} to ${Style.path(info.dir)}...` :
                    `Extracting dependency ${Style.id(name)} to ${Style.path(info.dir)}...`
            );

            await this.extract(info);
        }

        return infos;
    }
}
