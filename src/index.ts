export * from './metadata';

import {
    FileWalker
} from './utils/file-walker';

// import {
//     Distribution,
//     Bundle
// } from './core/distribution';

// import * as FS from 'fs';

// import { invoke } from 'thenfail';

// let distribution = new Distribution({});

// const projects = ['foo', 'bar'];

// for (let projectName of projects) {
//     // let bundle = new Bundle({
//     //     ''
//     // });


// }

// let readdir = FS.readdir;

// (<any>FS).readdir = function (path: string) {
//     console.log(path);
//     return readdir.apply(FS, arguments);
// };

(async () => {
    try {
        let pattern = 'typings/**/*.d.ts';

        let walker = new FileWalker(pattern);

        await walker.walk('.', (path, captures) => {
            console.log(path, captures);
        });
    } catch (error) {
        console.log(error);
    }
})();
