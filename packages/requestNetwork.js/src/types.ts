import BigNumber = require('bn.js');

export type CallbackTransactionHash = (transactionHash: string) => void;
export type CallbackTransactionReceipt = (receipt: any) => void;
export type CallbackTransactionConfirmation = (confirmationNumber: number, receipt: any) => void;
export type CallbackTransactionError = (error: Error) => void;
export type CallbackErrorData = (err: Error | undefined, data: string | undefined) => void;

// Role in a Request
export enum Role {
    Payer,
    Payee,
}

// Currency of a Request
export enum Currency {
    ETH,
    BTC,
    REQ,
    KNC,
    DGX,
    DAI,
    OMG,
    KIN,
    ZRX,
    BAT,
    BNB,
    LINK,
}

// State of the Request
export enum State {
    Created,
    Accepted,
    Canceled,
}

// Information for a Request Payee
export interface IPayee {
    idAddress: string;
    paymentAddress: string;
    expectedAmount: Amount;
    balance?: Amount;
    additional?: Amount;
    amountToPayAtCreation?: Amount;
    address?: string; // HACK for getData()
}

// Information for a Request Payer
export interface IPayer {
    idAddress: string;
    refundAddress?: string;
    bitcoinRefundAddresses?: string[];
}

// Data of a Request
export interface IRequestData {
    creator: Role;
    currencyContract: object;
    data: any;
    payee: IPayee;
    payer: IPayer;
    requestId: string;
    state: State;
    subPayees: IPayee[];
}

// Data of a Signed Request
export interface ISignedRequestData {
    currencyContract: string;
    data: string;
    expectedAmounts: Amount[];
    expirationDate: number;
    extension: string;
    extensionParams: any[];
    hash: string;
    payeesIdAddress: string;
    payeesPaymentAddress: string[];
    signature: string;
}

// Interface for events coming from the blockchain
export interface IEvent {
    _meta: { blockNumber: number, logIndex: number, timestamp: number };
    data: any;
    name: string;
}

// Transaction options: Ethereum transaction options + some of our own
export interface ITransactionOptions {
    value?: Amount;
    gas?: Amount;
    gasPrice?: Amount;
    numberOfConfirmation?: number;
    from?: string;
    skipERC20checkAllowance?: boolean;
}

// Possible options when creating a Request
export interface IRequestCreationOptions {
    data?: any;
    extensions?: object;
    transactionOptions?: ITransactionOptions;
}

// options depending on currency when broadcasting a Request
export interface IBroadcastCurrencyOptions {
    amountsToPayAtCreation?: Amount[];
}

// Type for every amount information coming to the library
// The library is designed to accept number, string and BigNumber as amount input
export type Amount = number | string | typeof BigNumber;
