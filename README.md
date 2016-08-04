[![NPM Package](https://badge.fury.io/js/henge.svg)](https://www.npmjs.com/package/henge)

# Henge Distribution Workshop

<img alt="Henge" src="https://cloud.githubusercontent.com/assets/970430/17336611/8bcad8ec-5911-11e6-9d32-2948976b1843.png" width="240" height="240" />

Henge is a distribution workshop that makes multiplatform and multistage project
building and packaging easy and configurable.

## Installation

```sh
npm install henge --save-dev
npm install henge --global
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

A project has the following options:

- **name?:** Specify the name of distribution project, this is required for
  multi-project configuration, and defaults to `"name"` in `package.json`.
- **baseDir<sup>tpl</sup>:** Specify the project directory in which should the
  file mappings be based on.
- **files:** Specify an array of `FileMappingConfiguration`.

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

By default, the configuration above will get artifact generated at
`dist/<package-name>.zip` with a metadata file `dist/<package-name>.json`.

The artifact configuration has following options:

- **id<sup>tpl</sup>?:** Specify the ID of artifact to generate.
- **baseDir<sup>tpl</sup>:** Specify the project directory in which should the
  file mappings be based on.
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

A `string` entry, for example `"src/**"`, is equivalent to:

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

### Platform Configuration

A project configuration can have target `platform` or `platforms` specified:

```js
module.exports = {
    platforms: [
        'mips',
        'arm'
    ],
    artifact: {
        id: '{name}-{version}-{platform}'
        files: [
            {
                pattern: 'res/{platform}/**',
                path: 'res/**'
            }
        ]
    }
};
```

In this example, Henge will generate two artifact for both `mips` and `arm`
platforms. And they will have files under directory `res/mips` and `res/arm`
packed into `res` directory in artifacts respectively.

A platform entry can also be a `PlatformInfo`, which has the following options:

- **name:** Specify the name of platform.
- **variables?:** Specify additional template variables for this specific
  platform.
- **env<sup>tpl</sup>?:** Specify additional environment variables for this
  specific platform.

### Dependency Configuration

Another important feature provided by Henge is dependency handling, especially
for the purpose of packaging built products together. Henge will need to know
the metadata or zip file URL of a dependency to get it prepared:

```js
module.exports = {
    dependencies: [
        {
            name: 'static-files',
            metadata: 'http://<jenkins-hostname>/job/static-files/lastSuccessfulBuild/artifact/dist/static-files.json'
        }
    ]
};
```

Assuming that `static-files` is also distributed by Henge, the metadata
generated will tell what is/are the artifact(s).

You can also write a plugin to resolve dependencies with certain options by
yourself, consider this:

```js
module.exports = {
    dependencies: [
        {
            name: 'static-files',
            job: 'static-files'
        }
    ]
};
```

Your plugin can use your own options and generate a valid metadata or package
URL for Henge to handle. This is very helpful for multiplatform build with
several branches.

Supported options for a `DependencyConfiguration`:

- **name:** Specify the name of dependency.
- **kit?:** Whether this dependency is a tool rather than part of the product.
  If `kit` is `true`, platform related options for this dependency are then
  subject to host platform instead of target platforms.
- **multiplatform?:**
- **platform?:**
- **platforms?:**

### Procedure Configuration

### Plugin Configuration

## License

MIT License.
