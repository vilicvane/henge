import { spawn } from 'child_process';

import { ExpectedError } from 'clime';
import P from 'thenfail';
import * as which from 'which';

import {
    Configuration,
    PlatformInfo,
    ProcedureConfiguration,
    Project
} from './';

import * as Style from '../utils/style';

const NPM_EXECUTABLE = which.sync('npm');

export class Procedure {
    readonly description: string;

    private command: string;
    private args: string[];

    constructor(
        private config: ProcedureConfiguration,
        private project: Project
    ) {
        let {
            platforms,
            specified: platformSpecified
        } = Configuration.getMatchedPlatforms(config, project.platforms);

        let description = config.description;

        if (config.command) {
            if (typeof config.command === 'string') {
                this.command = config.command;
                this.args = [];
            } else {
                this.command = config.command.name;
                this.args = config.command.args || [];
            }

            description = `${Style.label('Command')} ${description || this.command}`;
        } else if (config.task) {
            this.command = NPM_EXECUTABLE;

            let args: string[] = ['run'];
            let taskName: string;

            if (typeof config.task === 'string') {
                taskName = config.task;
                args.push(taskName);
            } else {
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

        for (let platform of project.platforms) {
            console.log();
            console.log(this.description, Style.dim(`(${platform.name})`));

            let env = Object.assign({}, process.env, platform.env);

            let args = argTemplates.map(arg => project.renderTemplate(arg, {
                platform: platform.name
            }));

            let cp = spawn(this.command, args, {
                stdio: 'inherit',
                env
            });

            await P.for(cp);
        }
    }
}
