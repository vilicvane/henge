import * as FS from 'fs';
import * as Path from 'path';

import { ExpectedError } from 'clime';
import { invoke } from 'thenfail';

import { Dictionary } from '../lang';

export type Capture = string | string[];

export type WalkHandler = (path: string, captures: Capture[]) => void;

interface StarMatch {
    name: string;
    captures: string[];
}

export class FileWalker {
    private patterns: string[];

    private patternRegexCache: Dictionary<RegExp> = Object.create(null);

    private statsCache: Dictionary<FS.Stats | undefined> | undefined;
    private readdirCache: Dictionary<string[]> | undefined;

    constructor(filePattern: string) {
        this.patterns = Path
            .normalize(filePattern)
            .split(/[\\\/]/)
            .filter(pattern => {
                if (!pattern) {
                    return false;
                }

                if (pattern !== '**' && pattern.indexOf('**') >= 0) {
                    throw new ExpectedError(`Invalid pattern "${filePattern}"`);
                }

                return true;
            });
    }

    async walk(start: string, handler: WalkHandler): Promise<void> {
        start = Path.resolve(start);

        this.setupCaches();

        let walkedSet: Dictionary<boolean> = Object.create(null);

        await this.walkNext(start, this.patterns, [], (path, captures) => {
            if (path in walkedSet) {
                return;
            }

            walkedSet[path] = true;

            handler(Path.relative(start, path), captures);
        });

        this.clearCaches();
    }

    private setupCaches(): void {
        if (this.statsCache && this.readdirCache) {
            return;
        }

        this.statsCache = Object.create(null);
        this.readdirCache = Object.create(null);
    }

    private clearCaches(): void {
        this.statsCache = undefined;
        this.readdirCache = undefined;
    }

    private async walkNext(start: string, patterns: string[], captures: Capture[], handler: WalkHandler): Promise<void> {
        let pattern = patterns[0];

        patterns = patterns.slice(1);

        if (pattern === '**') {
            await this.walkPath(start, false, patterns, captures.concat([[]]), handler);
            await this.walkGlobStars(start, true, patterns, captures, handler);
        } else if (/\*/.test(pattern)) {
            await this.walkStar(start, pattern, patterns, captures, handler);
        } else {
            let path = Path.join(start, pattern);
            await this.walkPath(path, false, patterns, captures, handler);
        }
    }

    private async walkPath(path: string, globStars: boolean, patterns: string[], captures: Capture[], handler: WalkHandler): Promise<void> {
        let stats = await this.stat(path);

        if (!stats) {
            return;
        }

        if (stats.isDirectory()) {
            if (patterns.length) {
                await this.walkNext(path, patterns, captures, handler);
            }

            if (globStars) {
                await this.walkGlobStars(path, false, patterns, captures, handler);
            }
        } else if (stats.isFile() && !patterns.length) {
            handler(path, captures);
        }
    }

    private async walkStar(start: string, pattern: string, patterns: string[], captures: Capture[], handler: WalkHandler): Promise<void> {
        let matches = (await this.readdir(start))
            .map(name => this.matchStar(pattern, name));

        for (let match of matches) {
            if (!match) {
                continue;
            }

            let path = Path.join(start, match.name);
            await this.walkPath(path, false, patterns, captures.concat(match.captures), handler);
        }
    }

    private async walkGlobStars(start: string, first: boolean, patterns: string[], captures: Capture[], handler: WalkHandler): Promise<void> {
        let names = await this.readdir(start);

        for (let name of names) {
            let path = Path.join(start, name);

            let newCaptures = captures.concat();

            if (first) {
                newCaptures.push([name]);
            } else {
                let lastCapture = (captures[captures.length - 1] as string[]).concat();

                lastCapture.push(name);
                newCaptures[newCaptures.length - 1] = lastCapture;
            }

            await this.walkPath(path, true, patterns, newCaptures, handler);
        }
    }

    private matchStar(pattern: string, target: string): StarMatch | undefined {
        let regex: RegExp;

        if (pattern in this.patternRegexCache) {
            regex = this.patternRegexCache[pattern];
        } else {
            regex = new RegExp(`^${pattern.replace(/[^\w\d*]/g, '\\$&').replace(/\*/g, '(.*)')}$`);
            this.patternRegexCache[pattern] = regex;
        }

        let captures = regex.exec(target);

        return captures ? {
            name: captures[0],
            captures: captures.slice(1)
        } : undefined;
    }

    private async stat(path: string): Promise<FS.Stats | undefined> {
        if (path in this.statsCache!) {
            return this.statsCache![path];
        }

        let stats: FS.Stats | undefined;

        try {
            stats = await invoke<FS.Stats>(FS.stat, path);
        } catch (error) { }

        this.statsCache![path] = stats;

        return stats;
    }

    private async readdir(path: string): Promise<string[]> {
        if (path in this.readdirCache!) {
            return this.readdirCache![path];
        }

        let names = await invoke<string[]>(FS.readdir, path);

        this.readdirCache![path] = names;

        return names;
    }
}
