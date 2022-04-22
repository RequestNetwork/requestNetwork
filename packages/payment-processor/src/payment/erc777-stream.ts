import { ContractTransaction, Signer, Overrides } from 'ethers';

import { ClientTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import {
  getPaymentNetworkExtension,
  getProvider,
  getRequestPaymentValues,
  validateRequest,
} from './utils';
import { Framework } from '@superfluid-finance/sdk-core';

export const resolverAddress = '0x8e4C131B37383E431B9cd0635D3cF9f3F628EDae';

/**
 * Processes a transaction to pay an ERC777 stream Request.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
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
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  // FIXME: according to specs PR https://github.com/RequestNetwork/requestNetwork/pull/688
  // in file packages/advanced-logic/specs/payment-network-erc777-stream-0.1.0.md
  // - use expectedStartDate to compute offset between start of invoicing and start of streaming
  // - start fee streaming
  const { paymentReference, paymentAddress, expectedFlowRate } = getRequestPaymentValues(request);
  const streamPayOp = sf.cfaV1.createFlow({
    flowRate: expectedFlowRate ?? '0',
    receiver: paymentAddress,
    superToken: superToken.address,
    userData: `0x${paymentReference}`,
    overrides: overrides,
  });
  const batchCall = sf.batchCall([streamPayOp]);
  return batchCall.exec(superSigner);
}
