# Henge Distribution Workshop

<img alt="Henge" src="https://cloud.githubusercontent.com/assets/970430/17336611/8bcad8ec-5911-11e6-9d32-2948976b1843.png" width="240" height="240" />

Henge is a distribution workshop that makes multiplatform and multistage project
building and packaging easy and configurable.

## Install

```sh
npm install henge --save-dev
```

## Usage

For a complete configuration options, please checkout, for now,
[src/core/configuration.ts](src/core/configuration.ts).

## Distribution Configuration

A `dist.config.js` file may export one or more project distribution
configurations:

```js
module.exports = {
    artifact: {}
};
```

Or:

```js
module.exports = [
    {
        name: 'desktop',
        artifact: {}
    },
    {
        name: 'mobile',
        artifact: {}
    }
];
```

Option `"name"` is required for multi-project configurations, for single project
configuration, it defaults to `"name"` in `package.json`.

You can specify project(s) to be distributed by adding project name(s) to
command `henge dist`:

```sh
# Distribute project with name "mobile" only.
henge dist mobile
```

### Artifact Configuration

Configurable artifact packaging is one of the most important features provided
by Henge. To have Henge packaging what you need, just specify patterns of files
to be packed.

Execute `henge dist` with the following `dist.config.js` configuration file will
have all files under `src`, `package.json` and `README.md` to be packed into
artifact with the same file structure:

```js
module.exports = {
    artifact: {
        files: [
            'src/**',
            'package.json',
            'README.md'
        ]
    }
};
```

#### Artifact Configuration

The artifact configuration has following options:

- **id<sup>tpl</sup>?:** Specify the ID of artifact to generate.
- **files:** Specify an array of `FileMappingConfiguration`.

#### File Mapping Configuration

An entry in `files` field is a `FileMappingConfiguration`, which could be either
a `string` or a `FileMappingDescriptor` with the following options:

- **pattern<sup>tpl</sup>:** Specify pattern that matches project files to be
  added.
- **baseDir<sup>tpl</sup>?:** Specify the project directory in which should the
  mapping be based on.
- **package?:** Specify the dependency package in which should the mapping be
  based on.
- **path<sup>tpl</sup>?:** Specify the path of file inside the artifact,
  defaults to the same value of `pattern` option.
- **platform?:** Limit this file mapping configuration to specific platform.
- **platforms?:** Limit this file mapping configuration to specific platforms.

An `string` entry, for example `"src/**"`, is equivalent to:

```js
{
    pattern: 'src/**'
}
```

And as `path` defaults to the value of `pattern`, this example is equivalent to:

```js
{
    pattern: 'src/**',
    path: 'src/**'
}
```
