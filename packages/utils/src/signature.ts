import { IdentityTypes, SignatureTypes } from '@requestnetwork/types';
import { ethers } from 'ethers';
import { EcUtils, normalizeData, normalizeKeccak256Hash } from './crypto';

/**
 * Function to manage Request Logic Signature
 */
export { getIdentityFromSignatureParams, recoverSigner, sign };

// Use to localize the parameter V in an ECDSA signature in hex format
const V_POSITION_FROM_END_IN_ECDSA_HEX = -2;

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
  if (signatureParams.method === SignatureTypes.METHOD.ECDSA) {
    return {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: EcUtils.getAddressFromPrivateKey(signatureParams.privateKey),
    };
  }

  throw new Error('signatureParams.method not supported');
}

/**
 * Function to sign data from signature parameters
 *
 * This must be used for test purpose only. A signature providers must be used in production.
 *
 * @param data the data to sign
 * @param signatureParams Signature parameters
 * @returns ISignature the signature
 */
function sign(
  data: unknown,
  signatureParams: SignatureTypes.ISignatureParameters,
): SignatureTypes.ISignedData {
  let value: string;
  if (signatureParams.method === SignatureTypes.METHOD.ECDSA) {
    value = EcUtils.sign(signatureParams.privateKey, normalizeKeccak256Hash(data).value);
    return { data, signature: { method: signatureParams.method, value } };
  }

  if (signatureParams.method === SignatureTypes.METHOD.ECDSA_ETHEREUM) {
    const normalizedData = normalizeData(data);
    value = EcUtils.sign(signatureParams.privateKey, ethers.utils.hashMessage(normalizedData));

    return { data, signature: { method: signatureParams.method, value } };
  }

  throw new Error('signatureParams.method not supported');
}

/**
 * Function to recover signer identity from a signature
 *
 * IMPORTANT: this is used to recover from the signature made by the signature providers
 *
 * @param signedData the data signed
 * @returns identity of the signer
 */
function recoverSigner(signedData: SignatureTypes.ISignedData): IdentityTypes.IIdentity {
  let value: string;
  if (signedData.signature.method === SignatureTypes.METHOD.ECDSA) {
    value = EcUtils.recover(
      signedData.signature.value,
      normalizeKeccak256Hash(signedData.data).value,
    );
    return {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value,
    };
  }

  if (signedData.signature.method === SignatureTypes.METHOD.ECDSA_ETHEREUM) {
    // In ethereum V = 0x1B or 0x1C instead of 0x00 or 0x01
    // We make the replacement here
    const v = signedData.signature.value.slice(V_POSITION_FROM_END_IN_ECDSA_HEX);

    let signature = signedData.signature.value;
    if (v.toLowerCase() === '00') {
      signature = `${signedData.signature.value.slice(0, V_POSITION_FROM_END_IN_ECDSA_HEX)}1b`;
    } else if (v.toLowerCase() === '01') {
      signature = `${signedData.signature.value.slice(0, V_POSITION_FROM_END_IN_ECDSA_HEX)}1b`;
    }
    const normalizedData = ethers.utils.hashMessage(normalizeData(signedData.data));
    value = EcUtils.recover(signature, normalizedData).toLowerCase();

    return {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value,
    };
  }

  throw new Error('signatureParams.method not supported');
}
