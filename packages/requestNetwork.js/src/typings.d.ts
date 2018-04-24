declare module '*.json' {
    const value: any;
    export default value;
}

declare module 'requestnetworkartifacts';
declare module 'ethereumjs-util';
declare module 'bn.js';
declare module 'web3-core-promievent';
declare module 'ipfs-api';

// Interface for the web3 promiEvent. A promise combined with an event emitter
declare interface PromiseEventEmitter<T> extends Promise<T>  {
    emit: Function
    on: Function
}
