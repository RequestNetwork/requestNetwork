import { ethers, network } from 'hardhat';
import {
  ERC20FeeProxy__factory,
  Erc20ConversionProxy__factory,
  EthConversionProxy__factory,
  EthereumFeeProxy__factory,
  ChainlinkConversionPath,
  TestERC20,
  TestERC20__factory,
  BatchConversionPayments__factory,
  BatchConversionPayments,
} from '../../src/types';
import { PaymentTypes } from '@requestnetwork/types';
import { BigNumber, ContractTransaction, Signer } from 'ethers';
import { expect } from 'chai';
import { CurrencyManager } from '@requestnetwork/currency';
import { chainlinkConversionPath } from '../../src/lib';
import { FAU_USD_RATE } from '../../scripts/test-deploy-batch-conversion-deployment';
import { localERC20AlphaArtifact, secondLocalERC20AlphaArtifact } from './localArtifacts';
import { deepCopy } from '@requestnetwork/utils';
import { HttpNetworkConfig } from 'hardhat/types';
import {
  DAI_USD_RATE,
  EUR_USD_RATE,
  PRECISION_RATE,
} from '../../scripts/test-deploy_chainlink_contract';

const BATCH_PAYMENT_NETWORK_ID = PaymentTypes.BATCH_PAYMENT_NETWORK_ID;

