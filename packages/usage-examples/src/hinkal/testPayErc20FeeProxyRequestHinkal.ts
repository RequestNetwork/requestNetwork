import { ethers } from 'ethers';
import { payPrivateErc20FeeProxyRequest } from '@requestnetwork/payment-processor';
import { createRequestForHinkal } from './createRequestForHinkal';
import { config } from 'dotenv';
config();

// Usage Example of Private Transactions using Hinkal on Optimism
// You will need to pass PAYER_PRIVATE_KEY to .env file in usage_examples root (make sure dotenv is installed)
// run --> yarn start:hinkal
// IMPORTANT: Ensure your account has sufficient USDC balance before running
// SECURITY: Handle private keys with extreme caution. Never commit .env file
// NOTE: Ensure sufficient ETH for gas fees on Optimism network yarn start:hinkal

void (async () => {
  const { PAYER_PRIVATE_KEY, OPTIMISM_RPC_URL } = process.env;
  if (!PAYER_PRIVATE_KEY) throw new Error('PRIVATE_KEY_MISSING');
  const RPC_URL = OPTIMISM_RPC_URL || 'https://mainnet.optimism.io';

  // Create Provider and Signer
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const payerWallet = new ethers.Wallet(PAYER_PRIVATE_KEY, provider);

  // Create Request and submit private transfer
  const requestData = await createRequestForHinkal(payerWallet, PAYER_PRIVATE_KEY);
  console.log('Request data created successfully');
  const tx = await payPrivateErc20FeeProxyRequest(requestData, payerWallet);
  console.log('Private transaction submitted:', {
    requestId: requestData.requestId,
    relayerTx: tx,
  });
  process.exit(0);
})();
