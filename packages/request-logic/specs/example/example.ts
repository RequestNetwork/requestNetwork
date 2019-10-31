/** Script to generate the example of the specs */

import {
  IdentityTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
  SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import RequestLogic from '../../src/requestLogicCore';

async function foo(): Promise<void> {
  // Bob (the payee)
  const bobRaw = {
    identity: {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
    },
    signatureParams: {
      method: SignatureTypes.METHOD.ECDSA,
      privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
    },
  };

  // Alice (the payer)
  const aliceRaw = {
    identity: {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
    },
    signatureParams: {
      method: SignatureTypes.METHOD.ECDSA,
      privateKey: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
    },
  };

  const signatureProvider: SignatureProviderTypes.ISignatureProvider = {
    sign: (data: any, identity: IdentityTypes.IIdentity): any =>
      ({
        [aliceRaw.identity.value as string]: Utils.signature.sign(data, aliceRaw.signatureParams),
        [bobRaw.identity.value as string]: Utils.signature.sign(data, bobRaw.signatureParams),
      }[identity.value]),
    supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
    supportedMethods: [SignatureTypes.METHOD.ECDSA],
  };

  // Amount expected for the request
  const arbitraryExpectedAmount = '123400000000000000';

  // amount of the discount
  const arbitraryDiscountAmount = '100000000000000000';

  // timestamp of the request creation
  const arbitraryTimestamp = 1544426030;

  const createParams = {
    currency: {
      network: 'mainnet',
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'ETH',
    },
    expectedAmount: arbitraryExpectedAmount,
    payee: bobRaw.identity,
    payer: aliceRaw.identity,
    timestamp: arbitraryTimestamp,
  };

  // create request
  const actionCreation = await RequestLogic.formatCreate(
    createParams,
    bobRaw.identity,
    signatureProvider,
  );
  // apply creation
  let requestState = RequestLogic.applyActionToRequest(null, actionCreation);
  console.log('###########################################');
  console.log('Creation Action ---------------------------');
  console.log(JSON.stringify(JSON.stringify(actionCreation)));
  console.log('Request State ----------------------------');
  console.log(JSON.stringify(requestState));
  console.log('###########################################');

  // action discount
  const actionReduceAmount = await RequestLogic.formatReduceExpectedAmount(
    {
      deltaAmount: arbitraryDiscountAmount,
      requestId: requestState.requestId,
    },
    bobRaw.identity,
    signatureProvider,
  );
  // apply discount
  requestState = RequestLogic.applyActionToRequest(requestState, actionReduceAmount);
  console.log('###########################################');
  console.log('Reduce Amount Action ----------------------');
  console.log(JSON.stringify(actionReduceAmount));
  console.log('Request State -----------------------------');
  console.log(JSON.stringify(requestState));
  console.log('###########################################');

  // action accept
  const actionAccept = await RequestLogic.formatAccept(
    {
      requestId: requestState.requestId,
    },
    aliceRaw.identity,
    signatureProvider,
  );
  // apply accept
  requestState = RequestLogic.applyActionToRequest(requestState, actionAccept);
  console.log('###########################################');
  console.log('Accept Action -----------------------------');
  console.log(JSON.stringify(JSON.stringify(actionAccept)));
  console.log('Request State -----------------------------');
  console.log(JSON.stringify(requestState));
  console.log('###########################################');
}

foo();
