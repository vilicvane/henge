import * as Path from 'path';

import {
    Command,
    ExpectedError,
    Options,
    command,
    option,
    params,
    Printable
} from 'clime';

import {
    ProjectConfiguration,
    Project,
    File,
    CommaSeperatedStrings
} from '../core';

import { getPackageFile } from '../utils/json-file';

import cli from '../cli';

export class DistributeOptions extends Options {
    @option({
        description: 'Specify a configuration file.',
        flag: 'c',
        placeholder: 'filename',
        default: 'dist.config.js'
    })
    config: File;

    @option({
        description: 'Specify a platform or comma seperated platforms to distribute.',
        name: 'platform',
        flag: 'p'
    })
    platforms: CommaSeperatedStrings;

    @option({
        description: 'Perform a local distribution.',
        flag: 'l',
        toggle: true
    })
    local: boolean;
}

@command({
    description: 'Distribute a project.'
})
export default class extends Command {
    async execute(
        @params({
            type: String,
            description: 'Names of projects to distribute.'
        })
        names: string[],

        options: DistributeOptions
    ) {
        let configFile = options.config;
        let local = options.local;

        let { dir, data: packageData } = getPackageFile(Path.dirname(configFile.fullName));

        await configFile.assert();

        let configs = configFile.require<ProjectConfiguration | ProjectConfiguration[]>();

        if (!Array.isArray(configs)) {
            configs = [configs];
        }

        let projectConfigMap = new Map<string, ProjectConfiguration>();

        for (let config of configs as ProjectConfiguration[]) {
            let name = config.name || packageData.name;

            if (projectConfigMap.has(name)) {
                throw new ExpectedError(`Duplicated project name "${name}"`);
            }

            projectConfigMap.set(name, config);
        }

        if (names.length) {
            configs = names.map(name => {
                let config = projectConfigMap.get(name);

                if (config) {
                    return config;
                } else {
                    throw new ExpectedError(`Project "${name}" does not exist`);
                }
            });
        }

        let projects: Project[] = [];

        for (let config of configs as ProjectConfiguration[]) {
            let project = new Project(config, {
                dir,
                packageData,
                local,
                platforms: options.platforms
            });

            await project.load();

            projects.push(project);
        }

        for (let project of projects) {
            await project.clean();
        }

        for (let project of projects) {
            await project.distribute();
        }
    }
}
