import * as FS from 'fs';
import * as Path from 'path';

import { ExpectedError } from 'clime';
import * as semver from 'semver';

import {
    PackageData
} from '../core';

export class JSONFile<T> {
    readonly dir: string;
    data: T;

    constructor(
        public readonly path: string
    ) {
        this.dir = Path.dirname(path);
        this.data = require(path);
    }
}

export function getPackageFile(dir: string): JSONFile<PackageData> {
    while (true) {
        let packageFilePath = Path.join(dir, 'package.json');

        if (FS.existsSync(packageFilePath)) {
            let packageFile: JSONFile<PackageData>;

            try {
                packageFile = new JSONFile<PackageData>(packageFilePath);
            } catch (error) {
                throw new ExpectedError('Error loading `package.json` file');
            }

            let {
                name,
                version
            } = packageFile.data;

            if (!name || name !== encodeURIComponent(name.toLowerCase())) {
                throw new ExpectedError('Invalid package name.');
            }

            if (!semver.valid(version)) {
                throw new ExpectedError('Invalid package version.');
            }

            return packageFile;
        } else {
            let previousDir = dir;
            dir = Path.dirname(dir);

            if (previousDir === dir) {
                throw new ExpectedError('No `package.json` file found');
            }
        }
    }
}
