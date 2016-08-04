import { EventEmitter } from 'events';
import * as Path from 'path';

import * as FS from 'fs-extra';
import { ExpectedError } from 'clime';
import * as extractZip from 'extract-zip';
import * as fetch from 'node-fetch';
import * as resolve from 'resolve';
import P, { invoke } from 'thenfail';

import { Dictionary } from '../lang';

import {
    Artifact,
    ArtifactConfiguration,
    Dependency,
    DependencyConfiguration,
    PackageData,
    PlatformConfiguration,
    PlatformInfo,
    Plugin,
    PluginConstructor,
    Procedure,
    ProcedureConfiguration,
    ProjectConfiguration
} from './';

import * as Style from '../utils/style';
import * as Template from '../utils/template';

export interface Variables {
    env: Dictionary<string>;
    [key: string]: any;
}

export interface ProjectOptions {
    dir: string;
    packageData: PackageData;
}

export interface ProjectHost {
    platform: string;
}

export class Project extends EventEmitter {
    readonly name: string;
    readonly version: string;

    platformSpecified: boolean;
    platforms: PlatformInfo[];

    readonly dir: string;
    readonly distDir: string;
    readonly depsDir: string;

    readonly dependencyDirMap = new Map<string, string>();

    variables: Variables;
    host: ProjectHost;

    plugins: Plugin[];

    constructor(
        private config: ProjectConfiguration,
        {
            dir,
            packageData
        }: ProjectOptions
    ) {
        super();

        this.dir = dir;

        this.name = config.name || packageData.name;
        this.version = config.version || packageData.version;

        this.host = {
            platform: config.host && config.host.platform || process.platform
        };

        this.variables = {
            name: this.name,
            version: this.version,
            host: this.host,
            env: Object.assign({}, process.env)
        };

        this.distDir = Path.resolve(config.distDir || 'dist');
        this.depsDir = config.dependencyDir ?
            Path.resolve(config.dependencyDir) : Path.join(this.distDir, 'deps');
    }

    private async loadPlugins(names: string[]): Promise<Plugin[]> {
        let plugins: Plugin[] = [];

        for (let name of names) {
            let baseDir: string;

            if (!Path.isAbsolute(name)) {
                if (/^\./.test(name)) {
                    name = Path.resolve(name);
                } else {
                    name = await invoke<string>(resolve, name, {
                        basedir: this.dir
                    } as resolve.AsyncOpts);
                }
            }

            let pluginModule = require(name);
            let PluginConstructor: PluginConstructor = pluginModule.__esModule ? pluginModule.default : pluginModule;

            plugins.push(new PluginConstructor(this));
        }

        return plugins;
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
            let dependency = new Dependency(config, this);

            let infos = await dependency.prepare();

            for (let info of infos) {
                if (dependency.platformSpecified && !dependency.kit) {
                    this.dependencyDirMap.set(`${info.name}\t${info.platform}`, info.dir);
                } else {
                    this.dependencyDirMap.set(info.name, info.dir);
                }
            }
        }
    }

    private async executeProcedures(procedures: ProcedureConfiguration[]): Promise<void> {
        for (let config of procedures) {
            let procedure = new Procedure(config, this);

            await procedure.execute();
        }
    }

    private async generateArtifacts(): Promise<void> {
        let artifact = new Artifact(this.config.artifact, this);

        await artifact.generate();
    }

    async load(): Promise<void> {
        console.log();
        console.log(`Loading project ${Style.id(this.name)}...`);

        let config = this.config;

        let pluginIds = [
            ...(config.plugins || []),
            Path.join(__dirname, '../plugins/dependency-resolver')
        ];

        this.plugins = await this.loadPlugins(pluginIds);

        for (let plugin of this.plugins) {
            if (plugin.loadVariables) {
                let variables = await plugin.loadVariables();
                Object.assign(this.variables, variables);
            }
        }

        let platforms = config.platforms || (config.platform ? [config.platform] : undefined);

        if (typeof platforms === 'string') {
            let url = this.renderTemplate(platforms);
            console.log(`Resolving platforms configuration from ${Style.url(url)}...`);

            let response = await fetch(url);
            platforms = await response.json<PlatformConfiguration[]>();
        }

        this.platformSpecified = !!platforms;

        platforms = platforms || [process.platform];

        this.platforms = platforms.map(config => {
            return typeof config === 'string' ?
                { name: config } : config;
        });
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
        console.log(`Cleaning previous distribution of project ${Style.id(this.name)}...`);

        await invoke(FS.remove, this.distDir);
    }

    renderTemplate(template: string, ...variableObjects: Dictionary<any>[]): string {
        let data = Object.assign(this.variables, ...variableObjects);
        return Template.render(template, data);
    }
}
