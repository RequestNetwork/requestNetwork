import { ContractTransaction, Signer } from 'ethers';

import { ClientTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import {
  getPaymentNetworkExtension,
  getProvider,
  getRequestPaymentValues,
  validateRequest,
} from './utils';
import { Framework } from '@superfluid-finance/sdk-core';

/**
 * Processes a transaction to pay an ERC777 stream Request.
 * @param request
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param _overrides optionally, override default transaction values, like gas.
 */
export async function payErc777StreamRequest(
  request: ClientTypes.IRequestData,
  signer: Signer,
): Promise<ContractTransaction> {
  const id = getPaymentNetworkExtension(request)?.id;
  if (id !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM) {
    throw new Error('Not a supported ERC777 payment network request');
  }
  validateRequest(request, PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM);
  const networkName =
    request.currencyInfo.network === 'private' ? 'custom' : request.currencyInfo.network;
  console.log('networkName:', networkName);

  const sf = await Framework.create({
    networkName: networkName,
    provider: signer.provider ? signer.provider : getProvider(),
    dataMode: 'WEB3_ONLY',
    resolverAddress: '0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da', //this is how you get the resolver address
    protocolReleaseVersion: 'test',
  });
  const superSigner = sf.createSigner({
    signer: signer,
    provider: signer.provider,
  });
  const superToken = await sf.loadSuperToken(request.currencyInfo.value);
  console.log('superToken.address:', superToken.address);
  // TODO: use expectedStartDate to compute offset between start of invoicing and start of payment
  const { paymentReference, paymentAddress, expectedFlowRate } = getRequestPaymentValues(request);
  const streamPayOp = sf.cfaV1.createFlow({
    flowRate: expectedFlowRate ? expectedFlowRate : '0',
    receiver: paymentAddress,
    superToken: superToken.address,
    userData: `0x${paymentReference}`,
  });
  const batchCall = sf.batchCall([streamPayOp]);
  return batchCall.exec(superSigner);
}
