import { IdentityTypes, SignatureProviderTypes, SignatureTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

/** Type of the dictionary of signatureParameters (private keys) indexed by ethereum address */
type ISignatureParametersDictionary = Map<string, SignatureTypes.ISignatureParameters>;

/**
 * Implementation of the signature provider from private key
 * Allows to sign() with "Ethereum_address" identities thanks to their private key given in constructor() or addSignatureParameters()
 */
export default class EthereumPrivateKeySignatureProvider
  implements SignatureProviderTypes.ISignatureProvider {
  /** list of supported signing method */
  public supportedMethods: SignatureTypes.METHOD[] = [SignatureTypes.METHOD.ECDSA];
  /** list of supported identity types */
  public supportedIdentityTypes: IdentityTypes.TYPE[] = [IdentityTypes.TYPE.ETHEREUM_ADDRESS];

  /** Dictionary containing all the private key indexed by address */
  private signatureParametersDictionary: ISignatureParametersDictionary;

  constructor(signatureParameter?: SignatureTypes.ISignatureParameters) {
    // using Map allow to easily remove dynamically entries
    this.signatureParametersDictionary = new Map<string, SignatureTypes.ISignatureParameters>();
    if (signatureParameter) {
      this.addSignatureParameters(signatureParameter);
    }
  }

  /**
   * Signs data
   *
   * @param string data the data to sign
   * @returns IIdentity the identity to sign with if not given, the default signer will be used
   *
   * @returns string the signature
   */
  public async sign(
    data: any,
    signer: IdentityTypes.IIdentity,
  ): Promise<SignatureTypes.ISignedData> {
    const actualSigner = signer;

    if (!this.supportedIdentityTypes.includes(actualSigner.type)) {
      throw Error(`Identity type not supported ${actualSigner.type}`);
    }

    // toLowerCase to avoid mismatch because of case
    const signatureParameter:
      | SignatureTypes.ISignatureParameters
      | undefined = this.signatureParametersDictionary.get(actualSigner.value.toLowerCase());

    if (!signatureParameter) {
      throw Error(`private key unknown for the address ${actualSigner.value}`);
    }

    // the hash format in request start by 01 but the ec-utils need a hash starting by 0x
    const hashData = Utils.crypto.normalizeKeccak256Hash(data).value;
    const signatureValue = Utils.crypto.EcUtils.sign(signatureParameter.privateKey, hashData);

    return {
      data,
      signature: {
        method: SignatureTypes.METHOD.ECDSA,
        value: signatureValue,
      },
    };
  }

  /**
   * Function to add a new private key in the provider
   *
   * @param ISignatureParameters signatureParams signature parameters to add
   *
   * @returns IIdentity identity from the signature parameter added
   */
  public addSignatureParameters(
    signatureParams: SignatureTypes.ISignatureParameters,
  ): IdentityTypes.IIdentity {
    if (!this.supportedMethods.includes(signatureParams.method)) {
      throw Error(`Signing method not supported ${signatureParams.method}`);
    }

    // compute the address from private key
    // toLowerCase to avoid mismatch because of case
    const address = Utils.crypto.EcUtils.getAddressFromPrivateKey(
      signatureParams.privateKey,
    ).toLowerCase();

    this.signatureParametersDictionary.set(address, signatureParams);

    return {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: address,
    };
  }

  /**
   * Function to remove a private key from the provider
   *
   * @param IIdentity identity identity to remove the private key
   *
   * @returns void
   */
  public removeRegisteredIdentity(identity: IdentityTypes.IIdentity): void {
    // Check the type of the identity to be sure that the value used to delete will be the right type
    if (!this.supportedIdentityTypes.includes(identity.type)) {
      throw Error(`Identity type not supported ${identity.type}`);
    }

    this.signatureParametersDictionary.delete(identity.value);
  }

  /**
   * Function to remove a private key from the provider
   *
   * @param IIdentity identity identity to remove the private key
   *
   * @returns void
   */
  public clearAllRegisteredIdentities(): void {
    this.signatureParametersDictionary.clear();
  }

  /**
   * Function to get all the identities available to sign with
   *
   * @returns IIdentity all the identities registered
   */
  public getAllRegisteredIdentities(): IdentityTypes.IIdentity[] {
    return Array.from(this.signatureParametersDictionary.keys(), address => ({
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: address,
    }));
  }
}
