



```ts

```

```ts
let distribution = new Distribution();

let project = new Project('sys-gpio');

distribution.add(project);

```

## native-modules

### `sys-gpio/distribution-project.json`

```json
{
    "name": "sys-gpio",
    "scripts": {
        "prebuild": "cmake .",
        "build": "make"
    },
    "platforms": [
        {
            "name": "mips",
            "env": {}
        },
        {
            "name": "arm",
            "env": {}
        }
    ],
    "files": [
        {
            "path": "src/*",
            "transforms": [
                "ruff-build-babel"
            ]
        },
        {
            "source": "build/Release/gpio.so",
            "path": "bin/gpio.so",
            "transforms": []
        },
        "package.json",
        "driver.json",
        "README.md"
    ]
}
```

### Generated `distribution-metadata.json`

```json
{
    "version": "1.3.0",
    "commit": "fe9cc48c5a83be2dfd682a3021835317009de08d",
    "artifacts": [
        {
            "name": "native-modules",
            "uid": "native-modules-v1.3.0-develop-0719-1-mips",
            "platform": "mips",
            "format": "zip",
            "path": "build/mips/native-modules-v1.3.0-develop-0719-1-mips.zip"
        },
        {
            "name": "native-modules",
            "uid": "native-modules-v1.3.0-develop-0719-1-arm",
            "platform": "arm",
            "format": "zip",
            "path": "build/arm/native-modules-v1.3.0-develop-0719-1-arm.zip"
        }
    ]
}
```

## rap-cli

### Commands

```sh
henge
```

### `dist.config.js`

```js
module.exports = [
    {
        name: 'rap-cli',
        procedures: [
            {
                description: 'compile JavaScript files',
                task: 'compile-javascript'
            },
            {
                description: 'build executables',
                platform: process.platform,
                task: {
                    name: 'build-executable',
                    args: [
                        '--platform', '${platform}'
                    ]
                }
            }
        ],
        artifact: {
            id: '{name}-v{version}-{ref}-{build}-{platform}',
            files: [
                {
                    root: 'build',
                    path: 'bin/*'
                },
                'template/**',
                'static/**',
                'lib/**',
                'package.json'
            ]
        }
    },
    {
        name: 'rap-cli-docs',
        procedures: [
            {
                description: 'compile markdown documentations',
                task: 'compile-docs'
            }
        ],
        artifact: {
            id: '{name}-v{version}-{ref}-{build}',
            root: 'docs',
            files: [
                '**'
            ]
        }
    }
];

foo(function () {

});

function foo(callback) {

}
```

## rap-sdk

```js
module.exports = {
    name: 'ruff-sdk',
    plugins: [
        'ruff-build-jenkins'
    ],
    dependencies: [
        {
            name: 'rap-cli',
            job: 'odin-cross-platform',
            multiplatform: true
        },
        {
            name: 'rap-cli-docs',
            job: 'odin-docs'
        },
        {
            name: 'ruff',
            job: 'ruff-cross-platform',
            multiplatform: true
        }
    ],
    platforms: [
        'win32',
        'darwin',
        'linux'
    ],
    artifact: {
        id: '{name}-v{version}-{ref}-{build}-{platform}',
        files: [
            {
                package: 'rap-cli',
                path: '**'
            },
            {
                package: 'rap-cli-docs',
                source: '**'
                path: 'docs/'
            },
            {
                package: 'ruff',
                path: '**'
            }
        ]
    }
};
```

### ``

### `docs/distribution-project.json`

```json
{
    ""
}
```

### Generated `distribution-metadata.json`

```json
{
    "name": "rap-cli",
    "version": "1.3.0",
    "commit": "fe9cc48c5a83be2dfd682a3021835317009de08d",
    "artifacts": [
        {
            "id": "rap-cli-v1.3.0-develop-0719-1-win32",
            "name": "rap-cli",
            "platform": "win32",
            "format": "zip",
            "path": "build/win32/rap-cli-v1.3.0-develop-0719-1-win32.zip"
        },
        {
            "id": "rap-cli-v1.3.0-develop-0719-1-darwin",
            "name": "rap-cli",
            "platform": "darwin",
            "format": "zip",
            "path": "build/darwin/rap-cli-v1.3.0-develop-0719-1-darwin.zip"
        },
        {
            "id": "rap-cli-v1.3.0-develop-0719-1-linux",
            "name": "rap-cli",
            "platform": "linux",
            "format": "zip",
            "path": "build/linux/rap-cli-v1.3.0-develop-0719-1-linux.zip"
        },
        {
            "id": "rap-cli-docs-v1.3.0-develop-0719-1",
            "name": "rap-cli-docs",
            "format": "zip",
            "path": "build/rap-cli-docs-v1.3.0-develop-0719-1.zip"
        }
    ]
}
```
