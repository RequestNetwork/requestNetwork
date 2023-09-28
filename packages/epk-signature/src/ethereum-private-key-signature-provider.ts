import { IdentityTypes, SignatureProviderTypes, SignatureTypes } from '@requestnetwork/types';

import { ecSign, edSign, getAddressFromEcPrivateKey, getAddressFromEdPrivateKey, getPublicKeyFromEdPrivateKey, normalizeKeccak256Hash } from '@requestnetwork/utils';

/** Type of the dictionary of signatureParameters (private keys) indexed by ethereum address */
type ISignatureParametersDictionary = Map<string, SignatureTypes.ISignatureParameters>;

/**
 * Implementation of the signature provider from private key
 * Allows to sign() with "Ethereum_address" identities thanks to their private key given in constructor() or addSignatureParameters()
 */
export default class EthereumPrivateKeySignatureProvider
  implements SignatureProviderTypes.ISignatureProvider
{
  /** list of supported signing method */
  public supportedMethods: SignatureTypes.METHOD[] = [SignatureTypes.METHOD.ECDSA, SignatureTypes.METHOD.EDDSA_POSEIDON];
  /** list of supported identity types */
  public supportedIdentityTypes: IdentityTypes.TYPE[] = [IdentityTypes.TYPE.ETHEREUM_ADDRESS, IdentityTypes.TYPE.POSEIDON_ADDRESS];

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
    rawSignature = false
  ): Promise<SignatureTypes.ISignedData> {
    const method = signer.type === IdentityTypes.TYPE.POSEIDON_ADDRESS ? SignatureTypes.METHOD.EDDSA_POSEIDON : SignatureTypes.METHOD.ECDSA;

    const actualSigner = signer;
    if (!this.supportedIdentityTypes.includes(actualSigner.type)) {
      throw Error(`Identity type not supported ${actualSigner.type}`);
    }

    // toLowerCase to avoid mismatch because of case
    const signatureParameter: SignatureTypes.ISignatureParameters | undefined =
      this.signatureParametersDictionary.get(actualSigner.value.toLowerCase());

    if (!signatureParameter) {
      throw Error(`private key unknown for the address ${actualSigner.value}`);
    }

    if(method === SignatureTypes.METHOD.ECDSA) {
      // the hash format in request start by 01 but the ec-utils need a hash starting by 0x
      const hashData = normalizeKeccak256Hash(data).value;
      const signatureValue = ecSign(signatureParameter.privateKey, hashData);

      return {
        data,
        signature: {
          method,
          value: signatureValue,
        },
      };
    } else if(method === SignatureTypes.METHOD.EDDSA_POSEIDON) {
      // the hash format in request start by 01 but the ec-utils need a hash starting by 0x
      const dataToSign = rawSignature ? data : normalizeKeccak256Hash(data).value;
      const signatureValue = await edSign(signatureParameter.privateKey, dataToSign);
      const pubKey = await getPublicKeyFromEdPrivateKey(signatureParameter.privateKey);
      return {
        data,
        signature: {
          method,
          // add publickey for recover
          value: signatureValue.concat(pubKey), 
        },
        raw: rawSignature,
      };
    } else {
      throw Error(`Signing method not supported ${method}`);
    }

  }

  /**
   * Function to add a new private key in the provider
   *
   * @param ISignatureParameters signatureParams signature parameters to add
   *
   * @returns IIdentity identity from the signature parameter added
   */
  public async addSignatureParameters(
    signatureParams: SignatureTypes.ISignatureParameters,
  ): Promise<IdentityTypes.IIdentity> {
    if(signatureParams.method === SignatureTypes.METHOD.ECDSA) {
      // compute the address from private key
      // toLowerCase to avoid mismatch because of case
      const address = getAddressFromEcPrivateKey(signatureParams.privateKey).toLowerCase();

      this.signatureParametersDictionary.set(address, signatureParams);

      return {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: address,
      };
    } else if(signatureParams.method === SignatureTypes.METHOD.EDDSA_POSEIDON) {
      // compute the address from private key
      // toLowerCase to avoid mismatch because of case
      const address = (await getAddressFromEdPrivateKey(signatureParams.privateKey)).toLowerCase();

      this.signatureParametersDictionary.set(address, signatureParams);

      return {
        type: IdentityTypes.TYPE.POSEIDON_ADDRESS,
        value: address,
      };
    } else {
      throw Error(`Signing method not supported ${signatureParams.method}`);
    }

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
    return Array.from(this.signatureParametersDictionary.keys(), (address) => ({
      type: this.signatureParametersDictionary.get(address)?.method === SignatureTypes.METHOD.ECDSA ? IdentityTypes.TYPE.ETHEREUM_ADDRESS : IdentityTypes.TYPE.POSEIDON_ADDRESS,
      value: address,
    }));
  }
}
