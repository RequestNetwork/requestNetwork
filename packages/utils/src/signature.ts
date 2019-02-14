import { Identity as IdentityTypes, Signature as SignatureTypes } from '@requestnetwork/types';
import Crypto from './crypto';

/**
 * Function to manage Request Logic Signature
 */
export default {
  getIdentityFromSignatureParams,
  recover,
  sign,
};

/**
 * Function to get the signer identity from the signature parameters
 *
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns REQUEST_ROLE the role of the signer (payee, payer or third party)
 */
function getIdentityFromSignatureParams(
  signatureParams: SignatureTypes.ISignatureParameters,
): IdentityTypes.IIdentity {
  if (signatureParams.method === SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA) {
    return {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: Crypto.EcUtils.getAddressFromPrivateKey(signatureParams.privateKey),
    };
  }

  throw new Error('signatureParams.method not supported');
}

/**
 * Function to sign data from signature parameters
 *
 * @param any data the data to sign
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns ISignature the signature
 */
function sign(
  data: any,
  signatureParams: SignatureTypes.ISignatureParameters,
): SignatureTypes.ISignedData {
  let value: string;
  if (signatureParams.method === SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA) {
    value = Crypto.EcUtils.sign(signatureParams.privateKey, Crypto.normalizeKeccak256Hash(data));
    return { data, signature: { method: signatureParams.method, value } };
  }

  throw new Error('signatureParams.method not supported');
}

/**
 * Function to recover signer identity from signature
 *
 * @param ISignedData signedData the data signed
 *
 * @returns IIdentity identity of the signer
 */
function recover(signedData: SignatureTypes.ISignedData): IdentityTypes.IIdentity {
  let value: string;
  if (signedData.signature.method === SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA) {
    value = Crypto.EcUtils.recover(
      signedData.signature.value,
      Crypto.normalizeKeccak256Hash(signedData.data),
    );
    return {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value,
    };
  }

  throw new Error('signatureParams.method not supported');
}
