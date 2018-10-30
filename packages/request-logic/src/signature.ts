import * as RequestEnum from './enum';
import * as Types from './types';
import CryptoUtils from './utils/crypto';

import ECUtils from './utils/crypto/ECUtils';

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
 * @returns RequestEnum.REQUEST_LOGIC_ROLE the role of the signer (payee, payer or thirdpart)
 */
function getIdentityFromSignatureParams(
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicIdentity {
  if (signatureParams.method === RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA) {
    return {
      type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: ECUtils.getAddressFromPrivateKey(signatureParams.privateKey),
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
 * @returns IRequestLogicSignature the signature
 */
function sign(
  data: string,
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicSignature {
  let value: string;
  if (signatureParams.method === RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA) {
    value = ECUtils.sign(signatureParams.privateKey, data);
    return { method: signatureParams.method, value };
  }

  throw new Error('signatureParams.method not supported');
}

/**
 * Function to recover signer identity from signature
 *
 * @param string data the data signed
 * @param IRequestLogicSignature signature the signature itself
 *
 * @returns IRequestLogicIdentity identity of the signer
 */
function recover(
  data: string,
  signature: Types.IRequestLogicSignature,
): Types.IRequestLogicIdentity {
  let value: string;
  if (signature.method === RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA) {
    value = ECUtils.recover(signature.value, data);
    return { type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value };
  }

  throw new Error('signatureParams.method not supported');
}
