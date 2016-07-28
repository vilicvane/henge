#!/usr/bin/env node

import 'source-map-support/register';

import * as Path from 'path';
import { CLI, Shim } from 'clime';

let cli = new CLI('henge', Path.join(__dirname, 'commands'));

export default cli;

let shim = new Shim(cli);

shim.execute(process.argv);
