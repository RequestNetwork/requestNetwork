export enum State { Created, Accepted, Declined, Canceled }

export type CallbackTransactionHash = (transactionHash:string) => void;
export type CallbackTransactionReceipt = (receipt:any) => void;
export type CallbackTransactionConfirmation = (confirmationNumber:number, receipt:any) => void;
export type CallbackTransactionError = (error:Error) => void;

export type CallbackGetRequest = (err:Error, request:any) => void;

export type CallbackIpfsAddFile = (err:Error, hash:string) => void;
export type CallbackIpfsGetFile = (err:Error, data:string) => void;

export interface Artifact {
    abi: any;
    networks: {[networkId: number]: {
        address: string;
    }};
}

/* Synchrone Extension */
export enum EscrowState { Created, Refunded, Released }