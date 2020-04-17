---
title: Use your own signature mechanism
keywords: [Request, signature, signatureProvider]
description: Learn how to build your own signature provider.
---

In a previous chapter, we used the signature providers `@requestnetwork/web3-signature` and `@requestnetwork/epk-signature` (this one is made for test purpose). But, if you are not using web3, you need to inject your own signature mechanism to the request client.
This is fairly simple, you need to implement a class following this interface: (see on [github](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/types/src/signature-provider-types.ts))

```typescript
export interface ISignatureProvider {
  supportedMethods: Signature.METHOD[];
  supportedIdentityTypes: Identity.TYPE[];

  sign: (data: any, signer: Identity.IIdentity) => Promise<Signature.ISignedData>;
}
```

## Example 1

For example, your own package to sign need an ethereum address and return the signature as a hexadecimal string:

```typescript
class mySignaturePackage {
  /**
   * Sign data
   *
   * @param data the data to sign
   * @param address the address to sign with
   * @returns a promise resolving the signature
   */
  public async sign(data: any, address: string): Promise<string>;
}
```

Your signature provider would look like:

```typescript
import { IdentityTypes, SignatureProviderTypes, SignatureTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

// Your package
import mySignaturePackage from 'mySignaturePackage';

/**
 * Implementation of the signature provider for my wallet
 */
export default class MySignatureProvider implements SignatureProviderTypes.ISignatureProvider {
  /** list of supported signing method */
  public supportedMethods: SignatureTypes.METHOD[] = [SignatureTypes.METHOD.ECDSA];
  /** list of supported identity types */
  public supportedIdentityTypes: IdentityTypes.TYPE[] = [IdentityTypes.TYPE.ETHEREUM_ADDRESS];

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
    if (!this.supportedIdentityTypes.includes(signer.type)) {
      throw Error(`Identity type not supported ${signer.type}`);
    }

    // Hash the normalized data (e.g. avoid case sensitivity)
    const hashData = Utils.crypto.normalizeKeccak256Hash(data).value;

    // use your signature package
    const signatureValue = mySignaturePackage.sign(hashData, signer.value);

    return {
      data,
      signature: {
        method: SignatureTypes.METHOD.ECDSA,
        value: signatureValue,
      },
    };
  }
}
```

Now you can inject it into the request client:

```typescript
import MySignatureProvider from 'mySignatureProvider';

const mySignatureProvider = new MySignatureProvider();

// We can initialize the RequestNetwork class with the signature provider
const requestNetwork = new RequestNetwork.RequestNetwork({
  signatureProvider: mySignatureProvider,
});
```

## Example 2

For example, your own package to sign need an internal identifier and return the signature as a Buffer:

```typescript
class mySignaturePackage {
  /**
   * Sign a Buffer
   *
   * @param data the data to sign
   * @param walletId a way to get the right wallet to sign with
   * @returns a promise resolving the signature
   */
  public async sign(data: Buffer, walletId: number): Promise<Buffer>;
}
```

Your signature provider would look like:

```typescript
import { IdentityTypes, SignatureProviderTypes, SignatureTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

// Your package
import mySignaturePackage from 'mySignaturePackage';

/** Type of the dictionary of wallet id indexed by address */
type IWalletIdDictionary = Map<string, number>;

/**
 * Implementation of the signature provider for my wallet
 */
export default class MySignatureProvider
  implements SignatureProviderTypes.ISignatureProvider {
  /** list of supported signing method */
  public supportedMethods: SignatureTypes.METHOD[] = [SignatureTypes.METHOD.ECDSA];
  /** list of supported identity types */
  public supportedIdentityTypes: IdentityTypes.TYPE[] = [IdentityTypes.TYPE.ETHEREUM_ADDRESS];

  /** Dictionary containing all the private keys indexed by address */
  private walletIdDictionary: IWalletIdDictionary;

  constructor(identity?: IdentityTypes.IIdentity?, walletId?: number) {
    this.walletIdDictionary = new Map<string, number>();

    if (identity && walletId) {
      this.addSignatureParameters(identity, walletId);
    }
  }

  /**
   * Signs data
   *
   * @param string data the data to sign
   * @returns IIdentity the identity to sign with. If not given, the default signer will be used
   *
   * @returns string the signature
   */
  public async sign(
    data: any,
    signer: IdentityTypes.IIdentity,
  ): Promise<SignatureTypes.ISignedData> {
    if (!this.supportedIdentityTypes.includes(signer.type)) {
      throw Error(`Identity type not supported ${signer.type}`);
    }

    // toLowerCase to avoid mismatch because of case
    const walletId: number | undefined = this.walletIdDictionary.get(signer.value.toLowerCase());

    if (!walletId) {
      throw Error(`Identity unknown: ${signer.type}, ${signer.value}`);
    }

    // Hash the normalized data (e.g. avoid case sensitivity)
    const hashData = Utils.crypto.normalizeKeccak256Hash(data).value;

    // convert the hash from a string '0x...' to a Buffer
    const hashDataBuffer = Buffer.from(hashData.slice(2), 'hex')

    // use your signature package
    const signatureValueBuffer = mySignaturePackage.sign(hashDataBuffer, walletId);

    // convert the signature to a string '0x...'
    const signatureValue = `0x${signatureValueBuffer.toString('hex')}`

    return {
      data,
      signature: {
        method: SignatureTypes.METHOD.ECDSA,
        value: signatureValue,
      },
    };
  }

  /**
   * Function to add a new identity in the provider
   *
   * @param identity the new identity
   * @param walletId the wallet id matching the identity
   */
  public addIdentity(identity: IdentityTypes.IIdentity, walletId: number): void {
    if (!this.supportedIdentityTypes.includes(identity.type)) {
      throw Error(`Identity type not supported ${identity.type}`);
    }

    this.walletIdDictionary.set(identity.value.toLowerCase(), walletId);
  }
}
```

Now you can inject it into the request client:

```typescript
import MySignatureProvider from 'mySignatureProvider';

const mySignatureProvider = new MySignatureProvider(anIdentity, aWalletId);

// We can initialize the RequestNetwork class with the signature provider
const requestNetwork = new RequestNetwork.RequestNetwork({
  signatureProvider: mySignatureProvider,
});

// later on, you can even add more supported identities
mySignatureProvider.addIdentity(anotherIdentity, anotherWalletId);
```
