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
import { BigNumber, ContractTransaction, Signer } from 'ethers';
import { expect } from 'chai';
import { CurrencyManager } from '@requestnetwork/currency';
import { chainlinkConversionPath } from '../../src/lib';
import { localERC20AlphaArtifact, secondLocalERC20AlphaArtifact } from './localArtifacts';
import Utils from '@requestnetwork/utils';
import { HttpNetworkConfig } from 'hardhat/types';

describe('contract: BatchConversionPayments', async () => {
  const networkConfig = network.config as HttpNetworkConfig;
  const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);

  let from: string;
  let to: string;
  let feeAddress: string;
  let adminSigner: Signer;
  let signer1: Signer;
  let signer4: Signer;

  let tx: ContractTransaction;

  // constants used to set up batch conversion proxy, and also requests payment
  const batchFee = 50;
  const batchConvFee = 100;
  const thousandWith18Decimal = '1000000000000000000000';
  const referenceExample = '0xaaaa';
  /**
   * amount and feeAmount are in:
   *   - EUR, or USD for conversion inputs
   *   - DAI for non-conversion ERC20 inputs
   *   - ETH for non-conversion ETH inputs
   */
  const amount = BigNumber.from(100000);
  const feeAmount = amount.div(1000);

  // constants and variables to set up proxies and paths
  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
  let DAI_address: string;
  let FAU_address: string;

  let batchConversionProxy: BatchConversionPayments;
  let daiERC20: TestERC20;
  let fauERC20: TestERC20;
  let chainlinkPath: ChainlinkConversionPath;

  // variables used to check daiERC20 balances (1st token)
  let fromOldBalance1: BigNumber;
  let toOldBalance1: BigNumber;
  let feeOldBalance1: BigNumber;

  let fromDiffBalanceExpected1: BigNumber;
  let toDiffBalanceExpected1: BigNumber;
  let feeDiffBalanceExpected1: BigNumber;

  // variables used to check ETH balances
  let beforeEthBalanceTo: BigNumber;
  let beforeEthBalanceFee: BigNumber;
  let beforeEthBalance: BigNumber;

  // variables used for chainlink and conversion payments
  let conversionToPay: BigNumber;
  let conversionFees: BigNumber;

  // variables used for Eth conversion payments, and also as expected value
  let ethConversionToPay: BigNumber;
  let ethConversionFee: BigNumber;

  // type required by Erc20 conversion batch function inputs
  let convDetail: any;
  let ethConvDetail: any;

  const emptyCryptoDetails = {
    tokenAddresses: [],
    recipients: [],
    amounts: [],
    paymentReferences: [],
    feeAmounts: [],
  };

  /**
   * @notice it sets the conversions including fees to be paid, and it set the convDetail input
   * @dev it update 3 global variables: conversionToPay, conversionFees, and convDetail
   */
  const setConvToPayAndConvDetail = async (
    recipient: string,
    path: string[],
    requestAmount: string,
    feeAmount: string,
    maxRateTimespan: number,
    chainlinkPath: ChainlinkConversionPath,
  ) => {
    conversionToPay = (await chainlinkPath.getConversion(requestAmount, path)).result;
    conversionFees = (await chainlinkPath.getConversion(feeAmount, path)).result;
    convDetail = {
      recipient: recipient,
      requestAmount: requestAmount,
      path: path,
      paymentReference: referenceExample,
      feeAmount: feeAmount,
      maxToSpend: conversionToPay.add(conversionFees).toString(),
      maxRateTimespan: maxRateTimespan,
    };
  };

  /**
   * check token ERC20 balances of: the payer (from), the recipient (to), the feeAddress, and the batch contract
   */
  const checkBalancesForOneToken = async (
    testERC20: TestERC20,
    fromOldBalance: BigNumber,
    toOldBalance: BigNumber,
    feeOldBalance: BigNumber,
    fromDiffBalanceExpected: BigNumber,
    toDiffBalanceExpected: BigNumber,
    feeDiffBalanceExpected: BigNumber,
  ) => {
    // Get balances
    const fromBalance = await testERC20.balanceOf(from);
    const toBalance = await testERC20.balanceOf(to);
    const feeBalance = await testERC20.balanceOf(feeAddress);
    const batchBalance = await testERC20.balanceOf(batchConversionProxy.address);

    // Calculate the difference of the balance : now - before
    const fromDiffBalance = BigNumber.from(fromBalance).sub(fromOldBalance);
    const toDiffBalance = BigNumber.from(toBalance).sub(toOldBalance);
    const feeDiffBalance = BigNumber.from(feeBalance).sub(feeOldBalance);
    // Check balance changes
    expect(fromDiffBalance).to.equals(fromDiffBalanceExpected, 'fromDiffBalance');
    expect(toDiffBalance).to.equals(toDiffBalanceExpected, 'toDiffBalance');
    expect(feeDiffBalance).to.equals(feeDiffBalanceExpected, 'feeDiffBalance');
    expect(batchBalance).to.equals('0', 'batchBalance');
  };

  /**
   * @notice Used to calculate the expected new ERC20 balance of a single token for batch conversion.
   * @dev fees are not exactly calculated with the same formula, depending if it is with conversion or not
   */
  const expectedERC20Balances = (
    conversionToPay_results: BigNumber[],
    conversionFees_results: BigNumber[],
    appliedFees: number,
    withConversion = true,
  ) => {
    let fromDiffBalanceExpected = conversionToPay_results.reduce(
      (prev, x) => prev.sub(x),
      BigNumber.from(0),
    );
    let toDiffBalanceExpected = fromDiffBalanceExpected.mul(-1);
    let feeDiffBalanceExpected = conversionFees_results.reduce(
      (prev, x) => prev.add(x),
      BigNumber.from(0),
    );

    feeDiffBalanceExpected = withConversion
      ? toDiffBalanceExpected
          .add(feeDiffBalanceExpected)
          .mul(appliedFees)
          .div(10000)
          .add(feeDiffBalanceExpected)
      : toDiffBalanceExpected.mul(appliedFees).div(10000).add(feeDiffBalanceExpected);

    fromDiffBalanceExpected = fromDiffBalanceExpected.sub(feeDiffBalanceExpected);
    return [fromDiffBalanceExpected, toDiffBalanceExpected, feeDiffBalanceExpected];
  };

  /**
   * Pays 3 ERC20 conversions payments, with DAI and FAU tokens and it calculates the balances
   * It also check the balances expected for FAU token.
   * @param path2 to update the copy of convDetail: convDetail2
   */
  const manyPaymentsBatchConv = async (
    path1: string[],
    path2: string[],
    withBatchRouter = false,
  ) => {
    // set convDetail with "path1"
    await setConvToPayAndConvDetail(
      to,
      path1,
      amount.toString(),
      feeAmount.toString(),
      0,
      chainlinkPath,
    );
    // define a second payment request
    const conversionToPay2 = (await chainlinkPath.getConversion(amount.toString(), path2)).result;
    const conversionFees2 = (await chainlinkPath.getConversion(feeAmount.toString(), path2)).result;
    const convDetail2 = Utils.deepCopy(convDetail);
    convDetail2.path = path2;
    convDetail2.maxToSpend = conversionToPay2.add(conversionFees2).toString();

    // define conversionsToPays & conversionsFees to calculate the expected balances
    const conversionsToPays = [conversionToPay, conversionToPay, conversionToPay2];
    const conversionsFees = [conversionFees, conversionFees, conversionFees2];

    // get balances of the 2nd token, useful when there are 2 different tokens used
    const fromOldBalance2 = await fauERC20.balanceOf(from);
    const toOldBalance2 = await fauERC20.balanceOf(to);
    const feeOldBalance2 = await fauERC20.balanceOf(feeAddress);

    if (withBatchRouter) {
      await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: '0',
            conversionDetails: [convDetail, convDetail, convDetail2],
            cryptoDetails: emptyCryptoDetails,
          },
        ],
        feeAddress,
      );
    } else {
      await batchConversionProxy.batchMultiERC20ConversionPayments(
        [convDetail, convDetail, convDetail2],
        feeAddress,
      );
    }

    // 1st token: daiERC20 - calculate the expected balances
    [fromDiffBalanceExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
      expectedERC20Balances(
        conversionsToPays.slice(0, 2),
        conversionsFees.slice(0, 2),
        batchConvFee,
      );

    // 2nd token: fauERC20 - calculate the expected balances
    const [fromDiffBalanceExpected2, toDiffBalanceExpected2, feeDiffBalanceExpected2] =
      expectedERC20Balances(
        conversionsToPays.slice(2, 3),
        conversionsFees.slice(2, 3),
        batchConvFee,
      );

    // check the balance of the 2nd token, which is not checked in "afterEach" contrary to the 1st token.
    checkBalancesForOneToken(
      fauERC20,
      fromOldBalance2,
      toOldBalance2,
      feeOldBalance2,
      fromDiffBalanceExpected2,
      toDiffBalanceExpected2,
      feeDiffBalanceExpected2,
    );
  };

  /**
   * Gets the balances, calculates the difference between "before" and "after" and raise an error if needed
   * @param ethAmount the amount of ETH to pay
   * @param ethFeeAmount the fee amount of ETH to pay, before to apply batch fees
   * @param feeApplied the batch fees to apply: batchConvFee, or batchFee
   */
  const checkEthBalances = async (
    ethAmount: BigNumber,
    ethFeeAmount: BigNumber,
    feeApplied = batchConvFee,
  ) => {
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed.mul(2 * 10 ** 10);

    const afterEthBalance = await provider.getBalance(await signer1.getAddress());
    const afterEthBalanceTo = await provider.getBalance(to);
    const afterEthBalanceFee = await provider.getBalance(feeAddress);
    const proxyBalance = await provider.getBalance(batchConversionProxy.address);

    // Calculate the difference of the balance : now - before
    const diffBalance = beforeEthBalance.sub(afterEthBalance);
    const diffBalanceTo = afterEthBalanceTo.sub(beforeEthBalanceTo);
    const diffBalanceFee = afterEthBalanceFee.sub(beforeEthBalanceFee);

    // ethFeeAmount includes batch conversion fees now
    ethFeeAmount = ethAmount.add(ethFeeAmount).mul(feeApplied).div(10000).add(ethFeeAmount);
    const diffBalanceExpect = gasUsed.add(ethAmount).add(ethFeeAmount);
    // Check balance changes
    expect(diffBalance).to.equals(diffBalanceExpect, 'DiffBalance');
    expect(diffBalanceTo).to.equals(ethAmount, 'diffBalanceTo');
    expect(diffBalanceFee).to.equals(ethFeeAmount, 'diffBalanceFee');
    expect(proxyBalance).to.equals('0', 'proxyBalance');
  };

  before(async () => {
    [, from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, signer1, , , signer4] = await ethers.getSigners();

    chainlinkPath = chainlinkConversionPath.connect(network.name, signer1);

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
      await adminSigner.getAddress(),
    );

    // set batch proxy fees and connect signer1
    await batchConversionProxy.setBatchFee(batchFee);
    await batchConversionProxy.setBatchConversionFee(batchConvFee);
    batchConversionProxy = batchConversionProxy.connect(signer1);

    // set ERC20 tokens and transfer token to "from" (signer1)
    DAI_address = localERC20AlphaArtifact.getAddress(network.name);
    daiERC20 = new TestERC20__factory(adminSigner).attach(DAI_address);
    await daiERC20.transfer(from, BigNumber.from(thousandWith18Decimal));
    daiERC20 = daiERC20.connect(signer1);

    FAU_address = secondLocalERC20AlphaArtifact.getAddress(network.name);
    fauERC20 = new TestERC20__factory(adminSigner).attach(FAU_address);
    await fauERC20.transfer(from, BigNumber.from(thousandWith18Decimal));
    fauERC20 = fauERC20.connect(signer1);
  });

  beforeEach(async () => {
    fromDiffBalanceExpected1 = BigNumber.from(0);
    toDiffBalanceExpected1 = BigNumber.from(0);
    feeDiffBalanceExpected1 = BigNumber.from(0);
    await daiERC20.approve(batchConversionProxy.address, thousandWith18Decimal, {
      from,
    });
    await fauERC20.approve(batchConversionProxy.address, thousandWith18Decimal, {
      from,
    });
    // get balances of daiERC20 token
    fromOldBalance1 = await daiERC20.balanceOf(from);
    toOldBalance1 = await daiERC20.balanceOf(to);
    feeOldBalance1 = await daiERC20.balanceOf(feeAddress);

    // create a default ERC20 convDetail
    setConvToPayAndConvDetail(
      to,
      [EUR_hash, USD_hash, DAI_address],
      amount.toString(),
      feeAmount.toString(),
      0,
      chainlinkPath,
    );

    // get Eth balances
    beforeEthBalanceTo = await provider.getBalance(to);
    beforeEthBalanceFee = await provider.getBalance(feeAddress);
    beforeEthBalance = await provider.getBalance(await signer1.getAddress());

    ethConvDetail = {
      recipient: to,
      requestAmount: amount,
      path: [USD_hash, ETH_hash],
      paymentReference: referenceExample,
      feeAmount: feeAmount,
      maxToSpend: BigNumber.from(0),
      maxRateTimespan: BigNumber.from(0),
    };

    // expected balances, it can be modified for each test
    ethConversionToPay = (
      await chainlinkPath.getConversion(ethConvDetail.requestAmount, ethConvDetail.path)
    ).result;
    // fees does not include batch fees yet
    ethConversionFee = (
      await chainlinkPath.getConversion(ethConvDetail.feeAmount, ethConvDetail.path)
    ).result;
  });

  afterEach(async () => {
    // check balances of daiERC20 token
    checkBalancesForOneToken(
      daiERC20,
      fromOldBalance1,
      toOldBalance1,
      feeOldBalance1,
      fromDiffBalanceExpected1,
      toDiffBalanceExpected1,
      feeDiffBalanceExpected1,
    );
  });
  describe('batchRouter', async () => {
    it(`make ERC20 payment with no conversion`, async function () {
      await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: 2,
            conversionDetails: [],
            cryptoDetails: {
              tokenAddresses: [DAI_address],
              recipients: [to],
              amounts: [amount],
              paymentReferences: [referenceExample],
              feeAmounts: [feeAmount],
            },
          },
        ],
        feeAddress,
      );

      [fromDiffBalanceExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
        expectedERC20Balances(
          [BigNumber.from(amount)],
          [BigNumber.from(feeAmount)],
          batchFee,
          false,
        );
    });
    it('make 3 ERC20 payments with different tokens and conversion lengths', async () => {
      await manyPaymentsBatchConv([EUR_hash, USD_hash, DAI_address], [USD_hash, FAU_address], true);
    });

    it('make ETH payment without conversion', async function () {
      const cryptoDetails = {
        tokenAddresses: [],
        recipients: [to],
        amounts: [amount], // in ETH
        paymentReferences: [referenceExample],
        feeAmounts: [feeAmount], // in ETH
      };
      tx = await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: 3,
            conversionDetails: [],
            cryptoDetails: cryptoDetails,
          },
        ],
        feeAddress,
        { value: '1000000000' },
      );
      await checkEthBalances(amount, feeAmount, batchFee);
    });

    it('make ETH payment with 1-step conversion', async function () {
      tx = await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: 4,
            conversionDetails: [ethConvDetail],
            cryptoDetails: emptyCryptoDetails,
          },
        ],
        feeAddress,
        {
          value: ethConversionToPay.mul(2),
        },
      );
      await checkEthBalances(ethConversionToPay, ethConversionFee);
    });

    it('make n heterogeneous (ERC20 and ETH) payments with and without conversion', async () => {
      // set convDetail: done within "beforeEach"

      // set ERC20 cryptoDetails
      const cryptoDetails = {
        tokenAddresses: [DAI_address],
        recipients: [to],
        amounts: [amount],
        paymentReferences: [referenceExample],
        feeAmounts: [feeAmount],
      };
      const ethCryptoDetails = Utils.deepCopy(cryptoDetails);
      ethCryptoDetails.tokenAddresses = [];

      await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: 0,
            conversionDetails: [convDetail],
            cryptoDetails: emptyCryptoDetails,
          },
          {
            paymentNetworkId: 2,
            conversionDetails: [],
            cryptoDetails: cryptoDetails,
          },
          {
            paymentNetworkId: 3,
            conversionDetails: [],
            cryptoDetails: ethCryptoDetails,
          },
          {
            paymentNetworkId: 4,
            conversionDetails: [ethConvDetail],
            cryptoDetails: emptyCryptoDetails,
          },
        ],
        feeAddress,
        { value: ethConversionToPay.mul(2).add(amount) },
      );

      const [
        conversionFromDiffBalanceExpected1,
        conversionToDiffBalanceExpected1,
        conversionFeeDiffBalanceExpected1,
      ] = expectedERC20Balances([conversionToPay], [conversionFees], batchConvFee);

      const [
        noConversionFromDiffBalanceExpected1,
        noConversionToDiffBalanceExpected1,
        noConversionFeeDiffBalanceExpected1,
      ] = expectedERC20Balances(
        [BigNumber.from(amount)],
        [BigNumber.from(feeAmount)],
        batchFee,
        false,
      );

      fromDiffBalanceExpected1 = conversionFromDiffBalanceExpected1.add(
        noConversionFromDiffBalanceExpected1,
      );
      toDiffBalanceExpected1 = conversionToDiffBalanceExpected1.add(
        noConversionToDiffBalanceExpected1,
      );
      feeDiffBalanceExpected1 = conversionFeeDiffBalanceExpected1.add(
        noConversionFeeDiffBalanceExpected1,
      );
    });
  });

  describe('batchRouter errors', async () => {
    it(`Too many elements within batchRouter metaDetails input`, async function () {
      await expect(
        batchConversionProxy.batchRouter(
          [
            {
              paymentNetworkId: 2,
              conversionDetails: [],
              cryptoDetails: emptyCryptoDetails,
            },
            {
              paymentNetworkId: 2,
              conversionDetails: [],
              cryptoDetails: emptyCryptoDetails,
            },
            {
              paymentNetworkId: 2,
              conversionDetails: [],
              cryptoDetails: emptyCryptoDetails,
            },
            {
              paymentNetworkId: 2,
              conversionDetails: [],
              cryptoDetails: emptyCryptoDetails,
            },
            {
              paymentNetworkId: 2,
              conversionDetails: [],
              cryptoDetails: emptyCryptoDetails,
            },
            {
              paymentNetworkId: 2,
              conversionDetails: [],
              cryptoDetails: emptyCryptoDetails,
            },
          ],
          feeAddress,
        ),
      ).to.be.revertedWith('more than 5 metaDetails');
    });
    it(`Too many elements within batchRouter metaDetails input`, async function () {
      await expect(
        batchConversionProxy.batchRouter(
          [
            {
              paymentNetworkId: 6,
              conversionDetails: [],
              cryptoDetails: emptyCryptoDetails,
            },
          ],
          feeAddress,
        ),
      ).to.be.revertedWith('wrong paymentNetworkId');
    });
  });
  describe('batchMultiERC20ConversionPayments', async () => {
    it('make 1 payment with 1-step conversion', async () => {
      await setConvToPayAndConvDetail(
        to,
        [USD_hash, DAI_address],
        amount.toString(),
        feeAmount.toString(),
        0,
        chainlinkPath,
      );
      await batchConversionProxy.batchMultiERC20ConversionPayments([convDetail], feeAddress);
      [fromDiffBalanceExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
        expectedERC20Balances([conversionToPay], [conversionFees], batchConvFee);
    });
    it('make 1 payment with 2-steps conversion', async () => {
      await setConvToPayAndConvDetail(
        to,
        [EUR_hash, USD_hash, DAI_address],
        amount.toString(),
        feeAmount.toString(),
        0,
        chainlinkPath,
      );
      await batchConversionProxy.batchMultiERC20ConversionPayments([convDetail], feeAddress);
      [fromDiffBalanceExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
        expectedERC20Balances([conversionToPay], [conversionFees], batchConvFee);
    });
    it('make 3 payment with different tokens and conversion length', async () => {
      await manyPaymentsBatchConv([EUR_hash, USD_hash, DAI_address], [USD_hash, FAU_address]);
    });
  });

  describe('batchMultiERC20ConversionPayments errors', async () => {
    it('cannot transfer with invalid path', async function () {
      convDetail.path = [EUR_hash, ETH_hash, DAI_address];
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments([convDetail], feeAddress),
      ).to.be.revertedWith('revert No aggregator found');
    });

    it('cannot transfer if max to spend too low', async function () {
      convDetail.maxToSpend = conversionToPay.add(conversionFees).sub(1).toString();
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments([convDetail], feeAddress),
      ).to.be.revertedWith('Amount to pay is over the user limit');
    });

    it('cannot transfer if rate is too old', async function () {
      convDetail.maxRateTimespan = 10;
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments([convDetail], feeAddress),
      ).to.be.revertedWith('aggregator rate is outdated');
    });

    it('Not enough allowance', async function () {
      // reduce signer1 allowance
      await daiERC20.approve(
        batchConversionProxy.address,
        BigNumber.from(convDetail.maxToSpend).sub(2),
        {
          from,
        },
      );
      await expect(
        batchConversionProxy.batchMultiERC20ConversionPayments([convDetail], feeAddress),
      ).to.be.revertedWith('Insufficient allowance for batch to pay');
    });

    it('Not enough funds even if partially enough funds', async function () {
      // signer1 transfer enough token to pay just 1 invoice to signer4
      await daiERC20
        .connect(signer1)
        .transfer(await signer4.getAddress(), BigNumber.from(convDetail.maxToSpend));
      // increase signer4 allowance
      await daiERC20.connect(signer4).approve(batchConversionProxy.address, thousandWith18Decimal);

      // 3 invoices to pay
      await expect(
        batchConversionProxy
          .connect(signer4)
          .batchMultiERC20ConversionPayments([convDetail, convDetail, convDetail], feeAddress),
      ).to.be.revertedWith('not enough funds, including fees');

      // signer4 transfer token to signer1
      await daiERC20
        .connect(signer4)
        .transfer(from, await daiERC20.balanceOf(await signer4.getAddress()));
    });
  });
  describe(`batchEthConversionPayments`, () => {
    it('make 1 payment with 1-step conversion', async function () {
      tx = await batchConversionProxy.batchEthConversionPayments([ethConvDetail], feeAddress, {
        value: BigNumber.from('100000000000000000'),
      });
      await checkEthBalances(ethConversionToPay, ethConversionFee);
    });

    it('make 3 payments with different conversion lengths', async function () {
      const EurConvDetail = Utils.deepCopy(ethConvDetail);
      EurConvDetail.path = [EUR_hash, USD_hash, ETH_hash];

      const eurConversionToPay = await chainlinkPath.getConversion(
        EurConvDetail.requestAmount,
        EurConvDetail.path,
      );
      const eurFeesToPay = await chainlinkPath.getConversion(
        EurConvDetail.feeAmount,
        EurConvDetail.path,
      );

      tx = await batchConversionProxy.batchEthConversionPayments(
        [ethConvDetail, EurConvDetail, ethConvDetail],
        feeAddress,
        {
          value: BigNumber.from('100000000000000000'),
        },
      );
      await checkEthBalances(
        eurConversionToPay.result.add(ethConversionToPay.mul(2)),
        eurFeesToPay.result.add(ethConversionFee.mul(2)),
      );
    });
  });
  describe('batchEthConversionPayments errors', () => {
    it('cannot transfer with invalid path', async function () {
      const wrongConvDetail = Utils.deepCopy(ethConvDetail);
      wrongConvDetail.path = [USD_hash, EUR_hash, ETH_hash];
      await expect(
        batchConversionProxy.batchEthConversionPayments([wrongConvDetail], feeAddress, {
          value: ethConversionToPay.mul(2),
        }),
      ).to.be.revertedWith('No aggregator found');
    });
    it('not enough funds even if partially enough funds', async function () {
      await expect(
        batchConversionProxy.batchEthConversionPayments(
          [ethConvDetail, ethConvDetail],
          feeAddress,
          {
            value: ethConversionToPay.mul(2), // no enough to pay the amount AND the fees
          },
        ),
      ).to.be.revertedWith('paymentProxy transferExactEthWithReferenceAndFee failed');
    });

    it('cannot transfer if rate is too old', async function () {
      const wrongConvDetail = Utils.deepCopy(ethConvDetail);
      wrongConvDetail.maxRateTimespan = BigNumber.from('1');
      await expect(
        batchConversionProxy.batchEthConversionPayments([wrongConvDetail], feeAddress, {
          value: ethConversionToPay.mul(2),
        }),
      ).to.be.revertedWith('aggregator rate is outdated');
    });
  });
  describe('Functions herited from contract BatchErc20Payments ', () => {
    it(`batchERC20Payments 1 payment`, async function () {
      await batchConversionProxy.batchERC20Payments(
        DAI_address,
        [to],
        [amount],
        [referenceExample],
        [feeAmount],
        feeAddress,
      );

      [fromDiffBalanceExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
        expectedERC20Balances(
          [BigNumber.from(amount)],
          [BigNumber.from(feeAmount)],
          batchFee,
          false,
        );
    });

    it(`batchMultiERC20Payments 1 payment`, async function () {
      await batchConversionProxy.batchMultiERC20Payments(
        [DAI_address],
        [to],
        [amount],
        [referenceExample],
        [feeAmount],
        feeAddress,
      );

      [fromDiffBalanceExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
        expectedERC20Balances(
          [BigNumber.from(amount)],
          [BigNumber.from(feeAmount)],
          batchFee,
          false,
        );
    });

    it('make 1 payment without conversion', async function () {
      const cryptoDetails = {
        tokenAddresses: [],
        recipients: [to],
        amounts: [amount], // in ETH
        paymentReferences: [referenceExample],
        feeAmounts: [feeAmount], // in ETH
      };
      tx = await batchConversionProxy.batchEthPayments(
        cryptoDetails.recipients,
        cryptoDetails.amounts,
        cryptoDetails.paymentReferences,
        cryptoDetails.feeAmounts,
        feeAddress,
        { value: 1000000000 },
      );
      await checkEthBalances(amount, feeAmount, batchFee);
    });
  });
});
