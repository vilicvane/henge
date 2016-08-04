import * as Chalk from 'chalk';

export function id(text: string): string {
    return Chalk.bold.yellow(`"${text}"`);
}

export function path(text: string): string {
    return Chalk.green(`"${text}"`);
}

export function url(text: string): string {
    return Chalk.cyan(text);
}

export function label(text: string): string {
    return Chalk.bold.cyan(`${text}:`);
}

export function dim(text: string): string {
    return Chalk.gray(text);
}
