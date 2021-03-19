import { IdentityTypes, SignatureProviderTypes, SignatureTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

import { providers } from 'ethers';

/**
 * Implementation of the web3 signature provider
 * Allows to sign() with "Ethereum_address" identities
 */
export default class Web3SignatureProvider implements SignatureProviderTypes.ISignatureProvider {
  /** list of supported signing method */
  public supportedMethods: SignatureTypes.METHOD[] = [SignatureTypes.METHOD.ECDSA_ETHEREUM];
  /** list of supported identity types */
  public supportedIdentityTypes: IdentityTypes.TYPE[] = [IdentityTypes.TYPE.ETHEREUM_ADDRESS];

  /** public for test purpose */
  public web3Provider: providers.Web3Provider;

  public constructor(web3Provider: any) {
    try {
      this.web3Provider = new providers.Web3Provider(web3Provider);
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
    const signerEthers = this.web3Provider.getSigner(signer.value);

    let signatureValue;
    try {
      signatureValue = await signerEthers.signMessage(Buffer.from(normalizedData));
    } catch (error) {
      // tslint:disable-next-line:no-magic-numbers
      if (error.code === -32602) {
        throw new Error(`Impossible to sign for the identity: ${signer.value}`);
      }
      throw error;
    }

    // some wallets (like Metamask) do a personal_sign (ECDSA_ETHEREUM),
    //  some (like Trust) do a simple sign (ECDSA)
    const signedData =
      this.getSignedData(data, signatureValue, SignatureTypes.METHOD.ECDSA_ETHEREUM, signer) ||
      this.getSignedData(data, signatureValue, SignatureTypes.METHOD.ECDSA, signer);

    if (!signedData) {
      throw new Error('Signature failed!');
    }

    return signedData;
  }

  /** Get the signed data, if valid, null if not */
  private getSignedData(
    data: any,
    value: string,
    method: SignatureTypes.METHOD,
    signer: IdentityTypes.IIdentity,
  ): SignatureTypes.ISignedData | null {
    const signedData = {
      data,
      signature: {
        method,
        value,
      },
    };
    if (Utils.identity.areEqual(Utils.signature.recover(signedData), signer)) {
      return signedData;
    }
    return null;
  }
}
