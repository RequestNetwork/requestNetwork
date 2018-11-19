import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

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
 * @returns REQUEST_LOGIC_ROLE the role of the signer (payee, payer or thirdpart)
 */
function getIdentityFromSignatureParams(
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicIdentity {
  if (signatureParams.method === Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA) {
    return {
      type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
      value: Utils.crypto.ecutils.getAddressFromPrivateKey(signatureParams.privateKey),
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
  if (signatureParams.method === Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA) {
    value = Utils.crypto.ecutils.sign(signatureParams.privateKey, data);
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
  if (signature.method === Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA) {
    value = Utils.crypto.ecutils.recover(signature.value, data);
    return { type: Types.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS, value };
  }

  throw new Error('signatureParams.method not supported');
}
