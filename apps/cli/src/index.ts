import {Cli, Builtins} from 'clipanion';
import {LoadUCRToDb} from './loadUCR/loadUCRToDb.ts';


const [node, app, ...args] = process.argv;

// console.info( {node, app, args});

const cli = new Cli({
    binaryLabel: `My Application`,
    binaryName: `${node} ${app}`,
    binaryVersion: `1.0.0`,
})

cli.register(Builtins.HelpCommand);
cli.register(LoadUCRToDb);
cli.runExit(args);