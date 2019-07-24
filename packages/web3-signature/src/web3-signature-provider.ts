import {
  IdentityTypes,
  SignatureProviderTypes,
  SignatureTypes,
} from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

const ETH = require('web3-eth');

/**
 * Implementation of the web3 signature provider
 * Allows to sign() with "Ethereum_address" identities
 */
export default class EthereumPrivateKeySignatureProvider
  implements SignatureProviderTypes.ISignatureProvider {
  /** list of supported signing method */
  public supportedMethods: SignatureTypes.METHOD[] = [SignatureTypes.METHOD.ECDSA_ETHEREUM];
  /** list of supported identity types */
  public supportedIdentityTypes: IdentityTypes.TYPE[] = [IdentityTypes.TYPE.ETHEREUM_ADDRESS];

  /** public for test purpose */
  public eth: any;

  public constructor(web3Provider: any) {
    try {
      this.eth = new ETH(web3Provider);
    } catch (error) {
      throw Error(`Can't initialize web3-eth ${error}`);
    }
  }

  /**
   * Signs data
   *
   * @param data The data to sign
   * @param signer The identity to sign with
   *
   * @returns The signed data
   */
  public async sign(
    data: any,
    signer: IdentityTypes.IIdentity,
  ): Promise<SignatureTypes.ISignedData> {
    if (!this.supportedIdentityTypes.includes(signer.type)) {
      throw Error(`Identity type not supported ${signer.type}`);
    }
    const normalizedData = Utils.crypto.normalize(data);

    const signatureValue = await this.eth.personal.sign(normalizedData, signer.value);

    return {
      data,
      signature: {
        method: SignatureTypes.METHOD.ECDSA_ETHEREUM,
        value: signatureValue,
      },
    };
  }
}
