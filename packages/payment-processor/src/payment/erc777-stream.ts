import { ContractTransaction, Signer, Overrides } from 'ethers';

import { ClientTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import {
  getPaymentNetworkExtension,
  getProvider,
  getRequestPaymentValues,
  validateRequest,
} from './utils';
import { Framework } from '@superfluid-finance/sdk-core';

export const resolverAddress = '0x913bbCFea2f347a24cfCA441d483E7CBAc8De3Db';
export const userDataPrefix = '0xbeefac';

/**
 * Processes a transaction to pay an ERC777 stream Request.
 * @param request
 * @param signer the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payErc777StreamRequest(
  request: ClientTypes.IRequestData,
  signer: Signer,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM) {
    throw new Error('Not a supported ERC777 payment network request');
  }
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM);
  const networkName =
    request.currencyInfo.network === 'private' ? 'custom' : request.currencyInfo.network;
  const sf = await Framework.create({
    networkName,
    provider: signer.provider ?? getProvider(),
    dataMode: request.currencyInfo.network === 'private' ? 'WEB3_ONLY' : undefined,
    resolverAddress: request.currencyInfo.network === 'private' ? resolverAddress : undefined,
    protocolReleaseVersion: request.currencyInfo.network === 'private' ? 'test' : undefined,
  });
  const superSigner = sf.createSigner({
    signer: signer,
    provider: signer.provider,
  });
  // FIXME: according to specs PR https://github.com/RequestNetwork/requestNetwork/pull/688
  // in file packages/advanced-logic/specs/payment-network-erc777-stream-0.1.0.md
  // Below are the SF actions to add in the BatchCall :
  // - use expectedStartDate to compute offset between start of invoicing and start of streaming
  // - start fee streaming
  const streamPayOp = await startStream(sf, request, overrides);
  const batchCall = sf.batchCall([streamPayOp]);
  return batchCall.exec(superSigner);
}

async function startStream(
  sf: Framework,
  request: ClientTypes.IRequestData,
  overrides?: Overrides,
) {
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  const { paymentReference, paymentAddress, expectedFlowRate } = getRequestPaymentValues(request);
  // Superfluid payments of requests use the generic field `userData` to index payments.
  // Since it's a multi-purpose field, payments will use a fix-prefix heading the payment reference,
  // in order to speed up the indexing and payment detection.
  return sf.cfaV1.createFlow({
    flowRate: expectedFlowRate ?? '0',
    receiver: paymentAddress,
    superToken: superToken.address,
    userData: `${userDataPrefix}${paymentReference}`,
    overrides: overrides,
  });
}

/**
 * Processes a transaction to complete an ERC777 stream paying a Request.
 * @param request
 * @param signer the Web3 provider, or signer. Defaults to window.ethereum.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function completeErc777StreamRequest(
  request: ClientTypes.IRequestData,
  signer: Signer,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM) {
    throw new Error('Not a supported ERC777 payment network request');
  }
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM);
  const networkName =
    request.currencyInfo.network === 'private' ? 'custom' : request.currencyInfo.network;
  const sf = await Framework.create({
    networkName,
    provider: signer.provider ?? getProvider(),
    dataMode: request.currencyInfo.network === 'private' ? 'WEB3_ONLY' : undefined,
    resolverAddress: request.currencyInfo.network === 'private' ? resolverAddress : undefined,
    protocolReleaseVersion: request.currencyInfo.network === 'private' ? 'test' : undefined,
  });
  const superSigner = sf.createSigner({
    signer: signer,
    provider: signer.provider,
  });
  // FIXME: according to specs PR https://github.com/RequestNetwork/requestNetwork/pull/688
  // in file packages/advanced-logic/specs/payment-network-erc777-stream-0.1.0.md
  // Below are the SF actions to add in the BatchCall :
  // - use expectedEndDate to compute offset between stop of invoicing and stop of streaming
  // - stop fee streaming
  const streamPayOp = await stopStream(sf, signer, request, overrides);
  const batchCall = sf.batchCall([streamPayOp]);
  return batchCall.exec(superSigner);
}

async function stopStream(
  sf: Framework,
  signer: Signer,
  request: ClientTypes.IRequestData,
  overrides?: Overrides,
) {
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  const { paymentReference, paymentAddress } = getRequestPaymentValues(request);
  // Superfluid payments of requests use the generic field `userData` to index payments.
  // Since it's a multi-purpose field, payments will use a fix-prefix heading the payment reference,
  // in order to speed up the indexing and payment detection.
  return sf.cfaV1.deleteFlow({
    superToken: superToken.address,
    sender: await signer.getAddress(),
    receiver: paymentAddress,
    userData: `${userDataPrefix}${paymentReference}`,
    overrides: overrides,
  });
}
