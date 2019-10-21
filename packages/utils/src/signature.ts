import { IdentityTypes, SignatureTypes } from '@requestnetwork/types';
import Crypto from './crypto';

/**
 * Function to manage Request Logic Signature
 */
export default {
  getIdentityFromSignatureParams,
  recover,
  sign,
};

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
      value: Crypto.EcUtils.getAddressFromPrivateKey(signatureParams.privateKey),
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
  data: any,
  signatureParams: SignatureTypes.ISignatureParameters,
): SignatureTypes.ISignedData {
  let value: string;
  if (signatureParams.method === SignatureTypes.METHOD.ECDSA) {
    value = Crypto.EcUtils.sign(
      signatureParams.privateKey,
      Crypto.normalizeKeccak256Hash(data).value,
    );
    return { data, signature: { method: signatureParams.method, value } };
  }

  if (signatureParams.method === SignatureTypes.METHOD.ECDSA_ETHEREUM) {
    const normalizedData = Crypto.normalize(data);
    value = Crypto.EcUtils.sign(
      signatureParams.privateKey,
      Crypto.keccak256Hash(
        `\x19Ethereum Signed Message:\n${normalizedData.length}${normalizedData}`,
      ),
    );

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
function recover(signedData: SignatureTypes.ISignedData): IdentityTypes.IIdentity {
  let value: string;
  if (signedData.signature.method === SignatureTypes.METHOD.ECDSA) {
    value = Crypto.EcUtils.recover(
      signedData.signature.value,
      Crypto.normalizeKeccak256Hash(signedData.data).value,
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
    const normalizedData = Crypto.normalize(signedData.data);
    value = Crypto.EcUtils.recover(
      signature,
      Crypto.keccak256Hash(
        // add the ethereum padding (only for ECDSA_ETHEREUM)
        // This is to make the system compatible with the ethereum signatures
        `\x19Ethereum Signed Message:\n${normalizedData.length}${normalizedData}`,
      ),
    ).toLowerCase();

    return {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value,
    };
  }

  throw new Error('signatureParams.method not supported');
}
