export enum State { Created, Accepted, Canceled }
export enum EscrowState { Created, Refunded, Released }

export type CallbackTransactionHash = (transactionHash: string) => void;
export type CallbackTransactionReceipt = (receipt: any) => void;
export type CallbackTransactionConfirmation = (confirmationNumber: number, receipt: any) => void;
export type CallbackTransactionError = (error: Error) => void;

export type CallbackGetRequest = (err: Error, request: any) => void;

export type CallbackIpfsAddFile = (err: Error, hash: string) => void;
export type CallbackIpfsGetFile = (err: Error, data: string) => void;

export type CallbackErrorData = (err: Error | undefined, data: string | undefined) => void;

export interface InterfaceArtifact {
    abi: any;
    networks: {[networkName: string]: {
        address: string;
        blockNumber: string;
    }};
}
