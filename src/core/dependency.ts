import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as FS from 'fs-extra';
import * as extractZip from 'extract-zip';
import * as fetch from 'node-fetch';
import P, { invoke } from 'thenfail';

import {
    Plugin,
    PlatformSpecifier,
    Configuration
} from './';

export interface DependencyContext {
    platform: string | undefined;
}

export interface DependencyConfiguration extends PlatformSpecifier {
    name: string;
}

export interface DependencyResult {
    url: string;
    strip?: number;
}

export interface DependencyInfo extends DependencyResult {
    name: string;
    platform: string;
    dir: string;
    packagePath: string;
}

export interface DependencyOptions {
    depsDir: string;
    plugins: Plugin[];
    platforms: string[];
}

export class Dependency {
    readonly name: string;
    readonly platformSpecified: boolean;

    private depsDir: string;
    private platforms: string[];
    private plugins: Plugin[];

    constructor(
        private config: DependencyConfiguration,
        options: DependencyOptions
    ) {
        let multiplatform = config.multiplatform || false;
        let platforms = Configuration.getMatchedPlatforms(config, options.platforms);

        this.name = config.name;

        this.platformSpecified = !!platforms;
        this.platforms = platforms || [process.platform];
        this.depsDir = options.depsDir;
        this.plugins = options.plugins;
    }

    private async resolve(platform: string): Promise<DependencyInfo> {
        for (let plugin of this.plugins) {
            let result = await plugin.resolveDependency!(this.config, {
                platform
            });

            if (result) {
                let name = this.name;
                let dir = Path.join(this.depsDir, name);

                if (this.platformSpecified) {
                    dir += `-${platform}`;
                }

                return Object.assign({
                    name,
                    platform,
                    dir,
                    packagePath: dir + '.zip'
                }, result);
            }
        }

        throw new ExpectedError(`Unknown dependency \`${JSON.stringify(this.config)}\``);
    }

    private async download(info: DependencyInfo): Promise<void> {
        let response = await fetch(info.url);

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

        let platforms = this.platforms;
        let infos: DependencyInfo[] = [];

        for (let platform of platforms) {
            let info = await this.resolve(platform);

            if (packageSet.has(info.packagePath)) {
                continue;
            }

            infos.push(info);

            packageSet.add(info.packagePath);

            await this.download(info);
            await this.extract(info);
        }

        return infos;
    }
}
