import { ethers } from 'ethers';
import { payPrivateErc20FeeProxyRequestFromHinkal } from '@requestnetwork/payment-processor';
import { createRequestForHinkal } from './createRequestForHinkal';

// Usage Example of Private Transactions using Hinkal on Optimism
// run --> yarn start:hinkal
// IMPORTANT: Ensure your account has sufficient USDC balance before running
// NOTE: Ensure sufficient ETH for gas fees on Optimism network yarn start:hinkal

void (async () => {
  const PAYER_PRIVATE_KEY = '0x3abdcb3d6d6c302a7943715d0b975ae1377d7d1d188820f6cd57b6f13fb5b0e0';
  const RPC_URL = 'https://mainnet.base.org';

  // Create Provider and Signer
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const payerWallet = new ethers.Wallet(PAYER_PRIVATE_KEY, provider);

  // Create Request and submit private transfer
  const requestData = await createRequestForHinkal(payerWallet, PAYER_PRIVATE_KEY);
  console.log('Request data created successfully');
  const tx = await payPrivateErc20FeeProxyRequestFromHinkal(requestData, payerWallet);
  console.log('Private transaction submitted:', {
    requestId: requestData.requestId,
    relayerTx: tx,
  });
  process.exit(0);
})();
