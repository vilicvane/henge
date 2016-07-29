import * as Path from 'path';

import { ExpectedError } from 'clime';
import { DotGit } from 'dotgit';

import {
    ArtifactMetadata,
    Plugin,
    Project
} from '../core';

export class Commit {
    short: string;
    long: string;

    constructor(hash: string) {
        this.long = hash;
        this.short = hash.substr(0, 7);
    }

    toString(): string {
        return this.short;
    }
}

export default class extends Plugin {
    loadVariables(project: Project): Dictionary<any> {
        let git = new DotGit(project.dir);
        let commit = new Commit(git.head);

        return {
            commit
        };
    }

    processArtifactMetadata(metadata: ArtifactMetadata, project: Project): void {
        let commit = project.variables['commit'] as Commit;
        metadata['commit'] = commit.long;
    }
}
