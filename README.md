[![NPM Package](https://badge.fury.io/js/henge.svg)](https://www.npmjs.com/packa
ge/henge)

# Henge Distribution Workshop

<img alt="Henge" src="https://cloud.githubusercontent.com/assets/970430/17336611/8bcad8ec-5911-11e6-9d32-2948976b1843.png" width="240" height="240" />

Henge is a distribution workshop that makes multiplatform and multistage project
building and packaging easy and configurable. It is originally designed for
building projects of [Ruff](https://ruff.io/), of which many projects are
required to be compiled for multiple platforms, including desktop operating
systems and embedded operating systems. This makes handling dependencies and
packaging for different platforms and branches a painful story.

## Installation

```sh
npm install henge --save-dev
npm install henge --global
```

## Usage

For a complete configuration options, please checkout, for now,
[src/core/configuration.ts](src/core/configuration.ts).

## Project Configuration

A `dist.config.js` file may export one or more `ProjectConfiguration`:

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

A `ProjectConfiguration` has the following options:

- **name?:** Name of distribution project, this is required for multi-project
  configuration, and defaults to the value of field `"name"` in `package.json`.
- **version?:** Version of distribution project, defaults to the value of field
  `"version"` in `package.json`.
- **distDir?:** Distribution directory, defaults to `dist` folder under project
  directory.
- **depsDir?:** Directory for dependencies, defaults to `deps` folder under
  distribution directory.
- **plugins?:** An array of plugins to be loaded, could either be the name of an
  npm package or a path to JavaScript module.
- **host?:** Host options.
  - **platform?:** Host platform, defaults to `process.platform`.
- **platforms?:** An array of target platforms, could also be a
  `string` of configuration JSON file URL<sup>tpl</sup>.
- **platform?:** Target platform.
- **dependencies?:** Artifacts this distribution depends on.
- **procedures?:** Procedures to be proceeded for this distribution.
- **artifact?:** Artifact configuration for this distribution.

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

- **id<sup>tpl</sup>?:** The ID of artifact to generate.
- **baseDir<sup>tpl</sup>:** Specify the project directory in which should the
  file mappings be based on.
- **targetDir<sup>tpl</sup>:** The target directory inside artifact.
- **files:** An array of `FileMappingConfiguration`.

#### File Mapping Configuration

An entry in `files` field is a `FileMappingConfiguration`, which could be either
a `string` or a `FileMappingDescriptor` with the following options:

- **pattern<sup>tpl</sup>:** The pattern that matches project files to be added.
- **baseDir<sup>tpl</sup>?:** Specify the project directory in which should the
  mapping be based on.
- **package?:** Specify the dependency package in which should the mapping be
  based on.
- **path<sup>tpl</sup>?:** The path of file inside the artifact, defaults to the
  same value of `pattern` option.
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

The file mapping of Henge provides a light-weight, yet flexible way to mapping
the source to path in an artifact.

Option `pattern` supports `*` (wildcard) and `**` (glob stars). For example, to
match all `.js` files under `src` folder, we may have `'src/**/*.js'`.

Correspondent `*` and `**` (counting from end to the beginning) in `path` will
be expanded to form an actual path. For example, if `pattern` `'src/**/*.js'`
matches file `src/foo/bar/stone.js`, `path` `'out/**/*/index.js'` will be
expanded as `out/foo/bar/stone/index.js`.

Henge will append `Path.basename(pattern)` to `path` automatically if it
ends with `/`. For example, the following two configurations are equivalent:

```js
{
    pattern: 'foo/*.js',
    path: 'bar/'
}
```

```js
{
    pattern: 'foo/*.js',
    path: 'bar/*.js'
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

- **name:** Name of platform.
- **variables?:** Additional template variables for this specific platform.
- **env<sup>tpl</sup>?:** Additional environment variables for this specific
  platform.

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

- **name:** Name of the artifact this distribution depends on.
- **kit?:** Whether this dependency is a tool rather than part of the product.
  If `kit` is `true`, platform related options for this dependency are then
  subject to host platform instead of target platforms.
- **multiplatform?:** If true, it's equivalent to have `platforms` option the
  same values as `project.platforms` or `[host.platform]` if `kit` is true. And
  the dependency will be extracted in folder with no `-{platform}` suffix.
- **platforms?:** Specify dependency of what platforms is to be prepared.
- **platform?:** Specify dependency of what platform is to be prepared.
- **targetDir<sup>tpl</sup>?:** Target directory to extract this dependency.

### Procedure Configuration

A `ProcedureConfiguration` entry has following options:

- **description?:** Description of this procedure.
- **task?:** A task procedure, could be either a `string` or
  `TaskDescriptor`.
- **command?:** A command procedure, could be either a `string` or
  `CommandDescriptor`.
- **multiplatform?:** If true, it's equivalent to have `platforms` option the
  same values as `project.platforms`.
- **platforms?:** Specify on what platforms should this procedure be executed.
- **platform?:** Specify on what platform should this procedure be executed.

#### Task Configuration

A task configured as string `"<task-name>"` is equivalent to the following
`TaskDescriptor`:

```js
{
    name: '<task-name>'
}
```

It will be executed as `npm run <task-name>`. If any arguments, it will be
executed as `npm run <task-name> -- <...args>`.

A `TaskDescriptor` has following options:

- **name:** Name of npm task.
- **cwd<sup>tpl</sup>?:** Working directory for the task.
- **env<sup>tpl</sup>?:** Environment variables for this task.
- **args<sup>tpl</sup>?:** Arguments for this task.

#### Command Configuration

A command configured as string `"<command-name>"` is equivalent to the following
`CommandDescriptor`:

```js
{
    name: '<command-name>'
}
```

A `CommandDescriptor` has following options:

- **name:** Name of command.
- **cwd<sup>tpl</sup>?:** Working directory for the command.
- **env<sup>tpl</sup>?:** Environment variables for this command.
- **args<sup>tpl</sup>?:** Arguments for this command.

## Variables

A variable is used in a configuration with template support. For example, I have
`artifact.id` configured as `'{name}-{version}-{platform}'` for generating
artifacts named after the template.

Many of Henge options (those marked with<sup>tpl</sup>) support template
placeholders, and here is a table of built-in variables:

### Project Scope Variables

| Name | Description |
| --- | --- |
| `name` | Name of the project |
| `version` | Version of the project |
| `host.platform` | Host platform of the project |
| `env.<name>` | Environment variable |
| `...` | Additional variables added by plugins |

### Dependency/Procedure/Artifact Scope Variables

| Name | Description |
| --- | --- |
| `platform` | Platform of one target artifact |
| `...` | Additional variables defined with platforms |

## License

MIT License.
