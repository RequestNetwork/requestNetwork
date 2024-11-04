import { Signer } from 'ethers';

import { Hinkal, exportEthersProvider, preProcessing } from '@hinkal/common';

/**
 * Prepares a wrapper Hinkal object for private transactions.
 * This function initializes the necessary components for private transaction processing
 * including provider setup, user keys, and Merkle tree initialization.
 *
 * @param signer - The ethers.js Signer instance for transaction signing
 * @returns Promise<Hinkal<unknown>> - A configured Hinkal instance ready for private transactions
 * @throws If initialization of provider, user keys, or Merkle tree fails
 */
export const prepareHinkal = async (signer: Signer): Promise<Hinkal<unknown>> => {
  await preProcessing();
  const hinkal = new Hinkal();

  const ethersProvider = await exportEthersProvider();
  ethersProvider.initSigner?.(signer); // type discrepency comes from different version of ethers.js
  await hinkal.initProviderAdapter(undefined, ethersProvider);
  await hinkal.initUserKeys();

  // initialize merkle trees
  await hinkal.resetMerkle();

  return hinkal;
};