describe('contract: BatchConversionPayments', async () => {
  const networkConfig = network.config as HttpNetworkConfig;
  const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);

  let adminAddress: string;
  let from: string;
  let to: string;
  let feeAddress: string;
  let adminSigner: Signer;
  let fromSigner: Signer;
  let signer4: Signer;
  let tx: ContractTransaction;

  // constants used to set up batch conversion proxy, and also requests payment
  const BATCH_FEE = 100; // 1%
  const BATCH_DENOMINATOR = 10000;
  const daiDecimals = '000000000000000000'; // 18 decimals
  const fiatDecimals = '00000000'; // 8 decimals
  const thousandWith18Decimal = '1000000000000000000000'; // 21 decimals
  const referenceExample = '0xaaaa';
  const gasPrice = 2 * 10 ** 10; // await provider.getGasPrice()

  // constants related to chainlink and conversion rate
  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
  const DAI_address = localERC20AlphaArtifact.getAddress(network.name);
  const FAU_address = secondLocalERC20AlphaArtifact.getAddress(network.name);
  const USD_ETH_RATE = 20000000;

  // proxies and tokens
  let batchConversionProxy: BatchConversionPayments;
  let daiERC20: TestERC20;
  let fauERC20: TestERC20;
  let chainlinkPath: ChainlinkConversionPath;

  // constants inputs for batch conversion functions
  const fauConvRequest: PaymentTypes.RequestDetail = {
    recipient: '',
    requestAmount: '100000' + fiatDecimals, // eq to $100_000
    path: [USD_hash, FAU_address],
    paymentReference: referenceExample,
    feeAmount: '100' + fiatDecimals,
    maxToSpend: '20000000000000000000' + fiatDecimals, // Way enough
    maxRateTimespan: '0',
  };

  const daiConvRequest: PaymentTypes.RequestDetail = {
    recipient: '',
    requestAmount: '100000' + fiatDecimals, // eq to $100_000
    path: [EUR_hash, USD_hash, DAI_address],
    paymentReference: referenceExample,
    feeAmount: '100' + fiatDecimals,
    maxToSpend: '30000000000000000000' + fiatDecimals, // Way enough
    maxRateTimespan: '0',
  };

  const ethConvRequest: PaymentTypes.RequestDetail = {
    recipient: '',
    requestAmount: '1000' + fiatDecimals, // eq to $1000
    path: [USD_hash, ETH_hash],
    paymentReference: referenceExample,
    feeAmount: '1' + fiatDecimals,
    maxToSpend: '0',
    maxRateTimespan: '0',
  };

  const fauRequest: PaymentTypes.RequestDetail = {
    recipient: '',
    requestAmount: '100000' + daiDecimals, // eq to $100_000
    path: [FAU_address],
    paymentReference: referenceExample,
    feeAmount: '100' + daiDecimals,
    maxToSpend: '0',
    maxRateTimespan: '0',
  };

  const ethRequest: PaymentTypes.RequestDetail = {
    recipient: '',
    requestAmount: BigNumber.from('1100' + fiatDecimals) // eq to $1100, batch fees = $11
      .mul(USD_ETH_RATE)
      .toString(),
    path: [],
    paymentReference: referenceExample,
    feeAmount: BigNumber.from('2' + fiatDecimals) // eq to $2
      .mul(USD_ETH_RATE)
      .toString(),
    maxToSpend: '0',
    maxRateTimespan: '0',
  };

  before(async () => {
    [adminAddress, from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, fromSigner, , , signer4] = await ethers.getSigners();

    chainlinkPath = chainlinkConversionPath.connect(network.name, fromSigner);

    const erc20FeeProxy = await new ERC20FeeProxy__factory(adminSigner).deploy();
    const ethFeeProxy = await new EthereumFeeProxy__factory(adminSigner).deploy();
    const erc20ConversionProxy = await new Erc20ConversionProxy__factory(adminSigner).deploy(
      erc20FeeProxy.address,
      chainlinkPath.address,
      await adminSigner.getAddress(),
    );
    const ethConversionProxy = await new EthConversionProxy__factory(adminSigner).deploy(
      ethFeeProxy.address,
      chainlinkPath.address,
      ETH_hash,
      adminAddress,
    );

    batchConversionProxy = await new BatchConversionPayments__factory(adminSigner).deploy(
      erc20FeeProxy.address,
      ethFeeProxy.address,
      erc20ConversionProxy.address,
      ethConversionProxy.address,
      chainlinkPath.address,
      await adminSigner.getAddress(),
    );

    fauConvRequest.recipient = to;
    daiConvRequest.recipient = to;
    ethConvRequest.recipient = to;
    fauRequest.recipient = to;
    ethRequest.recipient = to;

    // set batch proxy fees and connect fromSigner
    await batchConversionProxy.setBatchFee(BATCH_FEE);
    await batchConversionProxy.setNativeAndUSDAddress(ETH_hash, USD_hash);

    await batchConversionProxy.setBatchFeeAmountUSDLimit(BigNumber.from(10).mul(1e8)); // 10$

    batchConversionProxy = batchConversionProxy.connect(fromSigner);

    // set ERC20 tokens and transfer token to "from" (fromSigner)
    daiERC20 = new TestERC20__factory(adminSigner).attach(DAI_address);
    await daiERC20.transfer(from, BigNumber.from(thousandWith18Decimal + '0000000'));
    daiERC20 = daiERC20.connect(fromSigner);

    fauERC20 = new TestERC20__factory(adminSigner).attach(FAU_address);
    await fauERC20.transfer(from, BigNumber.from(thousandWith18Decimal + '0000000'));
    fauERC20 = fauERC20.connect(fromSigner);
  });
  beforeEach(async () => {
    await daiERC20.approve(batchConversionProxy.address, thousandWith18Decimal + fiatDecimals, {
      from,
    });
    await fauERC20.approve(batchConversionProxy.address, thousandWith18Decimal + fiatDecimals, {
      from,
    });
  });

  const getERC20Balances = async (testERC20: TestERC20) => {
    const fromDAIBalance = await testERC20.balanceOf(from);
    const toDAIBalance = await testERC20.balanceOf(to);
    const feeDAIBalance = await testERC20.balanceOf(feeAddress);
    const batchDAIBalance = await testERC20.balanceOf(batchConversionProxy.address);
    return [fromDAIBalance, toDAIBalance, feeDAIBalance, batchDAIBalance];
  };

  /** Returns BigNumber amounts with DAI decimals */
  const getExpectedConvERC20Balances = (
    amount: number,
    fee: number,
    nPayment: number,
    path: 'EUR_DAI' | 'USD_FAU',
  ) => {
    // Temporary decimal offset to have a precise conversion with floating rates
    const precision = 1_000_000;
    const conversionRate =
      path === 'EUR_DAI'
        ? BigNumber.from('1' + daiDecimals)
            .mul(precision)
            .mul(EUR_USD_RATE)
            .div(DAI_USD_RATE)
        : BigNumber.from('1' + daiDecimals)
            .mul(precision)
            .mul(PRECISION_RATE)
            .div(FAU_USD_RATE);
    const expectedToBalanceDiff = BigNumber.from(amount).mul(conversionRate).mul(nPayment);
    const expectedFeeBalanceDiff =
      // fee added by the batch
      expectedToBalanceDiff
        .add(BigNumber.from(fee).mul(conversionRate).mul(nPayment))
        .mul(BATCH_FEE)
        .div(BATCH_DENOMINATOR)
        // fee within the invoice: .1% of the amount,
        .add(BigNumber.from(fee).mul(conversionRate).mul(nPayment));
    fee;
    const expectedFromBalanceDiff = expectedToBalanceDiff.add(expectedFeeBalanceDiff).mul(-1);
    return [
      expectedFromBalanceDiff.div(precision),
      expectedToBalanceDiff.div(precision),
      expectedFeeBalanceDiff.div(precision),
    ];
  };

  /** No conversion */
  const getExpectedERC20Balances = (amount: string, fee: string, nPayment: number) => {
    const expectedToBalanceDiff = BigNumber.from(amount).mul(nPayment);
    const expectedFeeBalanceDiff =
      // fee added by the batch
      expectedToBalanceDiff
        .mul(BATCH_FEE)
        .div(BATCH_DENOMINATOR)
        // fee within the invoice: .1% of the amount,
        .add(BigNumber.from(fee).mul(nPayment));
    fee;
    const expectedFromBalanceDiff = expectedToBalanceDiff.add(expectedFeeBalanceDiff).mul(-1);
    return [expectedFromBalanceDiff, expectedToBalanceDiff, expectedFeeBalanceDiff];
  };

  /** Compares the expected delta-balances with the one it computes for from, to and fee addresses. */
  const expectERC20BalanceDiffs = async (
    token: 'DAI' | 'FAU',
    initialFromBalance: BigNumber,
    initialToBalance: BigNumber,
    initialFeeBalance: BigNumber,
    expectedFromBalanceDiff: BigNumber,
    expectedToBalanceDiff: BigNumber,
    expectedFeeBalanceDiff: BigNumber,
  ) => {
    const testERC20 = token === 'FAU' ? fauERC20 : daiERC20;
    // Get balances
    const [fromBalance, toBalance, feeBalance, batchBalance] = await getERC20Balances(testERC20);
    // Compare balance changes to expected values
    const fromBalanceDiff = BigNumber.from(fromBalance).sub(initialFromBalance);
    const toBalanceDiff = BigNumber.from(toBalance).sub(initialToBalance);
    const feeBalanceDiff = BigNumber.from(feeBalance).sub(initialFeeBalance);
    expect(toBalanceDiff).to.equals(expectedToBalanceDiff, `toBalanceDiff in ${token}`);
    expect(feeBalanceDiff).to.equals(expectedFeeBalanceDiff, `feeBalanceDiff in ${token}`);
    expect(fromBalanceDiff).to.equals(expectedFromBalanceDiff, `fromBalanceDiff in ${token}`);
    expect(batchBalance).to.equals('0', `batchBalance in ${token}`);
  };

  /** Compares the expected delta-balances with the one it computes for from, to and fee addresses. */
  const expectETHBalanceDiffs = async (
    ethAmount: BigNumber,
    ethFeeAmount: BigNumber,
    initialFromETHBalance: BigNumber,
    initialToETHBalance: BigNumber,
    initialFeeETHBalance: BigNumber,
    isConversion = true,
    forceExpectedFeeETHBalanceDiff?: BigNumber,
  ) => {
    const receipt = await tx.wait();
    const gasAmount = receipt.gasUsed.mul(gasPrice);

    const fromETHBalance = await provider.getBalance(await fromSigner.getAddress());
    const toETHBalance = await provider.getBalance(to);
    const feeETHBalance = await provider.getBalance(feeAddress);
    const batchETHBalance = await provider.getBalance(batchConversionProxy.address);

    // Calculate the difference of the balance : now - initial
    const fromETHBalanceDiff = initialFromETHBalance.sub(fromETHBalance);
    const toETHBalanceDiff = toETHBalance.sub(initialToETHBalance);
    const feeETHBalanceDiff = feeETHBalance.sub(initialFeeETHBalance);

    const expectedToETHBalanceDiff = ethAmount;

    const expectedFeeETHBalanceDiff =
      forceExpectedFeeETHBalanceDiff ??
      expectedToETHBalanceDiff
        .add(isConversion ? ethFeeAmount : 0)
        .mul(BATCH_FEE)
        .div(BATCH_DENOMINATOR)
        .add(ethFeeAmount);
    const expectedFromETHBalanceDiff = gasAmount
      .add(expectedToETHBalanceDiff)
      .add(expectedFeeETHBalanceDiff);

    // Check balance changes
    expect(toETHBalanceDiff).to.equals(expectedToETHBalanceDiff, 'toETHBalanceDiff');
    expect(feeETHBalanceDiff).to.equals(expectedFeeETHBalanceDiff, 'feeETHBalanceDiff');
    expect(fromETHBalanceDiff).to.equals(expectedFromETHBalanceDiff, 'DiffBalance');
    expect(batchETHBalance).to.equals('0', 'batchETHBalance');
  };

  /**
   * Pays 3 ERC20 conversions payments, with DAI and FAU tokens and it calculates the balances
   * It also check the balances expected for FAU token.
   * @param forceExpectedFeeFAUBalanceDiff used when batch fees are limited
   * @param forceExpectedFeeDAIBalanceDiff used when batch fees are limited
   */
  const manyPaymentsBatchConv = async (
    paymentBatch: () => Promise<ContractTransaction>,
    forceExpectedFeeFAUBalanceDiff = BigNumber.from(-1),
    forceExpectedFeeDAIBalanceDiff = BigNumber.from(-1),
  ) => {
    const [initialFromDAIBalance, initialToDAIBalance, initialFeeDAIBalance] =
      await getERC20Balances(daiERC20);
    const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
      await getERC20Balances(fauERC20);

    await paymentBatch();

    // check the balance daiERC20 token
    let [expectedFromDAIBalanceDiff, expectedToDAIBalanceDiff, expectedFeeDAIBalanceDiff] =
      getExpectedConvERC20Balances(100000, 100, 2, 'EUR_DAI');

    if (forceExpectedFeeDAIBalanceDiff.gt(-1)) {
      expectedFeeDAIBalanceDiff = forceExpectedFeeDAIBalanceDiff;
      expectedFromDAIBalanceDiff = expectedFeeDAIBalanceDiff.add(expectedToDAIBalanceDiff).mul(-1);
    }
    await expectERC20BalanceDiffs(
      'DAI',
      initialFromDAIBalance,
      initialToDAIBalance,
      initialFeeDAIBalance,
      expectedFromDAIBalanceDiff,
      expectedToDAIBalanceDiff,
      expectedFeeDAIBalanceDiff,
    );
    // check the balance fauERC20 token
    let [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
      getExpectedConvERC20Balances(100000, 100, 1, 'USD_FAU');

    if (forceExpectedFeeFAUBalanceDiff.gt(-1)) {
      expectedFeeFAUBalanceDiff = forceExpectedFeeFAUBalanceDiff;
      expectedFromFAUBalanceDiff = expectedFeeFAUBalanceDiff.add(expectedToFAUBalanceDiff).mul(-1);
    }
    await expectERC20BalanceDiffs(
      'FAU',
      initialFromFAUBalance,
      initialToFAUBalance,
      initialFeeFAUBalance,
      expectedFromFAUBalanceDiff,
      expectedToFAUBalanceDiff,
      expectedFeeFAUBalanceDiff,
    );
  };

  describe('batchPayments', async () => {
    const testBatchPayment = async (applyLimit: boolean) => {
      // Limit is applied if there are paths to USD: skipFeeUSDLimit
      const pathsToUSD = applyLimit
        ? [
            [FAU_address, USD_hash],
            [DAI_address, USD_hash],
          ]
        : [];

      describe(`payment with${
        applyLimit ? '' : 'out'
      } application of the batch fee limit USD: skipFeeUSDLimit`, async () => {
        it(`make 1 ERC20 payment with no conversion, BATCH_ERC20_PAYMENTS`, async () => {
          const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
            await getERC20Balances(fauERC20);

          await batchConversionProxy.batchPayments(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ERC20_PAYMENTS,
                requestDetails: [fauRequest],
              },
            ],
            pathsToUSD,
            feeAddress,
          );

          // check the balance fauERC20 token
          let [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
            getExpectedERC20Balances('100000' + daiDecimals, '100' + daiDecimals, 1);

          if (applyLimit) {
            // 10$ of batch fees in FAU and request fees
            expectedFeeFAUBalanceDiff = BigNumber.from('104975124378109452736');
            expectedFromFAUBalanceDiff = expectedToFAUBalanceDiff
              .add(expectedFeeFAUBalanceDiff)
              .mul(-1);
          }

          await expectERC20BalanceDiffs(
            'FAU',
            initialFromFAUBalance,
            initialToFAUBalance,
            initialFeeFAUBalance,
            expectedFromFAUBalanceDiff,
            expectedToFAUBalanceDiff,
            expectedFeeFAUBalanceDiff,
          );
        });
        it(`make 1 ERC20 payment with no conversion`, async () => {
          const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
            await getERC20Balances(fauERC20);
          await batchConversionProxy.batchPayments(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
                requestDetails: [fauRequest],
              },
            ],
            pathsToUSD,
            feeAddress,
          );

          // check the balance fauERC20 token
          let [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
            getExpectedERC20Balances('100000' + daiDecimals, '100' + daiDecimals, 1);

          if (applyLimit) {
            // 10$ of batch fees in FAU and request fees
            expectedFeeFAUBalanceDiff = BigNumber.from('104975124378109452736');
            expectedFromFAUBalanceDiff = expectedToFAUBalanceDiff
              .add(expectedFeeFAUBalanceDiff)
              .mul(-1);
          }

          await expectERC20BalanceDiffs(
            'FAU',
            initialFromFAUBalance,
            initialToFAUBalance,
            initialFeeFAUBalance,
            expectedFromFAUBalanceDiff,
            expectedToFAUBalanceDiff,
            expectedFeeFAUBalanceDiff,
          );
        });
        it('make 3 ERC20 payments with different tokens and conversion lengths', async () => {
          const batchPayments = async () => {
            return await batchConversionProxy.batchPayments(
              [
                {
                  paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
                  requestDetails: [fauConvRequest, daiConvRequest, daiConvRequest],
                },
              ],
              pathsToUSD,
              feeAddress,
            );
          };

          if (applyLimit) {
            // 10$ of batch fees converted in FAU, and 100$ of request fees converted in FAU.
            // instead of (1000$ + 1$) + 100$ of fees
            const expectedFeeFAUBalanceDiff = BigNumber.from('54726368159253681641');
            // 0€ of batch fees converted in DAI, and 2*100€ of fees converted in DAI.
            // instead of (1000€ + 1€) + 100€ of fees without the limit
            const expectedFeeDAIBalanceDiff = BigNumber.from('237623762376237623762');

            await manyPaymentsBatchConv(
              batchPayments,
              expectedFeeFAUBalanceDiff,
              expectedFeeDAIBalanceDiff,
            );
          } else {
            await manyPaymentsBatchConv(batchPayments);
          }
        });
        it('make 1 ETH payment without conversion', async () => {
          // get Eth balances
          const initialToETHBalance = await provider.getBalance(to);
          const initialFeeETHBalance = await provider.getBalance(feeAddress);
          const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());

          tx = await batchConversionProxy.batchPayments(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_PAYMENTS,
                requestDetails: [ethRequest],
              },
            ],
            pathsToUSD,
            feeAddress,
            {
              value: BigNumber.from(1100 * 1e8)
                .mul(USD_ETH_RATE)
                .mul(2),
            },
          );

          await expectETHBalanceDiffs(
            BigNumber.from(1100 * 1e8).mul(USD_ETH_RATE),
            BigNumber.from(2 * 1e8).mul(USD_ETH_RATE),
            initialFromETHBalance,
            initialToETHBalance,
            initialFeeETHBalance,
            false,
            BigNumber.from(applyLimit ? '24000000000000000' : '26000000000000000'), // 10$ + request fees in ETH
          );
        });
        it('make 1 ETH payment with 1-step conversion', async () => {
          // get Eth balances
          const initialToETHBalance = await provider.getBalance(to);
          const initialFeeETHBalance = await provider.getBalance(feeAddress);
          const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());
          tx = await batchConversionProxy.batchPayments(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_CONVERSION_PAYMENTS,
                requestDetails: [ethConvRequest],
              },
            ],
            pathsToUSD,
            feeAddress,
            {
              value: BigNumber.from('1000' + fiatDecimals)
                .mul(USD_ETH_RATE)
                .mul(2),
            },
          );

          await expectETHBalanceDiffs(
            BigNumber.from('1000' + fiatDecimals).mul(USD_ETH_RATE),
            BigNumber.from('1' + fiatDecimals).mul(USD_ETH_RATE),
            initialFromETHBalance,
            initialToETHBalance,
            initialFeeETHBalance,
            true,
            BigNumber.from(applyLimit ? '22000000000000000' : '22020000000000000'),
          );
        });
        it('make n heterogeneous (ERC20 and ETH) payments with and without conversion', async () => {
          // get balances
          const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
            await getERC20Balances(fauERC20);
          const initialToETHBalance = await provider.getBalance(to);
          const initialFeeETHBalance = await provider.getBalance(feeAddress);
          const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());

          tx = await batchConversionProxy.batchPayments(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
                requestDetails: [fauConvRequest],
              },
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
                requestDetails: [fauRequest],
              },
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_PAYMENTS,
                requestDetails: [ethRequest],
              },
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_CONVERSION_PAYMENTS,
                requestDetails: [ethConvRequest],
              },
            ],
            pathsToUSD,
            feeAddress,
            {
              value: BigNumber.from('1000' + fiatDecimals)
                .mul(USD_ETH_RATE)
                .mul(4),
            }, // + 11 to pay batch fees
          );

          // Chech FAU Balances //
          let [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
            getExpectedConvERC20Balances(100000, 100, 1, 'USD_FAU');

          const [
            noConvExpectedFromFAUBalanceDiff,
            noConvExpectedToFAUBalanceDiff,
            noConvExpectedFeeFAUBalanceDiff,
          ] = getExpectedERC20Balances('100000' + daiDecimals, '100' + daiDecimals, 1);

          if (applyLimit) {
            expectedFeeFAUBalanceDiff = BigNumber.from('154726368159253681641'); // 10$ of batch fee and the invoices fees
            expectedFromFAUBalanceDiff = expectedToFAUBalanceDiff
              .add(expectedFeeFAUBalanceDiff)
              .add(noConvExpectedToFAUBalanceDiff)
              .mul(-1);
          } else {
            expectedFeeFAUBalanceDiff = expectedFeeFAUBalanceDiff.add(
              noConvExpectedFeeFAUBalanceDiff,
            );
            expectedFromFAUBalanceDiff = expectedFromFAUBalanceDiff.add(
              noConvExpectedFromFAUBalanceDiff,
            );
          }
          await expectERC20BalanceDiffs(
            'FAU',
            initialFromFAUBalance,
            initialToFAUBalance,
            initialFeeFAUBalance,
            expectedFromFAUBalanceDiff,
            expectedToFAUBalanceDiff.add(noConvExpectedToFAUBalanceDiff),
            expectedFeeFAUBalanceDiff,
          );

          // Check ETH balances //
          const receipt = await tx.wait();
          const gasAmount = receipt.gasUsed.mul(gasPrice);

          const fromETHBalance = await provider.getBalance(await fromSigner.getAddress());
          const toETHBalance = await provider.getBalance(to);
          const feeETHBalance = await provider.getBalance(feeAddress);
          const batchETHBalance = await provider.getBalance(batchConversionProxy.address);

          // Calculate the difference of the balance : now - initial
          const fromETHBalanceDiff = fromETHBalance.sub(initialFromETHBalance);
          const toETHBalanceDiff = toETHBalance.sub(initialToETHBalance);
          const feeETHBalanceDiff = feeETHBalance.sub(initialFeeETHBalance);

          // expectedFeeETHBalanceDiff includes batch conversion fees now
          // expect if there is the fee USD limit: batch conversion fees = 0
          const expectedFeeETHBalanceDiff =
            // Batch conversion
            BigNumber.from(1000)
              .mul(1e8)
              .mul(USD_ETH_RATE)
              .add(1e8 * USD_ETH_RATE)
              .mul(applyLimit ? 0 : BATCH_FEE)
              .div(BATCH_DENOMINATOR)
              .add(1e8 * USD_ETH_RATE)
              // Batch no-conversion
              .add(
                BigNumber.from(1100 * 1e8)
                  .mul(USD_ETH_RATE)
                  .mul(applyLimit ? 0 : BATCH_FEE)
                  .div(BATCH_DENOMINATOR)
                  .add(BigNumber.from(2 * 1e8).mul(USD_ETH_RATE)),
              );

          const expectedToETHBalanceDiff = BigNumber.from(1000)
            .mul(1e8)
            .mul(USD_ETH_RATE)
            .add(BigNumber.from(1100).mul(1e8).mul(USD_ETH_RATE));

          const expectedFromETHBalanceDiff = gasAmount
            .add(expectedToETHBalanceDiff)
            .add(expectedFeeETHBalanceDiff)
            .mul(-1);

          // Check balance changes
          expect(toETHBalanceDiff).to.equals(expectedToETHBalanceDiff, 'toETHBalanceDiff');
          expect(feeETHBalanceDiff).to.equals(expectedFeeETHBalanceDiff, 'feeETHBalanceDiff');
          expect(fromETHBalanceDiff).to.equals(expectedFromETHBalanceDiff, 'DiffBalance');
          expect(batchETHBalance).to.equals('0', 'batchETHBalance');
        });
      });
    };

    await testBatchPayment(true);
    await testBatchPayment(false);
  });

  describe('batchPayments errors', async () => {
    it(`too many elements within batchPayments metaDetails input`, async () => {
      await expect(
        batchConversionProxy.batchPayments(
          Array(6).fill({
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
            requestDetails: [],
          }),
          [],
          feeAddress,
        ),
      ).to.be.revertedWith('more than 5 metaDetails');
    });
    it(`wrong paymentNetworkId set in metaDetails input`, async () => {
      await expect(
        batchConversionProxy.batchPayments(
          [
            {
              paymentNetworkId: 6,
              requestDetails: [],
            },
          ],
          [],
          feeAddress,
        ),
      ).to.be.revertedWith('Wrong paymentNetworkId');
    });
  });

  describe('batchMultiERC20ConversionPayments', async () => {
    it('make 1 payment with 1-step conversion', async () => {
      const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
        await getERC20Balances(fauERC20);

      await batchConversionProxy
        .connect(fromSigner)
        .batchMultiERC20ConversionPayments([fauConvRequest], [], feeAddress);

      const [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
        getExpectedConvERC20Balances(100000, 100, 1, 'USD_FAU');

      await expectERC20BalanceDiffs(
        'FAU',
        initialFromFAUBalance,
        initialToFAUBalance,
        initialFeeFAUBalance,
        expectedFromFAUBalanceDiff,
        expectedToFAUBalanceDiff,
        expectedFeeFAUBalanceDiff,
      );
    });
    it('make 1 payment with 2-steps conversion in DAI', async () => {
      const [initialFromDAIBalance, initialToDAIBalance, initialFeeDAIBalance] =
        await getERC20Balances(daiERC20);

      await batchConversionProxy
        .connect(fromSigner)
        .batchMultiERC20ConversionPayments([daiConvRequest], [], feeAddress);

      const [expectedFromDAIBalanceDiff, expectedToDAIBalanceDiff, expectedFeeDAIBalanceDiff] =
        getExpectedConvERC20Balances(100000, 100, 1, 'EUR_DAI');

      await expectERC20BalanceDiffs(
        'DAI',
        initialFromDAIBalance,
        initialToDAIBalance,
        initialFeeDAIBalance,
        expectedFromDAIBalanceDiff,
        expectedToDAIBalanceDiff,
        expectedFeeDAIBalanceDiff,
      );
    });
    it('make 3 payments with different tokens and conversion length', async () => {
      const batchPayments = async () => {
        return await batchConversionProxy
          .connect(fromSigner)
          .batchMultiERC20ConversionPayments(
            [fauConvRequest, daiConvRequest, daiConvRequest],
            [],
            feeAddress,
          );
      };
      await manyPaymentsBatchConv(batchPayments);
    });
  });

  describe('batchMultiERC20ConversionPayments errors', async () => {
    it('cannot transfer with invalid path', async () => {
      const convRequest = deepCopy(fauConvRequest);
      convRequest.path = [EUR_hash, ETH_hash, DAI_address];
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments([convRequest], [], feeAddress),
      ).to.be.revertedWith('revert No aggregator found');
    });
    it('cannot transfer if max to spend too low', async () => {
      const convRequest = deepCopy(fauConvRequest);
      convRequest.maxToSpend = '1000000'; // not enough
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments([convRequest], [], feeAddress),
      ).to.be.revertedWith('Amount to pay is over the user limit');
    });
    it('cannot transfer if rate is too old', async () => {
      const convRequest = deepCopy(fauConvRequest);
      convRequest.maxRateTimespan = '10';
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments([convRequest], [], feeAddress),
      ).to.be.revertedWith('aggregator rate is outdated');
    });
    it('Not enough allowance', async () => {
      const convRequest = deepCopy(fauConvRequest);
      // reduce fromSigner± allowance
      await fauERC20.approve(
        batchConversionProxy.address,
        BigNumber.from(convRequest.maxToSpend).sub(2),
        {
          from,
        },
      );
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments([convRequest], [], feeAddress),
      ).to.be.revertedWith('Insufficient allowance for batch to pay');
    });
    it('Not enough funds even if partially enough funds', async () => {
      const convRequest = deepCopy(fauConvRequest);
      // fromSigner transfer enough token to pay just 1 invoice to signer4
      await fauERC20
        .connect(fromSigner)
        .transfer(await signer4.getAddress(), BigNumber.from(convRequest.maxToSpend));
      // increase signer4 allowance
      await fauERC20
        .connect(signer4)
        .approve(batchConversionProxy.address, thousandWith18Decimal + fiatDecimals);

      // 3 invoices to pay
      await expect(
        batchConversionProxy
          .connect(signer4)
          .batchMultiERC20ConversionPayments(
            [convRequest, convRequest, convRequest],
            [],
            feeAddress,
          ),
      ).to.be.revertedWith('Not enough funds, including fees');

      // signer4 transfer token to fromSigner
      await fauERC20
        .connect(signer4)
        .transfer(from, await fauERC20.balanceOf(await signer4.getAddress()));
    });
  });

  describe(`batchNativeConversionPayments`, () => {
    it('make 1 payment with 1-step conversion', async function () {
      // get Eth balances
      const initialToETHBalance = await provider.getBalance(to);
      const initialFeeETHBalance = await provider.getBalance(feeAddress);
      const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());
      tx = await batchConversionProxy.batchNativeConversionPayments(
        [ethConvRequest],
        true,
        feeAddress,
        {
          value: BigNumber.from('1000' + fiatDecimals)
            .mul(USD_ETH_RATE)
            .mul(2),
        },
      );
      await expectETHBalanceDiffs(
        BigNumber.from('1000' + fiatDecimals).mul(USD_ETH_RATE),
        BigNumber.from('1' + fiatDecimals).mul(USD_ETH_RATE),
        initialFromETHBalance,
        initialToETHBalance,
        initialFeeETHBalance,
      );
    });
    it('make 3 payments with different conversion lengths', async () => {
      // get Eth balances
      const initialToETHBalance = await provider.getBalance(to);
      const initialFeeETHBalance = await provider.getBalance(feeAddress);
      const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());
      const EurEthConvRequest = deepCopy(ethConvRequest);
      EurEthConvRequest.path = [EUR_hash, USD_hash, ETH_hash];

      tx = await batchConversionProxy.batchNativeConversionPayments(
        [ethConvRequest, EurEthConvRequest, ethConvRequest],
        true,
        feeAddress,
        {
          value: BigNumber.from('1000' + fiatDecimals)
            .mul(USD_ETH_RATE)
            .mul(4),
        },
      );
      const ethAmount = BigNumber.from('1000' + fiatDecimals)
        .mul(USD_ETH_RATE)
        .mul(2)
        .add(BigNumber.from('1000' + fiatDecimals).mul(24000000)); // 24000000 is EUR_ETH_RATE
      await expectETHBalanceDiffs(
        ethAmount,
        ethAmount.div(1000), // within the request: feeAmount is 1000 smaller than amount
        initialFromETHBalance,
        initialToETHBalance,
        initialFeeETHBalance,
      );
    });
  });

  describe('batchNativeConversionPayments errors', () => {
    it('cannot transfer with invalid path', async () => {
      const wrongConvRequest = deepCopy(ethConvRequest);
      wrongConvRequest.path = [USD_hash, EUR_hash, ETH_hash];
      await expect(
        batchConversionProxy.batchNativeConversionPayments([wrongConvRequest], false, feeAddress, {
          value: (1000 + 1 + 11) * USD_ETH_RATE, // + 11 to pay batch fees
        }),
      ).to.be.revertedWith('No aggregator found');
    });
    it('not enough funds even if partially enough funds', async () => {
      await expect(
        batchConversionProxy.batchNativeConversionPayments(
          [ethConvRequest, ethConvRequest],
          false,
          feeAddress,
          {
            value: (2000 + 1) * USD_ETH_RATE, // no enough to pay the amount AND the fees
          },
        ),
      ).to.be.revertedWith('paymentProxy transferExactEthWithReferenceAndFee failed');
    });
    it('cannot transfer if rate is too old', async () => {
      const wrongConvRequest = deepCopy(ethConvRequest);
      wrongConvRequest.maxRateTimespan = '1';
      await expect(
        batchConversionProxy.batchNativeConversionPayments([wrongConvRequest], false, feeAddress, {
          value: 1000 + 1 + 11, // + 11 to pay batch fees
        }),
      ).to.be.revertedWith('aggregator rate is outdated');
    });
  });

  describe('Functions inherited from contract BatchNoConversionPayments ', () => {
    it(`make 1 ERC20 payment without conversion, using batchERC20Payments`, async () => {
      const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
        await getERC20Balances(fauERC20);
      await batchConversionProxy.batchERC20Payments(
        [
          {
            recipient: to,
            requestAmount: '100000',
            path: [FAU_address],
            paymentReference: referenceExample,
            feeAmount: '100',
            maxToSpend: '0',
            maxRateTimespan: '0',
          },
        ],
        [],
        feeAddress,
      );

      const [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
        getExpectedERC20Balances('100000', '100', 1);

      await expectERC20BalanceDiffs(
        'FAU',
        initialFromFAUBalance,
        initialToFAUBalance,
        initialFeeFAUBalance,
        expectedFromFAUBalanceDiff,
        expectedToFAUBalanceDiff,
        expectedFeeFAUBalanceDiff,
      );
    });
    it(`make 1 ERC20 payment without conversion, using batchMultiERC20Payments`, async () => {
      const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
        await getERC20Balances(fauERC20);
      await batchConversionProxy.batchMultiERC20Payments(
        [
          {
            recipient: to,
            requestAmount: '100000',
            path: [FAU_address],
            paymentReference: referenceExample,
            feeAmount: '100',
            maxToSpend: '0',
            maxRateTimespan: '0',
          },
        ],
        [],
        feeAddress,
      );

      const [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
        getExpectedERC20Balances('100000', '100', 1);
      await expectERC20BalanceDiffs(
        'FAU',
        initialFromFAUBalance,
        initialToFAUBalance,
        initialFeeFAUBalance,
        expectedFromFAUBalanceDiff,
        expectedToFAUBalanceDiff,
        expectedFeeFAUBalanceDiff,
      );
    });
    it('make 1 ETH payment without conversion', async () => {
      // get Eth balances
      const initialToETHBalance = await provider.getBalance(to);
      const initialFeeETHBalance = await provider.getBalance(feeAddress);
      const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());
      tx = await batchConversionProxy.batchNativePayments(
        [
          {
            recipient: to,
            requestAmount: '1000',
            path: [],
            paymentReference: referenceExample,
            feeAmount: '1',
            maxToSpend: '0',
            maxRateTimespan: '0',
          },
        ],
        false,
        feeAddress,
        { value: 1000 + 1 + 11 }, // + 11 to pay batch fees
      );
      await expectETHBalanceDiffs(
        BigNumber.from(1000),
        BigNumber.from(1),
        initialFromETHBalance,
        initialToETHBalance,
        initialFeeETHBalance,
      );
    });
  });
});
