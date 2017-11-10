export enum State { Created, Accepted, Declined, Canceled }

export type CallbackTransactionHash = (transactionHash:string) => void;
export type CallbackTransactionReceipt = (receipt:Object) => void;
export type CallbackTransactionConfirmation = (confirmationNumber:number, receipt:Object) => void;
export type CallbackTransactionError = (error:Error) => void;

export interface Artifact {
    abi: any;
    networks: {[networkId: number]: {
        address: string;
    }};
}