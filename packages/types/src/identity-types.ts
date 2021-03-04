import { EnumToType } from './shared';

/** Identity */
export interface IIdentity {
  // type of the identification
  type: TYPE;
  // the identification itself
  value: string;
}

/** Identity for Ethereum Smart contract */
export interface ISmartContractIdentity extends IIdentity {
  // The smart contract network (e.g.: 'mainnet', 'rinkeby', 'bank_sandbox')
  network?: string;
}

export const TYPE = {
  ETHEREUM_ADDRESS: 'ethereumAddress',
  ETHEREUM_SMART_CONTRACT: 'ethereumSmartContract',
} as const;

/** Supported identity types */
export type TYPE = EnumToType<typeof TYPE>;
