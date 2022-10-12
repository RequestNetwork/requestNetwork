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
import Utils from '@requestnetwork/utils';
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
  const daiDecimals = '1000000000000000000'; // 10^18
  const fiatDecimals = '00000000';
  const thousandWith18Decimal = '1000000000000000000000';
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
    requestAmount: '100000' + fiatDecimals,
    path: [USD_hash, FAU_address],
    paymentReference: referenceExample,
    feeAmount: '100' + fiatDecimals,
    maxToSpend: '20000000000000000000' + fiatDecimals, // Way enough
    maxRateTimespan: '0',
  };

  const daiConvRequest: PaymentTypes.RequestDetail = {
    recipient: '',
    requestAmount: '100000' + fiatDecimals,
    path: [EUR_hash, USD_hash, DAI_address],
    paymentReference: referenceExample,
    feeAmount: '100' + fiatDecimals,
    maxToSpend: '30000000000000000000' + fiatDecimals, // Way enough
    maxRateTimespan: '0',
  };

  const ethConvRequest: PaymentTypes.RequestDetail = {
    recipient: '',
    requestAmount: '1000',
    path: [USD_hash, ETH_hash],
    paymentReference: referenceExample,
    feeAmount: '1',
    maxToSpend: '0',
    maxRateTimespan: '0',
  };

  before(async () => {
    [, from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
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

    // set batch proxy fees and connect fromSigner
    await batchConversionProxy.setBatchFee(BATCH_FEE);
    await batchConversionProxy.setETHAndUSDAddress(ETH_hash, USD_hash);

    await batchConversionProxy.setBatchFeeAmountUSDLimit(BigNumber.from(100_000).mul(1e8));

    batchConversionProxy = batchConversionProxy.connect(fromSigner);

    // set ERC20 tokens and transfer token to "from" (fromSigner)
    daiERC20 = new TestERC20__factory(adminSigner).attach(DAI_address);
    await daiERC20.transfer(from, BigNumber.from(thousandWith18Decimal + '0000000'));
    daiERC20 = daiERC20.connect(fromSigner);

    fauERC20 = new TestERC20__factory(adminSigner).attach(FAU_address);
    await fauERC20.transfer(from, BigNumber.from(thousandWith18Decimal + '0000000'));
    fauERC20 = fauERC20.connect(fromSigner);

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
        ? BigNumber.from(daiDecimals).mul(precision).mul(EUR_USD_RATE).div(DAI_USD_RATE)
        : BigNumber.from(daiDecimals).mul(precision).mul(PRECISION_RATE).div(FAU_USD_RATE);
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
    console.log('check balance to');
    expect(toBalanceDiff).to.equals(expectedToBalanceDiff, `toBalanceDiff in ${token}`);
    console.log('check balance fee');
    expect(feeBalanceDiff).to.equals(expectedFeeBalanceDiff, `feeBalanceDiff in ${token}`);
    console.log('check balance from');
    expect(fromBalanceDiff).to.equals(expectedFromBalanceDiff, `fromBalanceDiff in ${token}`);
    console.log('here 1');
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
    console.log('to');
    expect(toETHBalanceDiff).to.equals(expectedToETHBalanceDiff, 'toETHBalanceDiff');
    console.log('fee:', feeETHBalanceDiff.toString());
    expect(feeETHBalanceDiff).to.equals(expectedFeeETHBalanceDiff, 'feeETHBalanceDiff');
    console.log('from');
    expect(fromETHBalanceDiff).to.equals(expectedFromETHBalanceDiff, 'DiffBalance');
    console.log('contract');
    expect(batchETHBalance).to.equals('0', 'batchETHBalance');
  };

  /**
   * Pays 3 ERC20 conversions payments, with DAI and FAU tokens and it calculates the balances
   * It also check the balances expected for FAU token.
   */
  const manyPaymentsBatchConv = async (paymentBatch: () => Promise<ContractTransaction>) => {
    const [initialFromDAIBalance, initialToDAIBalance, initialFeeDAIBalance] =
      await getERC20Balances(daiERC20);
    const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
      await getERC20Balances(fauERC20);

    await paymentBatch();

    // check the balance daiERC20 token
    const [expectedFromDAIBalanceDiff, expectedToDAIBalanceDiff, expectedFeeDAIBalanceDiff] =
      getExpectedConvERC20Balances(100000, 100, 2, 'EUR_DAI');
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
  };

  describe('batchPayment', async () => {
    describe('payment under the fee limit', async () => {
      it(`make 1 ERC20 payment with no conversion`, async () => {
        const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
          await getERC20Balances(fauERC20);
        await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
              requestDetails: [
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
            },
          ],
          [[FAU_address, USD_hash]],
          feeAddress,
        );

        // check the balance fauERC20 token
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
      it('make 3 ERC20 payments with different tokens and conversion lengths', async () => {
        const batchPayment = async () => {
          return await batchConversionProxy.batchPayment(
            [
              {
                paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
                requestDetails: [fauConvRequest, daiConvRequest, daiConvRequest],
              },
            ],
            [
              [FAU_address, USD_hash],
              [DAI_address, USD_hash],
            ],
            feeAddress,
          );
        };
        await manyPaymentsBatchConv(batchPayment);
      });

      it('make 1 ETH payment without conversion', async () => {
        // get Eth balances
        const initialToETHBalance = await provider.getBalance(to);
        const initialFeeETHBalance = await provider.getBalance(feeAddress);
        const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());

        tx = await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_PAYMENTS,
              requestDetails: [
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
            },
          ],
          [],
          feeAddress,
          { value: 1000 + 1 + 11 }, // + 11 to pay batch fees
        );

        await expectETHBalanceDiffs(
          BigNumber.from(1000),
          BigNumber.from(1),
          initialFromETHBalance,
          initialToETHBalance,
          initialFeeETHBalance,
          false,
        );
      });

      it('make 1 ETH payment with 1-step conversion', async () => {
        // get Eth balances
        const initialToETHBalance = await provider.getBalance(to);
        const initialFeeETHBalance = await provider.getBalance(feeAddress);
        const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());
        tx = await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_CONVERSION_PAYMENTS,
              requestDetails: [ethConvRequest],
            },
          ],
          [],
          feeAddress,
          {
            value: (1000 + 1 + 11) * USD_ETH_RATE, // + 11 to pay batch fees
          },
        );

        await expectETHBalanceDiffs(
          BigNumber.from(1000 * USD_ETH_RATE),
          BigNumber.from(1 * USD_ETH_RATE),
          initialFromETHBalance,
          initialToETHBalance,
          initialFeeETHBalance,
        );
      });

      it('make n heterogeneous (ERC20 and ETH) payments with and without conversion', async () => {
        // get balances
        const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
          await getERC20Balances(fauERC20);
        const initialToETHBalance = await provider.getBalance(to);
        const initialFeeETHBalance = await provider.getBalance(feeAddress);
        const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());

        tx = await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
              requestDetails: [fauConvRequest],
            },
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
              requestDetails: [
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
            },
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_PAYMENTS,
              requestDetails: [
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
            },
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_CONVERSION_PAYMENTS,
              requestDetails: [ethConvRequest],
            },
          ],
          [[FAU_address, USD_hash]],
          feeAddress,
          { value: (1000 + 1 + 11) * USD_ETH_RATE + (1000 + 1 + 11) }, // + 11 to pay batch fees
        );

        // Chech FAU Balances //
        const [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
          getExpectedConvERC20Balances(100000, 100, 1, 'USD_FAU');

        const [
          noConvExpectedFromFAUBalanceDiff,
          noConvExpectedToFAUBalanceDiff,
          noConvExpectedFeeFAUBalanceDiff,
        ] = getExpectedERC20Balances('100000', '100', 1);

        await expectERC20BalanceDiffs(
          'FAU',
          initialFromFAUBalance,
          initialToFAUBalance,
          initialFeeFAUBalance,
          expectedFromFAUBalanceDiff.add(noConvExpectedFromFAUBalanceDiff),
          expectedToFAUBalanceDiff.add(noConvExpectedToFAUBalanceDiff),
          expectedFeeFAUBalanceDiff.add(noConvExpectedFeeFAUBalanceDiff),
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
        const expectedFeeETHBalanceDiff =
          // Batch conversion
          BigNumber.from(1000 * USD_ETH_RATE)
            .add(1 * USD_ETH_RATE)
            .mul(BATCH_FEE)
            .div(BATCH_DENOMINATOR)
            // Batch no-conversion
            .add(1 * USD_ETH_RATE)
            .add(BigNumber.from(1000).add(1).mul(BATCH_FEE).div(BATCH_DENOMINATOR).add(1));

        const expectedFromETHBalanceDiff = gasAmount
          .add(1000 * USD_ETH_RATE + 1000)
          .add(expectedFeeETHBalanceDiff)
          .mul(-1);

        // Check balance changes
        expect(fromETHBalanceDiff).to.equals(expectedFromETHBalanceDiff, 'DiffBalance');
        expect(toETHBalanceDiff).to.equals(
          BigNumber.from(1000 * USD_ETH_RATE + 1000),
          'toETHBalanceDiff',
        );
        expect(feeETHBalanceDiff).to.equals(expectedFeeETHBalanceDiff, 'feeETHBalanceDiff');
        expect(batchETHBalance).to.equals('0', 'batchETHBalance');
      });
    });
    describe('payment above the fee limit', async () => {
      before(async () => {
        await batchConversionProxy
          .connect(adminSigner)
          .setBatchFeeAmountUSDLimit(BigNumber.from(1000).mul(1e8)); // 1_000 $
      });
      after(async () => {
        await batchConversionProxy
          .connect(adminSigner)
          .setBatchFeeAmountUSDLimit(BigNumber.from(100_000).mul(1e8)); // 100_000 $
      });
      it(`make 1 ERC20 payment with no conversion, BATCH_ERC20_PAYMENTS`, async () => {
        const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
          await getERC20Balances(fauERC20);
        await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ERC20_PAYMENTS,
              requestDetails: [
                {
                  recipient: to,
                  requestAmount: '20100' + daiDecimals,
                  path: [FAU_address],
                  paymentReference: referenceExample,
                  feeAmount: '0' + daiDecimals,
                  maxToSpend: '0',
                  maxRateTimespan: '0',
                },
              ],
            },
          ],
          [[FAU_address, USD_hash]],
          feeAddress,
        );

        // check the balance fauERC20 token
        let [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
          getExpectedERC20Balances('20100' + daiDecimals, '0' + daiDecimals, 1);

        // 1000$ of batch fees in FAU
        expectedFeeFAUBalanceDiff = BigNumber.from('498512437810945273631');
        expectedFromFAUBalanceDiff = expectedToFAUBalanceDiff
          .add(expectedFeeFAUBalanceDiff)
          .mul(-1);

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
        await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
              requestDetails: [
                {
                  recipient: to,
                  requestAmount: '10100' + daiDecimals,
                  path: [FAU_address],
                  paymentReference: referenceExample,
                  feeAmount: '0' + daiDecimals,
                  maxToSpend: '0',
                  maxRateTimespan: '0',
                },
              ],
            },
          ],
          [[FAU_address, USD_hash]],
          feeAddress,
        );

        // check the balance fauERC20 token
        let [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
          getExpectedERC20Balances('10100' + daiDecimals, '0' + daiDecimals, 1);

        // 1000$ of batch fees in FAU
        expectedFeeFAUBalanceDiff = BigNumber.from('498512437810945273631');
        expectedFromFAUBalanceDiff = expectedToFAUBalanceDiff
          .add(expectedFeeFAUBalanceDiff)
          .mul(-1);

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
      it(`make 1 ERC20 payment with no conversion and wrong paths to USD`, async () => {
        const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
          await getERC20Balances(fauERC20);
        await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
              requestDetails: [
                {
                  recipient: to,
                  requestAmount: '10100' + daiDecimals,
                  path: [FAU_address],
                  paymentReference: referenceExample,
                  feeAmount: '0' + daiDecimals,
                  maxToSpend: '0',
                  maxRateTimespan: '0',
                },
              ],
            },
          ],
          [[DAI_address, USD_hash]], // it should be FAU_address
          feeAddress,
        );
        // check the balance fauERC20 token
        let [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
          getExpectedERC20Balances('10100' + daiDecimals, '0' + daiDecimals, 1);

        // around 1001$ of batch fees in FAU - the fee limit is not applied because of the wrong path
        expectedFeeFAUBalanceDiff = BigNumber.from('1011010000000000000000');
        expectedFromFAUBalanceDiff = expectedToFAUBalanceDiff
          .add(expectedFeeFAUBalanceDiff)
          .mul(-1);

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
      it('make 2 ERC20 payments on two tokens with conversion and only FAU token pays batch fee', async () => {
        // get balances
        const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
          await getERC20Balances(fauERC20);
        const [initialFromDAIBalance, initialToDAIBalance, initialFeeDAIBalance] =
          await getERC20Balances(daiERC20);

        tx = await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
              requestDetails: [fauConvRequest, daiConvRequest],
            },
          ],
          [
            [FAU_address, USD_hash],
            [DAI_address, USD_hash],
          ],
          feeAddress,
        );

        // Check FAU Balances //
        let [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
          getExpectedConvERC20Balances(100000, 100, 1, 'USD_FAU');

        // 1000$ of batch fees converted in FAU, and 100$ of fees converted in FAU.
        // instead of (1000$ + 1$) + 100$ of fees
        expectedFeeFAUBalanceDiff = BigNumber.from('547263681597009955218');
        expectedFromFAUBalanceDiff = expectedToFAUBalanceDiff
          .add(expectedFeeFAUBalanceDiff)
          .mul(-1);

        await expectERC20BalanceDiffs(
          'FAU',
          initialFromFAUBalance,
          initialToFAUBalance,
          initialFeeFAUBalance,
          expectedFromFAUBalanceDiff,
          expectedToFAUBalanceDiff,
          expectedFeeFAUBalanceDiff,
        );

        // Check DAI Balances //
        let [expectedFromDAIBalanceDiff, expectedToDAIBalanceDiff, expectedFeeDAIBalanceDiff] =
          getExpectedConvERC20Balances(100000, 100, 1, 'EUR_DAI');

        // 0€ of batch fees converted in DAI, and 100€ of fees converted in DAI.
        // instead of (1000€ + 1€) + 100€ of fees without the limit
        expectedFeeDAIBalanceDiff = BigNumber.from('118811881188118811881');
        expectedFromDAIBalanceDiff = expectedToDAIBalanceDiff
          .add(expectedFeeDAIBalanceDiff)
          .mul(-1);

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
      it('make 1 ETH payment without conversion', async () => {
        await batchConversionProxy
          .connect(adminSigner)
          .setBatchFeeAmountUSDLimit(BigNumber.from(10).mul(1e8)); // 1 $
        // get Eth balances
        const initialToETHBalance = await provider.getBalance(to);
        const initialFeeETHBalance = await provider.getBalance(feeAddress);
        const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());
        const USDReqAmount = 200000000000;
        const reqAmount = BigNumber.from(USDReqAmount).mul(USD_ETH_RATE).toString();
        tx = await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_PAYMENTS,
              requestDetails: [
                {
                  recipient: to,
                  requestAmount: reqAmount,
                  path: [],
                  paymentReference: referenceExample,
                  feeAmount: '2000',
                  maxToSpend: '0',
                  maxRateTimespan: '0',
                },
              ],
            },
          ],
          [],
          feeAddress,
          { value: BigNumber.from(reqAmount).mul(2) },
        );

        await expectETHBalanceDiffs(
          BigNumber.from(reqAmount),
          BigNumber.from('2000'),
          initialFromETHBalance,
          initialToETHBalance,
          initialFeeETHBalance,
          false,
          BigNumber.from('20000000000000000').add('2000'), // batch fees limited + invoice fees
        );
        await batchConversionProxy
          .connect(adminSigner)
          .setBatchFeeAmountUSDLimit(BigNumber.from(1000).mul(1e8));
      });
      it('make 1 ETH payment with 1-step conversion', async () => {
        await batchConversionProxy
          .connect(adminSigner)
          .setBatchFeeAmountUSDLimit(BigNumber.from(10).mul(1e8)); // 10 $
        // get Eth balances
        const initialToETHBalance = await provider.getBalance(to);
        const initialFeeETHBalance = await provider.getBalance(feeAddress);
        const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());
        const reqAmount = 200000000000;
        const copyEthConvRequest = Utils.deepCopy(ethConvRequest);
        copyEthConvRequest.requestAmount = reqAmount.toString();
        tx = await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_CONVERSION_PAYMENTS,
              requestDetails: [copyEthConvRequest],
            },
          ],
          [],
          feeAddress,
          {
            value: BigNumber.from(2 * reqAmount + 1)
              .mul(USD_ETH_RATE)
              .toString(),
          },
        );

        await expectETHBalanceDiffs(
          BigNumber.from(reqAmount).mul(USD_ETH_RATE),
          BigNumber.from(1).mul(USD_ETH_RATE),
          initialFromETHBalance,
          initialToETHBalance,
          initialFeeETHBalance,
          true,
          BigNumber.from('20000000020100000'), // equal the sum of the batch fee (10$) and the invoice fee
        );
        await batchConversionProxy
          .connect(adminSigner)
          .setBatchFeeAmountUSDLimit(BigNumber.from(1000).mul(1e8)); // 1000 $
      });
      it('make n heterogeneous (ERC20 and ETH) payments with and without conversion', async () => {
        const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
          await getERC20Balances(fauERC20);
        const initialToETHBalance = await provider.getBalance(to);
        const initialFeeETHBalance = await provider.getBalance(feeAddress);
        const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());

        tx = await batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
              requestDetails: [fauConvRequest],
            },
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
              requestDetails: [
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
            },
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_PAYMENTS,
              requestDetails: [
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
            },
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_CONVERSION_PAYMENTS,
              requestDetails: [ethConvRequest],
            },
          ],
          [[FAU_address, USD_hash]],
          feeAddress,
          { value: (1000 + 1 + 11) * USD_ETH_RATE + (1000 + 1 + 11) }, // + 11 to pay batch fees
        );
        // Chech FAU Balances //
        let [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
          getExpectedConvERC20Balances(100000, 100, 1, 'USD_FAU');

        const [
          _noConvExpectedFromFAUBalanceDiff,
          noConvExpectedToFAUBalanceDiff,
          _noConvExpectedFeeFAUBalanceDiff,
        ] = getExpectedERC20Balances('100000', '100', 1);

        expectedFeeFAUBalanceDiff = BigNumber.from('547263681597009955318'); // 1000$ of batch fee and the invoice fees
        expectedToFAUBalanceDiff = expectedToFAUBalanceDiff.add(noConvExpectedToFAUBalanceDiff);
        expectedFromFAUBalanceDiff = expectedToFAUBalanceDiff
          .add(expectedFeeFAUBalanceDiff)
          .mul(-1);
        await expectERC20BalanceDiffs(
          'FAU',
          initialFromFAUBalance,
          initialToFAUBalance,
          initialFeeFAUBalance,
          expectedFromFAUBalanceDiff,
          expectedToFAUBalanceDiff,
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

        // expectedFeeETHBalanceDiff => batch conversion fees = 0
        const expectedFeeETHBalanceDiff = BigNumber.from(1 * USD_ETH_RATE).add(1);

        const expectedFromETHBalanceDiff = gasAmount
          .add(1000 * USD_ETH_RATE + 1000)
          .add(expectedFeeETHBalanceDiff)
          .mul(-1);

        // Check balance changes
        console.log('ETH');
        console.log('to');
        expect(toETHBalanceDiff).to.equals(
          BigNumber.from(1000 * USD_ETH_RATE + 1000),
          'toETHBalanceDiff',
        );
        console.log('fee');
        expect(feeETHBalanceDiff).to.equals(expectedFeeETHBalanceDiff, 'feeETHBalanceDiff');
        console.log('from');
        expect(fromETHBalanceDiff).to.equals(expectedFromETHBalanceDiff, 'DiffBalance');
        expect(batchETHBalance).to.equals('0', 'batchETHBalance');
      });
    });
  });
  describe('batchPayment errors', async () => {
    it(`too many elements within batchPayment metaDetails input`, async () => {
      await expect(
        batchConversionProxy.batchPayment(
          Array(6).fill({
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
            requestDetails: [],
          }),
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('more than 5 metaDetails');
    });
    it(`wrong paymentNetworkId set in metaDetails input`, async () => {
      await expect(
        batchConversionProxy.batchPayment(
          [
            {
              paymentNetworkId: 6,
              requestDetails: [],
            },
          ],
          [[FAU_address, USD_hash]],
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
        .batchMultiERC20ConversionPayments(
          [fauConvRequest],
          0,
          [[FAU_address, USD_hash]],
          feeAddress,
        );

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
        .batchMultiERC20ConversionPayments(
          [daiConvRequest],
          0,
          [[DAI_address, USD_hash]],
          feeAddress,
        );

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
      const batchPayment = async () => {
        return await batchConversionProxy.connect(fromSigner).batchMultiERC20ConversionPayments(
          [fauConvRequest, daiConvRequest, daiConvRequest],
          0,
          [
            [FAU_address, USD_hash],
            [DAI_address, USD_hash],
          ],
          feeAddress,
        );
      };
      await manyPaymentsBatchConv(batchPayment);
    });
  });
  describe('batchMultiERC20ConversionPayments errors', async () => {
    it('cannot transfer with invalid path', async () => {
      const convRequest = Utils.deepCopy(fauConvRequest);
      convRequest.path = [EUR_hash, ETH_hash, DAI_address];
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments(
          [convRequest],
          0,
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('revert No aggregator found');
    });

    it('cannot transfer if max to spend too low', async () => {
      const convRequest = Utils.deepCopy(fauConvRequest);
      convRequest.maxToSpend = '1000000'; // not enough
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments(
          [convRequest],
          0,
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('Amount to pay is over the user limit');
    });

    it('cannot transfer if rate is too old', async () => {
      const convRequest = Utils.deepCopy(fauConvRequest);
      convRequest.maxRateTimespan = '10';
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments(
          [convRequest],
          0,
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('aggregator rate is outdated');
    });

    it('Not enough allowance', async () => {
      const convRequest = Utils.deepCopy(fauConvRequest);
      // reduce fromSigner± allowance
      await fauERC20.approve(
        batchConversionProxy.address,
        BigNumber.from(convRequest.maxToSpend).sub(2),
        {
          from,
        },
      );
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments(
          [convRequest],
          0,
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('Insufficient allowance for batch to pay');
    });

    it('Not enough funds even if partially enough funds', async () => {
      const convRequest = Utils.deepCopy(fauConvRequest);
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
            0,
            [[FAU_address, USD_hash]],
            feeAddress,
          ),
      ).to.be.revertedWith('Not enough funds, including fees');

      // signer4 transfer token to fromSigner
      await fauERC20
        .connect(signer4)
        .transfer(from, await fauERC20.balanceOf(await signer4.getAddress()));
    });
  });
  describe(`batchEthConversionPayments`, () => {
    it('make 1 payment with 1-step conversion', async function () {
      // get Eth balances
      const initialToETHBalance = await provider.getBalance(to);
      const initialFeeETHBalance = await provider.getBalance(feeAddress);
      const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());
      tx = await batchConversionProxy.batchEthConversionPayments([ethConvRequest], 0, feeAddress, {
        value: (1000 + 1 + 11) * USD_ETH_RATE, // + 11 to pay batch fees
      });
      await expectETHBalanceDiffs(
        BigNumber.from(1000 * USD_ETH_RATE),
        BigNumber.from(1 * USD_ETH_RATE),
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
      const EurConvRequest = Utils.deepCopy(ethConvRequest);
      EurConvRequest.path = [EUR_hash, USD_hash, ETH_hash];

      tx = await batchConversionProxy.batchEthConversionPayments(
        [ethConvRequest, EurConvRequest, ethConvRequest],
        0,
        feeAddress,
        {
          value: BigNumber.from('100000000000000000'),
        },
      );
      await expectETHBalanceDiffs(
        BigNumber.from(1000 * USD_ETH_RATE)
          .mul(2)
          .add(1000 * 24000000), // 24000000 is EUR_ETH_RATE
        BigNumber.from(USD_ETH_RATE).mul(2).add(24000000),
        initialFromETHBalance,
        initialToETHBalance,
        initialFeeETHBalance,
      );
    });
  });
  describe('batchEthConversionPayments errors', () => {
    it('cannot transfer with invalid path', async () => {
      const wrongConvRequest = Utils.deepCopy(ethConvRequest);
      wrongConvRequest.path = [USD_hash, EUR_hash, ETH_hash];
      await expect(
        batchConversionProxy.batchEthConversionPayments([wrongConvRequest], 0, feeAddress, {
          value: (1000 + 1 + 11) * USD_ETH_RATE, // + 11 to pay batch fees
        }),
      ).to.be.revertedWith('No aggregator found');
    });
    it('not enough funds even if partially enough funds', async () => {
      await expect(
        batchConversionProxy.batchEthConversionPayments(
          [ethConvRequest, ethConvRequest],
          0,
          feeAddress,
          {
            value: (2000 + 1) * USD_ETH_RATE, // no enough to pay the amount AND the fees
          },
        ),
      ).to.be.revertedWith('paymentProxy transferExactEthWithReferenceAndFee failed');
    });

    it('cannot transfer if rate is too old', async () => {
      const wrongConvRequest = Utils.deepCopy(ethConvRequest);
      wrongConvRequest.maxRateTimespan = '1';
      await expect(
        batchConversionProxy.batchEthConversionPayments([wrongConvRequest], 0, feeAddress, {
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
        [[FAU_address, USD_hash]],
        0,
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
        [[FAU_address, USD_hash]],
        0,
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
      tx = await batchConversionProxy.batchEthPayments(
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
        0,
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
