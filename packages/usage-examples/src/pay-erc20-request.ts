import { Wallet } from 'ethers';

import {
  approveErc20,
  hasErc20Approval,
  hasSufficientFunds,
  payRequest,
} from '@requestnetwork/payment-processor';
import { RequestNetwork } from '@requestnetwork/request-client.js';

/* tslint:disable:no-floating-promises */

// for demo purpose
const wallet = Wallet.createRandom();
const requestNetwork = new RequestNetwork();

// tslint:disable-next-line: typedef
(async () => {
  const account = wallet.address;

  const request = await requestNetwork.fromRequestId('REQUEST_ID');
  const requestData = request.getData();
  if (!(await hasSufficientFunds(requestData, account))) {
    throw new Error('You do not have enough funds to pay this request');
  }
  if (!(await hasErc20Approval(requestData, account))) {
    const approvalTx = await approveErc20(requestData, wallet);
    await approvalTx.wait(1);
  }
  const tx = await payRequest(requestData, wallet);
  await tx.wait(1);
})();
