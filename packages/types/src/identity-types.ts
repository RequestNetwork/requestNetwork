/** Identity */
export interface IIdentity {
  // type of the identification
  type: TYPE;
  // the identification itself
  value: string;
  // extra information
  extra?: IExtraInfoIdentity;
}

/** Extra information specific to identity types */
export interface IExtraInfoIdentity {
  /**
   * The smart contract network (e.g.: 'mainnet', 'rinkeby', 'bank_sandbox')
   * Used only for the type ETHEREUM_SMART_CONTRACT
   */
  network?: string;
}

/** Supported identity types */
export enum TYPE {
  ETHEREUM_ADDRESS = 'ethereumAddress',
  ETHEREUM_SMART_CONTRACT = 'ethereumSmartContract',
}
