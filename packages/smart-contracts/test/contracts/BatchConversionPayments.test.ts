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
import { FAU_USD_RATE } from '../../scripts/test-deploy-batch-conversion-deployment';
import { localERC20AlphaArtifact, secondLocalERC20AlphaArtifact } from './localArtifacts';
import Utils from '@requestnetwork/utils';
import { HttpNetworkConfig } from 'hardhat/types';

/* tslint:disable:no-unused-variable */

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
  const batchFee = 50;
  const batchConvFee = 100; // 1%
  const daiDecimals = '1000000000000000000';
  const fiatDecimals = '00000000';
  const thousandDai = daiDecimals + '000';
  const millionDai = daiDecimals + '000000';
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
  const DAI_address = localERC20AlphaArtifact.getAddress(network.name);
  const FAU_address = secondLocalERC20AlphaArtifact.getAddress(network.name);

  let batchConversionProxy: BatchConversionPayments;
  let daiERC20: TestERC20;
  let fauERC20: TestERC20;
  let chainlinkPath: ChainlinkConversionPath;

  // variables used to check daiERC20 balances (1st token)
  let fromOldBalance1: BigNumber;
  let toOldBalance1: BigNumber;
  let feeOldBalance1: BigNumber;

  let fromBalanceDiffExpected1: BigNumber;
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

  // TODO: remove this use of global variable convDetail
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
      recipient,
      requestAmount,
      path,
      paymentReference: referenceExample,
      feeAmount,
      maxToSpend: conversionToPay.add(conversionFees).toString(),
      maxRateTimespan,
    };
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
    let fromBalanceDiffExpected = conversionToPay_results.reduce(
      (prev, x) => prev.sub(x),
      BigNumber.from(0),
    );
    let toDiffBalanceExpected = fromBalanceDiffExpected.mul(-1);
    let feeBalanceDiffExpected = conversionFees_results.reduce(
      (prev, x) => prev.add(x),
      BigNumber.from(0),
    );

    feeBalanceDiffExpected = withConversion
      ? toDiffBalanceExpected
          .add(feeBalanceDiffExpected)
          .mul(appliedFees)
          .div(10000)
          .add(feeBalanceDiffExpected)
      : toDiffBalanceExpected.mul(appliedFees).div(10000).add(feeBalanceDiffExpected);

    fromBalanceDiffExpected = fromBalanceDiffExpected.sub(feeBalanceDiffExpected);
    return [fromBalanceDiffExpected, toDiffBalanceExpected, feeBalanceDiffExpected];
  };

  /**
   * Pays 3 ERC20 conversions payments, with DAI and FAU tokens and it calculates the balances
   * It also check the balances expected for FAU token.
   * @param path2 to update the copy of convDetail: convDetail2
   */
  const manyPaymentsBatchConv = async (withBatchRouter = false) => {
    const path1 = [EUR_hash, USD_hash, DAI_address];
    const path2 = [USD_hash, FAU_address];
    const convDetail1 = {
      recipient: to,
      requestAmount: '100000' + fiatDecimals,
      // requestAmount: '100' + fiatDecimals,
      path: path1,
      paymentReference: referenceExample,
      feeAmount: '1' + fiatDecimals,
      maxToSpend: '200000000000000000000000', // Way enough
      maxRateTimespan: '0',
    };
    const convDetail2 = {
      recipient: to,
      requestAmount: '1000' + fiatDecimals,
      // requestAmount: '100' + fiatDecimals,
      path: path2,
      paymentReference: referenceExample,
      feeAmount: '3' + fiatDecimals,
      maxToSpend: '3000000000000000000000', // Way enough
      maxRateTimespan: '0',
    };

    const fromOldDAIBalance = await daiERC20.balanceOf(from);
    const toOldDAIBalance = await daiERC20.balanceOf(to);
    const feeOldDAIBalance = await daiERC20.balanceOf(feeAddress);
    const fromOldFAUBalance = await fauERC20.balanceOf(from);
    const toOldFAUBalance = await fauERC20.balanceOf(to);
    const feeOldFAUBalance = await fauERC20.balanceOf(feeAddress);

    if (withBatchRouter) {
      await batchConversionProxy.batchRouter(
        [
          {
            paymentNetworkId: '0',
            conversionDetails: [convDetail1, convDetail1, convDetail2],
            cryptoDetails: emptyCryptoDetails,
          },
        ],
        feeAddress,
      );
    } else {
      await batchConversionProxy.batchMultiERC20ConversionPayments(
        [convDetail1, convDetail1, convDetail2],
        feeAddress,
      );
    }

    // TODO define more globally (replaces batchConvFee)
    const BATCH_CONV_FEE = 0.01; // %

    // Get balances
    const fromDAIBalance = await daiERC20.balanceOf(from);
    const toDAIBalance = await daiERC20.balanceOf(to);
    const feeDAIBalance = await daiERC20.balanceOf(feeAddress);
    const batchDAIBalance = await daiERC20.balanceOf(batchConversionProxy.address);
    const fromFAUBalance = await fauERC20.balanceOf(from);
    const toFAUBalance = await fauERC20.balanceOf(to);
    const feeFAUBalance = await fauERC20.balanceOf(feeAddress);
    const batchFAUBalance = await fauERC20.balanceOf(batchConversionProxy.address);

    // Compare balance changes to expected values
    const fromDAIBalanceDiff = BigNumber.from(fromDAIBalance)
      .sub(fromOldDAIBalance)
      .div(daiDecimals)
      .toNumber();
    const toDAIBalanceDiff = BigNumber.from(toDAIBalance)
      .sub(toOldDAIBalance)
      .div(daiDecimals)
      .toNumber();
    const feeDAIBalanceDiff = BigNumber.from(feeDAIBalance)
      .sub(feeOldDAIBalance)
      .div(daiDecimals)
      .toNumber();
    const fromFAUBalanceDiff = BigNumber.from(fromFAUBalance)
      .sub(fromOldFAUBalance)
      .div(daiDecimals)
      .toNumber();
    const toFAUBalanceDiff = BigNumber.from(toFAUBalance)
      .sub(toOldFAUBalance)
      .div(daiDecimals)
      .toNumber();
    const feeFAUBalanceDiff = BigNumber.from(feeFAUBalance)
      .sub(feeOldFAUBalance)
      .div(daiDecimals)
      .toNumber();

    const eurDaiRate = 1.2 / 1.01;
    const expectedToDAIBalanceDiff = 2 * 100000 * eurDaiRate;
    const expectedToFAUBalanceDiff = 1000 / FAU_USD_RATE;
    const expectedDAIFeeBalanceDiff = (2 * (100000 + 1) * BATCH_CONV_FEE + 2 * 1) * eurDaiRate;
    const expectedFAUFeeBalanceDiff = ((1000 + 3) * BATCH_CONV_FEE + 3) / FAU_USD_RATE;
    expect(toDAIBalanceDiff).to.equals(
      Math.floor(expectedToDAIBalanceDiff),
      'toBalanceDiff in DAI',
    );
    expect(toFAUBalanceDiff).to.equals(
      Math.floor(expectedToFAUBalanceDiff),
      'toBalanceDiff in FAU',
    );
    expect(feeDAIBalanceDiff).to.equals(
      Math.floor(expectedDAIFeeBalanceDiff),
      'feeBalanceDiff in DAI',
    );
    expect(feeFAUBalanceDiff).to.equals(
      Math.floor(expectedFAUFeeBalanceDiff),
      'feeBalanceDiff in FAU',
    );
    expect(fromDAIBalanceDiff).to.equals(
      0 - Math.floor(expectedToDAIBalanceDiff + expectedDAIFeeBalanceDiff),
      'fromBalanceDiff in DAI',
    );
    expect(fromFAUBalanceDiff).to.equals(
      0 - Math.floor(expectedToFAUBalanceDiff + expectedFAUFeeBalanceDiff),
      'fromBalanceDiff in FAU',
    );
    expect(batchDAIBalance).to.equals('0', 'batchBalance in DAI');
    expect(batchFAUBalance).to.equals('0', 'batchBalance in FAU');
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

    const afterEthBalance = await provider.getBalance(await fromSigner.getAddress());
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
      await adminSigner.getAddress(),
    );

    // set batch proxy fees and connect signer1
    await batchConversionProxy.setBatchFee(batchFee);
    await batchConversionProxy.setBatchConversionFee(batchConvFee);
    batchConversionProxy = batchConversionProxy.connect(fromSigner);

    // set ERC20 tokens and transfer token to "from" (signer1)
    daiERC20 = new TestERC20__factory(adminSigner).attach(DAI_address);
    await daiERC20.transfer(from, BigNumber.from(thousandDai));
    daiERC20 = daiERC20.connect(fromSigner);

    fauERC20 = new TestERC20__factory(adminSigner).attach(FAU_address);
    await fauERC20.transfer(from, BigNumber.from(thousandDai));
    fauERC20 = fauERC20.connect(fromSigner);
  });

  beforeEach(async () => {
    fromBalanceDiffExpected1 = BigNumber.from(0);
    toDiffBalanceExpected1 = BigNumber.from(0);
    feeDiffBalanceExpected1 = BigNumber.from(0);
    await daiERC20.approve(batchConversionProxy.address, millionDai, {
      from,
    });
    await fauERC20.approve(batchConversionProxy.address, millionDai, {
      from,
    });
    // get balances of daiERC20 token
    fromOldBalance1 = await daiERC20.balanceOf(from);
    console.log(
      'allowance:',
      await (await daiERC20.allowance(from, batchConversionProxy.address)).toString(),
    );
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
    beforeEthBalance = await provider.getBalance(await fromSigner.getAddress());

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

  // TODO: this fails for the 2 refactored tests, but it should not depend on global variables
  afterEach(async () => {
    // check balances of daiERC20 token

    const fromBalance = await daiERC20.balanceOf(from);
    const toBalance = await daiERC20.balanceOf(to);
    const feeBalance = await daiERC20.balanceOf(feeAddress);
    const batchBalance = await daiERC20.balanceOf(batchConversionProxy.address);

    // Calculate the difference of the balance : now - before
    const fromBalanceDiff = BigNumber.from(fromBalance).sub(fromOldBalance1);
    const toDiffBalance = BigNumber.from(toBalance).sub(toOldBalance1);
    const feeDiffBalance = BigNumber.from(feeBalance).sub(feeOldBalance1);
    // Check balance changes
    expect(fromBalanceDiff).to.equals(fromBalanceDiffExpected1, 'fromDiffBalance');
    expect(toDiffBalance).to.equals(toDiffBalanceExpected1, 'toDiffBalance');
    expect(feeDiffBalance).to.equals(feeDiffBalanceExpected1, 'feeBalanceDiff');
    expect(batchBalance).to.equals('0', 'batchBalance');
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

      [fromBalanceDiffExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
        expectedERC20Balances(
          [BigNumber.from(amount)],
          [BigNumber.from(feeAmount)],
          batchFee,
          false,
        );
    });
    it.only('make 3 ERC20 payments with different tokens and conversion lengths', async () => {
      await manyPaymentsBatchConv(true);
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

      fromBalanceDiffExpected1 = conversionFromDiffBalanceExpected1.add(
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
      [fromBalanceDiffExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
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
      [fromBalanceDiffExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
        expectedERC20Balances([conversionToPay], [conversionFees], batchConvFee);
    });
    it.only('make 3 payment with different tokens and conversion length', async () => {
      await manyPaymentsBatchConv();
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
        .connect(fromSigner)
        .transfer(await signer4.getAddress(), BigNumber.from(convDetail.maxToSpend));
      // increase signer4 allowance
      await daiERC20.connect(signer4).approve(batchConversionProxy.address, thousandDai);

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

      [fromBalanceDiffExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
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

      [fromBalanceDiffExpected1, toDiffBalanceExpected1, feeDiffBalanceExpected1] =
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
