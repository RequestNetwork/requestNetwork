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
  const BATCH_FEE = 50; // .5%
  const BATCH_CONV_FEE = 100; // 1%
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

  // constants inputs for batch functions, both conversion and no-conversion
  const emptyCryptoDetails: PaymentTypes.CryptoDetails = {
    tokenAddresses: [],
    recipients: [],
    amounts: [],
    paymentReferences: [],
    feeAmounts: [],
  };

  const fauConvDetail: PaymentTypes.ConversionDetail = {
    recipient: '',
    requestAmount: '100000' + fiatDecimals,
    path: [USD_hash, FAU_address],
    paymentReference: referenceExample,
    feeAmount: '100' + fiatDecimals,
    maxToSpend: '20000000000000000000' + fiatDecimals, // Way enough
    maxRateTimespan: '0',
  };

  const daiConvDetail: PaymentTypes.ConversionDetail = {
    recipient: '',
    requestAmount: '100000' + fiatDecimals,
    path: [EUR_hash, USD_hash, DAI_address],
    paymentReference: referenceExample,
    feeAmount: '100' + fiatDecimals,
    maxToSpend: '30000000000000000000' + fiatDecimals, // Way enough
    maxRateTimespan: '0',
  };

  const ethConvDetail: PaymentTypes.ConversionDetail = {
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

    fauConvDetail.recipient = to;
    daiConvDetail.recipient = to;
    ethConvDetail.recipient = to;

    // set batch proxy fees and connect fromSigner
    await batchConversionProxy.setBatchFee(BATCH_FEE);
    await batchConversionProxy.setBatchConversionFee(BATCH_CONV_FEE);
    await batchConversionProxy.setUSDAddress(currencyManager.fromSymbol('USD')!.hash);

    // set a batchFeeAmountUSDLimit equal to 1001$ + 2*1001€
    await batchConversionProxy.setBatchFeeAmountUSDLimit(
      BigNumber.from(1001 * 100 + 2 * 12 * (10000 + 12))
        .mul(1e8)
        .div(100),
    );

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
    path: string,
  ) => {
    // Temporary decimal offset to have a precise conversion with floating rates
    const precision = 1_000_000;
    const conversionRate =
      path === 'EUR_DAI'
        ? BigNumber.from(daiDecimals).mul(precision).mul(EUR_USD_RATE).div(DAI_USD_RATE)
        : BigNumber.from(daiDecimals).mul(precision).mul(PRECISION_RATE).div(FAU_USD_RATE);
    const expectedToDAIBalanceDiff = BigNumber.from(amount).mul(conversionRate).mul(nPayment);
    const expectedFeeDAIBalanceDiff =
      // fee added by the batch
      expectedToDAIBalanceDiff
        .add(BigNumber.from(fee).mul(conversionRate).mul(nPayment))
        .mul(BATCH_CONV_FEE)
        .div(BATCH_DENOMINATOR)
        // fee within the invoice: .1% of the amount,
        .add(BigNumber.from(fee).mul(conversionRate).mul(nPayment));
    fee;
    const expectedFromDAIBalanceDiff = expectedToDAIBalanceDiff
      .add(expectedFeeDAIBalanceDiff)
      .mul(-1);
    return [
      expectedFromDAIBalanceDiff.div(precision),
      expectedToDAIBalanceDiff.div(precision),
      expectedFeeDAIBalanceDiff.div(precision),
    ];
  };

  /** No conversion */
  const getExpectedERC20Balances = (amount: number, fee: number, nPayment: number) => {
    const expectedToDAIBalanceDiff = BigNumber.from(amount).mul(nPayment);
    const expectedFeeDAIBalanceDiff =
      // fee added by the batch
      expectedToDAIBalanceDiff
        .mul(BATCH_FEE)
        .div(BATCH_DENOMINATOR)
        // fee within the invoice: .1% of the amount,
        .add(BigNumber.from(fee).mul(nPayment));
    fee;
    const expectedFromDAIBalanceDiff = expectedToDAIBalanceDiff
      .add(expectedFeeDAIBalanceDiff)
      .mul(-1);
    return [expectedFromDAIBalanceDiff, expectedToDAIBalanceDiff, expectedFeeDAIBalanceDiff];
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
    feeApplied = BATCH_CONV_FEE,
    initialFromETHBalance: BigNumber,
    initialToETHBalance: BigNumber,
    initialFeeETHBalance: BigNumber,
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
    const expectedFeeETHBalanceDiff = expectedToETHBalanceDiff
      .add(ethFeeAmount)
      .mul(feeApplied)
      .div(BATCH_DENOMINATOR)
      .add(ethFeeAmount);
    const expectedFromETHBalanceDiff = gasAmount
      .add(expectedToETHBalanceDiff)
      .add(expectedFeeETHBalanceDiff);

    // Check balance changes
    expect(fromETHBalanceDiff).to.equals(expectedFromETHBalanceDiff, 'DiffBalance');
    expect(toETHBalanceDiff).to.equals(expectedToETHBalanceDiff, 'toETHBalanceDiff');
    expect(feeETHBalanceDiff).to.equals(expectedFeeETHBalanceDiff, 'feeETHBalanceDiff');
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

  describe('batchRouter', async () => {
    it(`make 1 ERC20 payment with no conversion`, async () => {
      const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
        await getERC20Balances(fauERC20);
      await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
            conversionDetails: [
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
            cryptoDetails: emptyCryptoDetails,
          },
        ],
        [[FAU_address, USD_hash]],
        feeAddress,
      );

      // check the balance fauERC20 token
      const [expectedFromFAUBalanceDiff, expectedToFAUBalanceDiff, expectedFeeFAUBalanceDiff] =
        getExpectedERC20Balances(100000, 100, 1);

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
        return await batchConversionProxy.batchRouter(
          [
            {
              paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
              conversionDetails: [fauConvDetail, daiConvDetail, daiConvDetail],
              cryptoDetails: emptyCryptoDetails,
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

      tx = await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_PAYMENTS,
            conversionDetails: [],
            cryptoDetails: {
              tokenAddresses: [],
              recipients: [to],
              amounts: ['1000'],
              paymentReferences: [referenceExample],
              feeAmounts: ['1'],
            },
          },
        ],
        [],
        feeAddress,
        { value: 1000 + 1 + 11 }, // + 11 to pay batch fees
      );

      await expectETHBalanceDiffs(
        BigNumber.from(1000),
        BigNumber.from(1),
        BATCH_FEE,
        initialFromETHBalance,
        initialToETHBalance,
        initialFeeETHBalance,
      );
    });

    it('make 1 ETH payment with 1-step conversion', async () => {
      // get Eth balances
      const initialToETHBalance = await provider.getBalance(to);
      const initialFeeETHBalance = await provider.getBalance(feeAddress);
      const initialFromETHBalance = await provider.getBalance(await fromSigner.getAddress());
      tx = await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_CONVERSION_PAYMENTS,
            conversionDetails: [ethConvDetail],
            cryptoDetails: emptyCryptoDetails,
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
        BATCH_CONV_FEE,
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

      // set inputs: ERC20 cryptoDetails & ethCryptoDetails
      const ethCryptoDetails: PaymentTypes.CryptoDetails = {
        tokenAddresses: [],
        recipients: [to],
        amounts: ['1000'],
        paymentReferences: [referenceExample],
        feeAmounts: ['1'],
      };

      tx = await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_CONVERSION_PAYMENTS,
            conversionDetails: [fauConvDetail],
            cryptoDetails: emptyCryptoDetails,
          },
          {
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
            conversionDetails: [
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
            cryptoDetails: emptyCryptoDetails,
          },
          {
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_PAYMENTS,
            conversionDetails: [],
            cryptoDetails: ethCryptoDetails,
          },
          {
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_ETH_CONVERSION_PAYMENTS,
            conversionDetails: [ethConvDetail],
            cryptoDetails: emptyCryptoDetails,
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
      ] = getExpectedERC20Balances(100000, 100, 1);

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
          .mul(BATCH_CONV_FEE)
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
  describe('batchRouter errors', async () => {
    it(`too many elements within batchRouter metaDetails input`, async () => {
      await expect(
        batchConversionProxy.batchRouter(
          Array(6).fill({
            paymentNetworkId: BATCH_PAYMENT_NETWORK_ID.BATCH_MULTI_ERC20_PAYMENTS,
            conversionDetails: [],
            cryptoDetails: emptyCryptoDetails,
          }),
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('more than 5 metaDetails');
    });
    it(`wrong paymentNetworkId set in metaDetails input`, async () => {
      await expect(
        batchConversionProxy.batchRouter(
          [
            {
              paymentNetworkId: 6,
              conversionDetails: [],
              cryptoDetails: emptyCryptoDetails,
            },
          ],
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('wrong paymentNetworkId');
    });
  });
  describe('batchMultiERC20ConversionPayments', async () => {
    it('make 1 payment with 1-step conversion', async () => {
      const [initialFromFAUBalance, initialToFAUBalance, initialFeeFAUBalance] =
        await getERC20Balances(fauERC20);

      await batchConversionProxy
        .connect(fromSigner)
        .batchMultiERC20ConversionPayments(
          [fauConvDetail],
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
          [daiConvDetail],
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
          [fauConvDetail, daiConvDetail, daiConvDetail],
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
      const convDetail = Utils.deepCopy(fauConvDetail);
      convDetail.path = [EUR_hash, ETH_hash, DAI_address];
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments(
          [convDetail],
          0,
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('revert No aggregator found');
    });

    it('cannot transfer if max to spend too low', async () => {
      const convDetail = Utils.deepCopy(fauConvDetail);
      convDetail.maxToSpend = '1000000'; // not enough
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments(
          [convDetail],
          0,
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('Amount to pay is over the user limit');
    });

    it('cannot transfer if rate is too old', async () => {
      const convDetail = Utils.deepCopy(fauConvDetail);
      convDetail.maxRateTimespan = '10';
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments(
          [convDetail],
          0,
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('aggregator rate is outdated');
    });

    it('Not enough allowance', async () => {
      const convDetail = Utils.deepCopy(fauConvDetail);
      // reduce fromSigner± allowance
      await fauERC20.approve(
        batchConversionProxy.address,
        BigNumber.from(convDetail.maxToSpend).sub(2),
        {
          from,
        },
      );
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments(
          [convDetail],
          0,
          [[FAU_address, USD_hash]],
          feeAddress,
        ),
      ).to.be.revertedWith('Insufficient allowance for batch to pay');
    });

    it('Not enough funds even if partially enough funds', async () => {
      const convDetail = Utils.deepCopy(fauConvDetail);
      // fromSigner transfer enough token to pay just 1 invoice to signer4
      await fauERC20
        .connect(fromSigner)
        .transfer(await signer4.getAddress(), BigNumber.from(convDetail.maxToSpend));
      // increase signer4 allowance
      await fauERC20
        .connect(signer4)
        .approve(batchConversionProxy.address, thousandWith18Decimal + fiatDecimals);

      // 3 invoices to pay
      await expect(
        batchConversionProxy
          .connect(signer4)
          .batchMultiERC20ConversionPayments(
            [convDetail, convDetail, convDetail],
            0,
            [[FAU_address, USD_hash]],
            feeAddress,
          ),
      ).to.be.revertedWith('not enough funds, including fees');

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
      tx = await batchConversionProxy.batchEthConversionPayments([ethConvDetail], feeAddress, {
        value: (1000 + 1 + 11) * USD_ETH_RATE, // + 11 to pay batch fees
      });
      await expectETHBalanceDiffs(
        BigNumber.from(1000 * USD_ETH_RATE),
        BigNumber.from(1 * USD_ETH_RATE),
        BATCH_CONV_FEE,
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
      const EurConvDetail = Utils.deepCopy(ethConvDetail);
      EurConvDetail.path = [EUR_hash, USD_hash, ETH_hash];

      tx = await batchConversionProxy.batchEthConversionPayments(
        [ethConvDetail, EurConvDetail, ethConvDetail],
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
        BATCH_CONV_FEE,
        initialFromETHBalance,
        initialToETHBalance,
        initialFeeETHBalance,
      );
    });
  });
  describe('batchEthConversionPayments errors', () => {
    it('cannot transfer with invalid path', async () => {
      const wrongConvDetail = Utils.deepCopy(ethConvDetail);
      wrongConvDetail.path = [USD_hash, EUR_hash, ETH_hash];
      await expect(
        batchConversionProxy.batchEthConversionPayments([wrongConvDetail], feeAddress, {
          value: (1000 + 1 + 11) * USD_ETH_RATE, // + 11 to pay batch fees
        }),
      ).to.be.revertedWith('No aggregator found');
    });
    it('not enough funds even if partially enough funds', async () => {
      await expect(
        batchConversionProxy.batchEthConversionPayments(
          [ethConvDetail, ethConvDetail],
          feeAddress,
          {
            value: (2000 + 1) * USD_ETH_RATE, // no enough to pay the amount AND the fees
          },
        ),
      ).to.be.revertedWith('paymentProxy transferExactEthWithReferenceAndFee failed');
    });

    it('cannot transfer if rate is too old', async () => {
      const wrongConvDetail = Utils.deepCopy(ethConvDetail);
      wrongConvDetail.maxRateTimespan = '1';
      await expect(
        batchConversionProxy.batchEthConversionPayments([wrongConvDetail], feeAddress, {
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
        getExpectedERC20Balances(100000, 100, 1);

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
        getExpectedERC20Balances(100000, 100, 1);
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
        [to],
        ['1000'],
        [referenceExample],
        ['1'],
        feeAddress,
        { value: 1000 + 1 + 11 }, // + 11 to pay batch fees
      );
      await expectETHBalanceDiffs(
        BigNumber.from(1000),
        BigNumber.from(1),
        BATCH_FEE,
        initialFromETHBalance,
        initialToETHBalance,
        initialFeeETHBalance,
      );
    });
  });
});
