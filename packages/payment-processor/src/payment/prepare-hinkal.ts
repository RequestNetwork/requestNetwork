import { Signer } from 'ethers';

import { Hinkal, exportEthersProvider, preProcessing } from '@hinkal/common';

/**
 * prepares wrapper hinkal object for private transaction
 * @param signer signer object to be passed
 */
export const prepareHinkal = async (signer: Signer): Promise<Hinkal<unknown>> => {
  await preProcessing();
  const hinkal = new Hinkal();

  const ethersProvider = await exportEthersProvider();
  ethersProvider.initSigner?.(signer); // type discrepency comes from different version of ethers.js
  await hinkal.initProviderAdapter(undefined, ethersProvider);
  await hinkal.initUserKeys();

  await hinkal.resetMerkle();

  return hinkal;
};
