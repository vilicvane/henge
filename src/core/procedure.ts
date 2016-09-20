import { spawn } from 'child_process';

import { ExpectedError } from 'clime';
import { awaitable } from 'villa';
import * as which from 'which';

import {
    Configuration,
    PlatformInfo,
    ProcedureConfiguration,
    Project
} from './';

import {
    Dictionary
} from '../lang';

import * as Style from '../utils/style';

const NPM_EXECUTABLE = which.sync('npm');

export class Procedure {
    readonly description: string;

    private command: string;
    private cwd: string;
    private env: Dictionary<string>;
    private args: string[];

    private platforms: PlatformInfo[];
    private platformSpecified: boolean;

    constructor(
        private config: ProcedureConfiguration,
        private project: Project
    ) {
        let {
            platforms,
            specified: platformSpecified
        } = Configuration.getMatchedPlatforms(config, project.platforms);

        this.platforms = platforms;
        this.platformSpecified = platformSpecified;

        let description = config.description;

        if (config.command) {
            if (typeof config.command === 'string') {
                this.command = config.command;
                this.cwd = project.dir;
                this.env = {};
                this.args = [];
            } else {
                this.command = config.command.name;
                this.cwd = config.command.cwd || project.dir;
                this.env = config.command.env || {};
                this.args = config.command.args || [];
            }

            description = `${Style.label('Command')} ${description || this.command}`;
        } else if (config.task) {
            this.command = NPM_EXECUTABLE;

            let args: string[] = ['run'];
            let taskName: string;

            if (typeof config.task === 'string') {
                this.cwd = project.dir;
                this.env = {};
                taskName = config.task;
                args.push(taskName);
            } else {
                this.cwd = config.task.cwd || project.dir;
                this.env = config.task.env || {};
                taskName = config.task.name;
                args.push(taskName);

                if (config.task.args) {
                    args.push('--', ...config.task.args);
                }
            }

            this.args = args;

            description = `${Style.label('Task')} ${description || taskName}`;
        } else {
            throw new ExpectedError('A procedure must have one of `command` or `task` property');
        }

        this.description = description;
    }

    async execute(): Promise<void> {
        let project = this.project;
        let argTemplates = this.args;

        for (let platform of this.platforms) {
            console.log();
            console.log(
                this.platformSpecified ?
                    `${this.description} ${Style.dim(`(${platform.name})`)}` :
                    this.description
            );

            let data = {
                platform: platform.name
            };

            Object.assign(data, platform.variables);

            let env = Object.assign({}, process.env);

            let extraEnv = Object.assign({}, platform.env, this.env);

            for (let key of Object.keys(extraEnv)) {
                let value = extraEnv[key];

                if (typeof value === 'string') {
                    value = project.renderTemplate(value, data);
                }

                env[key] = value;
            }

            let cwd = project.renderTemplate(this.cwd, data);
            let args = argTemplates.map(arg => project.renderTemplate(arg, data));

            let cp = spawn(this.command, args, {
                cwd,
                env,
                stdio: 'inherit'
            });

            await awaitable(cp);
        }
    }
}
