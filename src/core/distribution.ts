import { EventEmitter } from 'events';
import * as Path from 'path';

import * as FS from 'fs-extra';
import { ExpectedError } from 'clime';
import * as extractZip from 'extract-zip';
import * as fetch from 'node-fetch';
import * as resolve from 'resolve';
import P, { invoke } from 'thenfail';

import {
    Artifact,
    ArtifactConfiguration,
    Dependency,
    DependencyConfiguration,
    Plugin,
    PluginConstructor,
    Procedure,
    ProcedureConfiguration
} from './';

import * as Style from '../utils/style';

export interface ProjectConfiguration {
    name: string;
    distDir?: string;
    dependencyDir?: string;
    plugins?: string[];
    platform?: PlatformConfiguration;
    platforms?: PlatformConfiguration[];
    dependencies?: DependencyConfiguration[];
    procedures?: ProcedureConfiguration[];
    artifact: ArtifactConfiguration;
}

export interface PlatformInfo {
    name: string;
    env?: Dictionary<string>;
}

export type PlatformConfiguration = string | PlatformInfo;

export class Project extends EventEmitter {
    readonly name: string;

    private plugins: Plugin[];

    private platformSpecified: boolean;
    private platforms: PlatformInfo[];
    private platformNames: string[];

    private distDir: string;
    private depsDir: string;

    private dependencyDirMap = new Map<string, string>();

    constructor(
        private config: ProjectConfiguration
    ) {
        super();

        this.name = config.name;

        let platforms = config.platforms || (config.platform ? [config.platform] : undefined);

        this.platformSpecified = !!platforms;

        platforms = platforms || [process.platform];

        this.platforms = platforms.map(config => {
            return typeof config === 'string' ?
                { name: config } : config;
        });

        this.platformNames = this.platforms.map(platform => platform.name);

        this.distDir = Path.resolve(config.distDir || 'dist');
        this.depsDir = config.dependencyDir ?
            Path.resolve(config.dependencyDir) : Path.join(this.distDir, 'deps');
    }

    private async prepareDependencies(dependencies: DependencyConfiguration[]): Promise<void> {
        if (!dependencies.length) {
            return;
        }

        console.log();
        console.log('Preparing dependencies...');

        await invoke(FS.ensureDir, this.depsDir);

        let packageSet = new Set<string>();

        for (let config of dependencies) {
            let dependency = new Dependency(config, {
                depsDir: this.depsDir,
                platforms: this.platformNames,
                plugins: this.plugins
            });

            let infos = await dependency.prepare();

            for (let info of infos) {
                if (dependency.platformSpecified) {
                    this.dependencyDirMap.set(`${info.name}\t${info.platform}`, info.dir);
                } else {
                    this.dependencyDirMap.set(info.name, info.dir);
                }
            }
        }
    }

    private async executeProcedures(procedures: ProcedureConfiguration[]): Promise<void> {
        for (let config of procedures) {
            let procedure = new Procedure(config, {
                platforms: this.platformNames
            });

            await procedure.execute();
        }
    }

    private async generateArtifacts(): Promise<void> {
        let artifact = new Artifact(this.config.artifact, {
            projectName: this.name,
            distDir: this.distDir,
            platformSpecified: this.platformSpecified,
            platforms: this.platformNames,
            dependencyDirMap: this.dependencyDirMap
        });

        await artifact.generate();
    }

    async load(): Promise<void> {
        console.log();
        console.log(`Loading project ${Style.project(this.name)}...`);

        let config = this.config;

        let pluginIds = config.plugins || [];

        pluginIds = pluginIds.concat([
            Path.join(__dirname, '../plugins/dependency-resolver')
        ]);

        this.plugins = await Project.loadPlugins(pluginIds);
    }

    async distribute(): Promise<void> {
        let config = this.config;

        await invoke(FS.ensureDir, this.distDir);

        await this.prepareDependencies(config.dependencies || []);
        await this.executeProcedures(config.procedures || []);
        await this.generateArtifacts();
    }

    async clean(): Promise<void> {
        console.log();
        console.log(`Cleaning previous distribution of project ${Style.project(this.name)}...`);

        await invoke(FS.remove, this.distDir);
    }

    private static async loadPlugins(names: string[]): Promise<Plugin[]> {
        let plugins: Plugin[] = [];

        for (let name of names) {
            let baseDir: string;

            if (!Path.isAbsolute(name)) {
                if (/^\./.test(name)) {
                    name = Path.resolve(name);
                } else {
                    name = await invoke<string>(resolve, name, {
                        basedir: process.cwd()
                    } as resolve.AsyncOpts);
                }
            }

            let pluginModule = require(name);
            let PluginConstructor: PluginConstructor = pluginModule.__esModule ? pluginModule.default : pluginModule;

            plugins.push(new PluginConstructor());
        }

        return plugins;
    }
}
