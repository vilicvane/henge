# Henge Distribution Workshop

<img alt="Henge" src="https://cloud.githubusercontent.com/assets/970430/17336611/8bcad8ec-5911-11e6-9d32-2948976b1843.png" width="240" height="240" />

Henge is a distribution workshop that makes multiplatform and multistage project
building and packaging easy and configurable.

## Install

```sh
npm install henge --save-dev
```

## Usage

Henge is actually a command-line tool. to use it for CI build, just add a
related command to `"scripts"` property of `package.json`:

```json
{
    "scripts": {
        "build": "tsc -p .",
        "dist": "henge dist"
    }
}
```

Then configure the CI with proper `npm run` command:

```sh
npm run dist
```

But before that could happen, a `dist.config.js` file is to be created:

```js
'use strict';

module.exports = {
    procedures: [
        {
            description: 'Build TypeScript files',
            task: 'build'
        }
    ],
    artifact: {
        files: [
            'bld/**',
            'package.json'
        ]
    }
};
```

For a complete configuration options, please checkout, for now,
[[src/core/configuration.ts]].
