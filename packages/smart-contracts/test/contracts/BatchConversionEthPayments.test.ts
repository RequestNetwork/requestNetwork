import { ethers, network } from 'hardhat';
import {
  EthConversionProxy__factory,
  EthereumFeeProxy__factory,
  EthereumFeeProxy,
  ChainlinkConversionPath,
  EthConversionProxy,
  BatchConversionPayments,
} from '../../src/types';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction, Signer } from 'ethers';
import { expect } from 'chai';
import { CurrencyManager } from '@requestnetwork/currency';
import { chainlinkConversionPath, batchConversionPaymentsArtifact } from '../../src/lib';
import Utils from '@requestnetwork/utils';
import { HttpNetworkConfig } from 'hardhat/types';

// set to true to log batch payments's gas consumption
const logGas = false;

describe('contract: BatchConversionPayments', () => {
  const networkConfig = network.config as HttpNetworkConfig;
  const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);

  let from: string;
  let to: string;
  let feeAddress: string;
  let signer: Signer;
  const batchFee = 50;
  const batchConvFee = 100;
  const referenceExample = '0xaaaa';

  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;

  let testEthConversionProxy: EthConversionProxy;
  let testBatchConversionProxy: BatchConversionPayments;
  let ethereumFeeProxy: EthereumFeeProxy;
  let chainlinkPath: ChainlinkConversionPath;

  let conversionToPay: BigNumber;
  let feesToPay: BigNumber;

  type ConversionDetail = {
    recipient: string;
    requestAmount: BigNumberish;
    path: string[];
    paymentReference: BytesLike;
    feeAmount: BigNumberish;
    maxToSpend: BigNumberish;
    maxRateTimespan: BigNumberish;
  };
  let convDetail: ConversionDetail;

  let tx: ContractTransaction;

  let beforeEthBalanceTo: BigNumber;
  let beforeEthBalanceFee: BigNumber;
  let beforeEthBalance: BigNumber;

  let amountToPayExpected: BigNumber;
  let feeToPayExpected: BigNumber;
  // amount and feeAmount are usually in fiat for conversion inputs, else in ETH
  const amount = BigNumber.from(100000);
  const feeAmount = amount.mul(10).div(10000);
  let inputs: Array<ConversionDetail>;
  const pathUsdEth = [USD_hash, ETH_hash];

  /**
   * @notice Function batch conversion, it can be the batchRouter function, used with conversion args,
   *  or directly batchERC20ConversionPaymentsMultiTokens
   * */
  let batchConvFunction: (
    args: any,
    feeAddress: string,
    optional?: any,
  ) => Promise<ContractTransaction>;

  /**
   * @notice it modify the Eth batch conversion inputs if needed, depending it is
   *         directly or through batchRouter
   * @param useBatchRouter
   * @param inputs a list of convDetail
   */
  const getEthConvInputs = (useBatchRouter: boolean, inputs: Array<ConversionDetail>) => {
    if (useBatchRouter) {
      return [
        {
          paymentNetworkId: '3',
          conversionDetails: inputs,
          cryptoDetails: {
            tokenAddresses: [],
            recipients: [],
            amounts: [],
            paymentReferences: [],
            feeAmounts: [],
          }, // cryptoDetails is not used
        },
      ];
    }
    return inputs;
  };

  const checkEthBalances = async (amountToPayExpected: BigNumber, feeToPayExpected: BigNumber) => {
    const receipt = await tx.wait();
    if (logGas) console.log('gas consumption: ', receipt.gasUsed.toString()); // get balances
    const gasUsed = receipt.gasUsed.mul(2 * 10 ** 10);

    const afterEthBalance = await provider.getBalance(await signer.getAddress());
    const afterEthBalanceTo = await provider.getBalance(to);
    const afterEthBalanceFee = await provider.getBalance(feeAddress);
    const proxyBalance = await provider.getBalance(testBatchConversionProxy.address);

    // Calculate the difference of the balance : now - before
    const _diffBalance = beforeEthBalance.sub(afterEthBalance);
    const _diffBalanceTo = afterEthBalanceTo.sub(beforeEthBalanceTo);
    const _diffBalanceFee = afterEthBalanceFee.sub(beforeEthBalanceFee);

    // feeToPayExpected includes batch conversion fees now
    feeToPayExpected = amountToPayExpected
      .add(feeToPayExpected)
      .mul(batchConvFee)
      .div(10000)
      .add(feeToPayExpected);
    const _diffBalanceExpect = gasUsed.add(amountToPayExpected).add(feeToPayExpected);

    // Check balance changes
    expect(_diffBalance).to.equals(_diffBalanceExpect, 'DiffBalance');
    expect(_diffBalanceTo).to.equals(amountToPayExpected, 'diffBalanceTo');
    expect(_diffBalanceFee).to.equals(feeToPayExpected, 'diffBalanceFee');
    expect(proxyBalance).to.equals('0', 'proxyBalance');
  };
  /**
   * @notice it contains all the tests related to the Eth batch payment, and its context required.
   *         It tests the 2 functions directly, or through batchRouter function.
   *         Functions: batchEthConversionPaymentsWithReference, and batchEthPaymentsWithReference
   * @param useBatchRouter
   */
  for (const useBatchRouter of [true, false]) {
    describe(`Test ETH batch functions ${
      useBatchRouter ? 'through batchRouter' : 'without batchRouter'
    }`, () => {
      before(async () => {
        [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
        from;
        [signer] = await ethers.getSigners();
        chainlinkPath = chainlinkConversionPath.connect(network.name, signer);
        ethereumFeeProxy = await new EthereumFeeProxy__factory(signer).deploy();
        testEthConversionProxy = await new EthConversionProxy__factory(signer).deploy(
          ethereumFeeProxy.address,
          chainlinkPath.address,
          ETH_hash,
        );

        testBatchConversionProxy = batchConversionPaymentsArtifact.connect(network.name, signer);

        // update batch payment proxies, and batch fees
        await testBatchConversionProxy.setPaymentEthProxy(ethereumFeeProxy.address);
        await testBatchConversionProxy.setPaymentEthConversionProxy(testEthConversionProxy.address);
        await testBatchConversionProxy.setBatchFee(batchFee);
        await testBatchConversionProxy.setBatchConversionFee(batchConvFee);

        convDetail = {
          recipient: to,
          requestAmount: amount,
          path: pathUsdEth,
          paymentReference: referenceExample,
          feeAmount: feeAmount,
          maxToSpend: BigNumber.from(0),
          maxRateTimespan: BigNumber.from(0),
        };

        // basic setup: 1 payment
        const conversionToPayFull = await chainlinkPath.getConversion(
          convDetail.requestAmount,
          convDetail.path,
        );
        conversionToPay = conversionToPayFull.result;
        const feesToPayFull = await chainlinkPath.getConversion(
          convDetail.feeAmount,
          convDetail.path,
        );
        feesToPay = feesToPayFull.result;

        if (useBatchRouter) {
          batchConvFunction = testBatchConversionProxy.batchRouter;
        } else {
          batchConvFunction = testBatchConversionProxy.batchEthConversionPaymentsWithReference;
        }
      });

      beforeEach(async () => {
        beforeEthBalanceTo = await provider.getBalance(to);
        beforeEthBalanceFee = await provider.getBalance(feeAddress);
        beforeEthBalance = await provider.getBalance(await signer.getAddress());

        // expected balances, it can be modified for each test
        amountToPayExpected = conversionToPay;
        // fees does not include batch fees yet
        feeToPayExpected = feesToPay;
      });

      describe('success functions', () => {
        it('batchEthConversionPaymentsWithReference transfer 1 payment in ethers denominated in USD', async function () {
          inputs = [convDetail];
          tx = await batchConvFunction(getEthConvInputs(useBatchRouter, inputs), feeAddress, {
            value: BigNumber.from('100000000000000000'),
          });
          await checkEthBalances(amountToPayExpected, feeToPayExpected);
        });

        it('batchEthConversionPaymentsWithReference transfer 3 payment in ethers denominated in USD', async function () {
          amountToPayExpected = amountToPayExpected.mul(3);
          feeToPayExpected = feeToPayExpected.mul(3);
          inputs = [convDetail, convDetail, convDetail];
          tx = await batchConvFunction(getEthConvInputs(useBatchRouter, inputs), feeAddress, {
            value: BigNumber.from('100000000000000000'),
          });
          await checkEthBalances(amountToPayExpected, feeToPayExpected);
        });

        it('batchEthConversionPaymentsWithReference transfer 3 payments in ethers denominated in USD and EUR', async function () {
          const EurConvDetail = Utils.deepCopy(convDetail);
          EurConvDetail.path = [EUR_hash, USD_hash, ETH_hash];

          const eurConversionToPay = await chainlinkPath.getConversion(
            EurConvDetail.requestAmount,
            EurConvDetail.path,
          );
          const eurFeesToPay = await chainlinkPath.getConversion(
            EurConvDetail.feeAmount,
            EurConvDetail.path,
          );

          amountToPayExpected = eurConversionToPay.result.add(amountToPayExpected.mul(2));
          feeToPayExpected = eurFeesToPay.result.add(feeToPayExpected.mul(2));
          inputs = [convDetail, EurConvDetail, convDetail];

          tx = await batchConvFunction(getEthConvInputs(useBatchRouter, inputs), feeAddress, {
            value: BigNumber.from('100000000000000000'),
          });
          await checkEthBalances(amountToPayExpected, feeToPayExpected);
        });

        it('batchEthPaymentsWithReference transfer 1 payment', async function () {
          beforeEthBalanceTo = await provider.getBalance(to);
          beforeEthBalanceFee = await provider.getBalance(feeAddress);
          beforeEthBalance = await provider.getBalance(await signer.getAddress());

          const cryptoDetails = {
            tokenAddresses: [],
            recipients: [to],
            amounts: [amount], // in ETH
            paymentReferences: [referenceExample],
            feeAmounts: [feeAmount], // in ETH
          };
          if (useBatchRouter) {
            await testBatchConversionProxy.batchRouter(
              [
                {
                  paymentNetworkId: 4,
                  conversionDetails: [convDetail], // not used
                  cryptoDetails: cryptoDetails,
                },
              ],
              feeAddress,
              { value: 1000000000 },
            );
          } else {
            await testBatchConversionProxy.batchEthPaymentsWithReference(
              cryptoDetails.recipients,
              cryptoDetails.amounts,
              cryptoDetails.paymentReferences,
              cryptoDetails.feeAmounts,
              feeAddress,
              { value: 1000000000 },
            );
          }

          amountToPayExpected = amount;
          feeToPayExpected = feeAmount;
          const afterEthBalanceTo = await provider.getBalance(to);
          const afterEthBalanceFee = await provider.getBalance(feeAddress);
          const proxyBalance = await provider.getBalance(testBatchConversionProxy.address);
          const _diffBalanceTo = afterEthBalanceTo.sub(beforeEthBalanceTo);
          const _diffBalanceFee = afterEthBalanceFee.sub(beforeEthBalanceFee);

          expect(_diffBalanceTo).to.equals(amountToPayExpected.toString(), 'diffBalanceTo');

          feeToPayExpected = amountToPayExpected.mul(batchFee).div(10000).add(feeToPayExpected);
          expect(_diffBalanceFee.toString()).to.equals(
            feeToPayExpected.toString(),
            'diffBalanceFee',
          );
          expect(proxyBalance).to.equals('0', 'proxyBalance');
        });
      });
      describe('revert functions', () => {
        it('batchEthConversionPaymentsWithReference transfer FAIL: not enough funds', async function () {
          await expect(
            batchConvFunction(getEthConvInputs(useBatchRouter, [convDetail]), feeAddress, {
              value: 10000,
            }),
          ).to.be.revertedWith('paymentProxy transferExactEthWithReferenceAndFee failed');
        });
        it('batchEthPaymentsWithReference transfer FAIL: not enough funds', async function () {
          const cryptoDetails = {
            tokenAddresses: [],
            recipients: [to],
            amounts: [amount],
            paymentReferences: [referenceExample],
            feeAmounts: [feeAmount],
          };

          // it contains the function being just executed, and still processing
          let batchEthPayments;
          if (useBatchRouter) {
            batchEthPayments = testBatchConversionProxy.batchRouter(
              [
                {
                  paymentNetworkId: 4,
                  conversionDetails: [convDetail], // not used
                  cryptoDetails: cryptoDetails,
                },
              ],
              feeAddress,
              { value: 10000 },
            );
          } else {
            batchEthPayments = testBatchConversionProxy.batchEthPaymentsWithReference(
              cryptoDetails.recipients,
              cryptoDetails.amounts,
              cryptoDetails.paymentReferences,
              cryptoDetails.feeAmounts,
              feeAddress,
              { value: 10000 },
            );
          }
          await expect(batchEthPayments).to.be.revertedWith('not enough funds');
        });
      });
    });
  }
});
