import * as yargs from 'yargs';

export type InferArgs<P> = P extends yargs.Argv<infer T> ? T : never;
