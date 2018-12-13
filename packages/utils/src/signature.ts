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
 * @param string data the data to sign
 * @param ISignatureParameters signatureParams Signature parameters
 *
 * @returns ISignature the signature
 */
function sign(
  data: string,
  signatureParams: SignatureTypes.ISignatureParameters,
): SignatureTypes.ISignature {
  let value: string;
  if (signatureParams.method === SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA) {
    value = Crypto.EcUtils.sign(signatureParams.privateKey, data);
    return { method: signatureParams.method, value };
  }

  throw new Error('signatureParams.method not supported');
}

/**
 * Function to recover signer identity from signature
 *
 * @param string data the data signed
 * @param ISignature signature the signature itself
 *
 * @returns IIdentity identity of the signer
 */
function recover(data: string, signature: SignatureTypes.ISignature): IdentityTypes.IIdentity {
  let value: string;
  if (signature.method === SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA) {
    value = Crypto.EcUtils.recover(signature.value, data);
    return {
      type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value,
    };
  }

  throw new Error('signatureParams.method not supported');
}
