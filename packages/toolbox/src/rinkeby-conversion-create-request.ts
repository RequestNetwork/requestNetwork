import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { Request, RequestNetwork, Types } from '@requestnetwork/request-client.js';
// @ts-ignore
import Utils from '@requestnetwork/utils';
// @ts-ignore
import { conversionToPayRequest, approveErc20ForProxyConversionIfNeeded } from '@requestnetwork/payment-processor';
// @ts-ignore
import { ethers, Wallet, utils } from 'ethers';
import { RequestLogicTypes } from '@requestnetwork/types';

const mnemonic = 'machine shrug quit tomorrow case extra utility home harvest weather infant enemy gorilla dash vital skull electric ancient clutch punch lumber rare market minor';
// @ts-ignore
const payerAddress = '0xe79923744C3Abd911F9e7C424451AEBDddD76ACf';
const provider = new ethers.providers.InfuraProvider('rinkeby');
// @ts-ignore
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

(async () => {

  const signatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  });

  const payeeIdentity: Types.Identity.IIdentity = {
    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  };
  const payerIdentity: Types.Identity.IIdentity = {
    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
  };

  const fauTokenAddress = '0xfab46e002bbf0b4509813474841e0716e6730136';


  const currency = {
    type: Types.RequestLogic.CURRENCY.ISO4217,
    value: 'EUR',
  };

  const paymentNetwork: Types.Payment.IPaymentNetworkCreateParameters = {
    id: Types.Payment.PAYMENT_NETWORK_ID.CONVERSION_FEE_PROXY_CONTRACT,
    parameters: {
      paymentAddress: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
      refundAddress: '0xf17f52151ebef6c7334fad080c5704d77216b732',
      feeAddress: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
      feeAmount: '1',

      network: 'rinkeby',
      tokensAccepted: [fauTokenAddress],
      // No timespan
      maxRateTimespan: 0,

    },
  };

  const requestCreationHash: Types.RequestLogic.ICreateParameters = {
    currency,
    expectedAmount: '1100',
    payee: payeeIdentity,
    payer: payerIdentity,
  };

  const requestNetwork = new RequestNetwork({ nodeConnectionConfig: { baseURL: 'https://gateway-rinkeby.request.network' }, signatureProvider });

  const request: Request = await requestNetwork.createRequest({
    requestInfo: requestCreationHash,
    signer: payeeIdentity,
    paymentNetwork,
  });

  console.log('#############################################################');
  console.log('request');
  console.log(JSON.stringify(request));
  console.log('-');
  console.log(request);
  console.log('#############################################################');

  let data = await request.waitForConfirmation();
  // const data = await request.refresh();
  // console.log('data');
  // console.log(JSON.stringify(data));
  // console.log('-');
  // console.log(data);

  // const requestId = '01c650c6665ab0aa0f010b79fb2b5342d62919438cf8592252366e1ce01d749b53';
  // const request: Request = await requestNetwork.fromRequestId(requestId);
  // console.log('request');
  // console.log(JSON.stringify(request));
  // console.log('-');
  // console.log(request);
  // console.log('############################################');

  // let data = await request.refresh();

  // console.log('############################################');
  const approval = await approveErc20ForProxyConversionIfNeeded(data, payerAddress, fauTokenAddress, wallet, '1');

  if(approval) {
    await approval.wait();
  }

  // // USD => token
  const path = [Utils.currency.getCurrencyHash(data.currencyInfo),
                Utils.currency.getCurrencyHash({type: RequestLogicTypes.CURRENCY.ISO4217, value: 'USD'}),
                fauTokenAddress];

  const maxToSpend = new utils.BigNumber(2).pow(255);

  const paymentTx = await conversionToPayRequest(data, path, maxToSpend, wallet);
  await paymentTx.wait();

  data = await request.refresh();

  console.log('#############################################################');
  console.log('data');
  console.log(JSON.stringify(data));
  console.log('-');
  console.log(data);
  console.log('#############################################################');

  console.log('data.balance 2')
  console.log(data.balance)
  console.log(data.balance!.events)

})();



