import { spawn } from 'child_process';

import { ExpectedError } from 'clime';
import P from 'thenfail';
import * as which from 'which';

import {
    Configuration
} from './';

import * as Style from '../utils/style';

const NPM_EXECUTABLE = which.sync('npm');

export interface TaskDescriptor {
    name: string;
    args?: string[];
}

export interface CommandDescriptor {
    name: string;
    args?: string[];
}

export type TaskConfiguration = string | TaskDescriptor;
export type CommandConfiguration = string | CommandDescriptor;

export interface ProcedureConfiguration {
    description?: string;
    task?: TaskConfiguration;
    command?: CommandConfiguration;
    multiplatform?: boolean;
    platform?: string;
    platforms?: string[];
}

export interface ProcedureOptions {
    platforms: string[];
}

export class Procedure {
    readonly description: string;

    private platforms?: string[];

    private command: string;
    private args: string[];

    constructor(
        private config: ProcedureConfiguration,
        options: ProcedureOptions
    ) {
        this.platforms = Configuration.getMatchedPlatforms(config, options.platforms);

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
        let platforms = this.platforms || [undefined];

        for (let platform of platforms) {
            console.log();
            console.log(this.description);

            let cp = spawn(this.command, this.args, {
                stdio: 'inherit'
            });

            await P.for(cp);
        }
    }
}
