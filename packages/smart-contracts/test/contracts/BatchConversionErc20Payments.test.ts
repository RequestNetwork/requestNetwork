import { ethers, network } from 'hardhat';
import {
  ERC20FeeProxy__factory,
  Erc20ConversionProxy__factory,
  EthConversionProxy__factory,
  EthereumFeeProxy__factory,
  ChainlinkConversionPath,
  TestERC20,
  Erc20ConversionProxy,
  EthConversionProxy,
  TestERC20__factory,
  BatchConversionPayments__factory,
  BatchConversionPayments,
} from '../../src/types';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction, Signer } from 'ethers';
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
  const amountInFiat = '100000000'; // 1 with 8 decimal
  const feesAmountInFiat = '100000'; // 0.001 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  const referenceExample = '0xaaaa';

  // constants and variables to set up proxies and paths
  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
  let DAI_address: string;
  let FAU_address: string;

  let erc20ConversionProxy: Erc20ConversionProxy;
  let ethConversionProxy: EthConversionProxy;
  let testBatchConversionProxy: BatchConversionPayments;
  let testERC20: TestERC20;
  let testERC20b: TestERC20;
  let chainlinkPath: ChainlinkConversionPath;

  // variables used to check testERC20 balances
  let fromOldBalance: BigNumber;
  let toOldBalance: BigNumber;
  let feeOldBalance: BigNumber;

  let fromDiffBalanceExpected: BigNumber;
  let toDiffBalanceExpected: BigNumber;
  let feeDiffBalanceExpected: BigNumber;

  let beforeEthBalanceTo: BigNumber;
  let beforeEthBalanceFee: BigNumber;
  let beforeEthBalance: BigNumber;

  let amountToPayExpected: BigNumber;
  let feeToPayExpected: BigNumber;

  // amount and feeAmount are usually in fiat for conversion inputs, else in ETH
  const amount = BigNumber.from(100000);
  const feeAmount = amount.mul(10).div(10000);

  // variables needed for chainlink and conversion payments
  let conversionToPay: BigNumber;
  let conversionFees: BigNumber;
  // TODO check coherence
  let usdConversionToPay: BigNumber;
  let usdConversionFee: BigNumber;

  // type required by Erc20 conversion batch function inputs
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
  let inputs: Array<ConversionDetail>;

  const emptyCryptoDetails = {
    tokenAddresses: [],
    recipients: [],
    amounts: [],
    paymentReferences: [],
    feeAmounts: [],
  };

  /**
   * @notice Function batch conversion, it can be the batchRouter function,
   * used with conversion args, or directly batchERC20ConversionPaymentsMultiTokens
   */
  let batchConvFunction: (
    args: any,
    feeAddress: string,
    optional?: any,
  ) => Promise<ContractTransaction>;

  /**
   * @notice it sets the conversions including fees to be paid, and it set the convDetail input
   */
  const setConvToPayAndConvDetail = async (
    _recipient: string,
    _path: string[],
    _requestAmount: string,
    _feeAmount: string,
    _maxRateTimespan: number,
    _chainlinkPath: ChainlinkConversionPath,
  ) => {
    conversionToPay = (await _chainlinkPath.getConversion(_requestAmount, _path)).result;
    conversionFees = (await _chainlinkPath.getConversion(_feeAmount, _path)).result;
    convDetail = {
      recipient: _recipient,
      requestAmount: _requestAmount,
      path: _path,
      paymentReference: referenceExample,
      feeAmount: _feeAmount,
      maxToSpend: conversionToPay.add(conversionFees).toString(),
      maxRateTimespan: _maxRateTimespan,
    };
  };

  /**
   * check testERC20 balances of: the payer (from), the recipient (to), the feeAddress, and the batch contract
   */
  const checkBalancesForOneToken = async (
    _testERC20: TestERC20,
    _fromOldBalance: BigNumber,
    _toOldBalance: BigNumber,
    _feeOldBalance: BigNumber,
    _fromDiffBalanceExpected: BigNumber,
    _toDiffBalanceExpected: BigNumber,
    _feeDiffBalanceExpected: BigNumber,
  ) => {
    // Get balances
    const fromBalance = await _testERC20.balanceOf(from);
    const toBalance = await _testERC20.balanceOf(to);
    const feeBalance = await _testERC20.balanceOf(feeAddress);
    const batchBalance = await _testERC20.balanceOf(testBatchConversionProxy.address);

    // Calculate the difference of the balance : now - before
    const fromDiffBalance = BigNumber.from(fromBalance).sub(_fromOldBalance);
    const toDiffBalance = BigNumber.from(toBalance).sub(_toOldBalance);
    const feeDiffBalance = BigNumber.from(feeBalance).sub(_feeOldBalance);
    // Check balance changes
    expect(fromDiffBalance).to.equals(_fromDiffBalanceExpected, 'fromDiffBalance');
    expect(toDiffBalance).to.equals(_toDiffBalanceExpected, 'toDiffBalance');
    expect(feeDiffBalance).to.equals(_feeDiffBalanceExpected, 'feeDiffBalance');
    expect(batchBalance).to.equals('0', 'batchBalance');
  };

  /**
   * @notice Used to calculate the expected new ERC20 balance of a single token for batch conversion.
   * @dev fees are not exactly calculated with the same formula, depending if it is with conversion or not
   */
  const expectedERC20Balances = (
    _conversionToPay_results: BigNumber[],
    _conversionFees_results: BigNumber[],
    appliedFees: number,
    withConversion = true,
  ) => {
    let _fromDiffBalanceExpected = _conversionToPay_results.reduce(
      (prev, x) => prev.sub(x),
      BigNumber.from(0),
    );
    let _toDiffBalanceExpected = _fromDiffBalanceExpected.mul(-1);
    let _feeDiffBalanceExpected = _conversionFees_results.reduce(
      (prev, x) => prev.add(x),
      BigNumber.from(0),
    );

    _feeDiffBalanceExpected = withConversion
      ? _toDiffBalanceExpected
          .add(_feeDiffBalanceExpected)
          .mul(appliedFees)
          .div(10000)
          .add(_feeDiffBalanceExpected)
      : _toDiffBalanceExpected.mul(appliedFees).div(10000).add(_feeDiffBalanceExpected);

    _fromDiffBalanceExpected = _fromDiffBalanceExpected.sub(_feeDiffBalanceExpected);
    return [_fromDiffBalanceExpected, _toDiffBalanceExpected, _feeDiffBalanceExpected];
  };

  /**
   * @notice update convDetail, do an ERC20 conversion batch payment with a single payment inside and calculate the balances
   * @param path to update the convDetail
   */
  const onePaymentBatchConv = async (path: string[]) => {
    await setConvToPayAndConvDetail(to, path, amountInFiat, feesAmountInFiat, 0, chainlinkPath);
    await batchConvFunction([convDetail], feeAddress);
    [fromDiffBalanceExpected, toDiffBalanceExpected, feeDiffBalanceExpected] =
      expectedERC20Balances([conversionToPay], [conversionFees], batchConvFee);
  };

  /**
   * @notice generate nTimes 2 convDetails, do an ERC20 conv batch payment with theses 2*nTimes payments
   *         and calculate the balances
   * @param path2 to update the second convDetail
   */
  const manyPaymentsBatchConv = async (
    path1: string[],
    path2: string[],
    withBatchRouter = false,
  ) => {
    await setConvToPayAndConvDetail(to, path1, amountInFiat, feesAmountInFiat, 0, chainlinkPath);
    // define a second payment request
    const conversionToPay2 = (await chainlinkPath.getConversion(amountInFiat, path2)).result;
    const conversionFees2 = (await chainlinkPath.getConversion(feesAmountInFiat, path2)).result;
    const convDetail2 = Utils.deepCopy(convDetail);
    convDetail2.path = path2;
    convDetail2.maxToSpend = conversionToPay2.add(conversionFees2).toString();

    // define conversionsToPays & conversionsFees to calculate the expected balances
    const conversionsToPays = [conversionToPay, conversionToPay, conversionToPay2];
    const conversionsFees = [conversionFees, conversionFees, conversionFees2];

    // get balances of the 2nd token, useful when there are 2 different tokens used
    const fromOldBalance2 = await testERC20b.balanceOf(from);
    const toOldBalance2 = await testERC20b.balanceOf(to);
    const feeOldBalance2 = await testERC20b.balanceOf(feeAddress);

    if (withBatchRouter) {
      await batchConvFunction(
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
      await batchConvFunction([convDetail, convDetail, convDetail2], feeAddress);
    }

    // 1st token: testERC20 - calculate the expected balances
    [fromDiffBalanceExpected, toDiffBalanceExpected, feeDiffBalanceExpected] =
      expectedERC20Balances(
        conversionsToPays.slice(0, 2),
        conversionsFees.slice(0, 2),
        batchConvFee,
      );

    // 2nd token: testERC20b - calculate the expected balances
    const [fromDiffBalanceExpected2, toDiffBalanceExpected2, feeDiffBalanceExpected2] =
      expectedERC20Balances(
        conversionsToPays.slice(2, 3),
        conversionsFees.slice(2, 3),
        batchConvFee,
      );

    // check the balance of 2nd token, which is not checked in "afterEach" as 1st token.
    checkBalancesForOneToken(
      testERC20b,
      fromOldBalance2,
      toOldBalance2,
      feeOldBalance2,
      fromDiffBalanceExpected2,
      toDiffBalanceExpected2,
      feeDiffBalanceExpected2,
    );
  };

  /**
   * @notice Use to test one batch payment execution for a given ERC20 batch function (no conversion).
   *                 It tests the ERC20 transfer and fee proxy `TransferWithReferenceAndFee` events
   * @param useBatchRouter allows to use a function through the batchRouter or not
   * @param erc20Function selects the batch function name tested: "batchERC20PaymentsWithReference"
   *                      or "batchERC20PaymentsMultiTokensWithReference"
   */
  const batchERC20Payments = async (useBatchRouter: boolean, erc20Function: string) => {
    // set up main variables
    const tokenAddress = testERC20.address;

    // Select the batch function and pay
    let batchFunction: Function;
    if (useBatchRouter) {
      batchFunction = testBatchConversionProxy.batchRouter;
      await batchFunction(
        [
          {
            paymentNetworkId: erc20Function === 'batchERC20PaymentsWithReference' ? 1 : 2,
            conversionDetails: [],
            cryptoDetails: {
              tokenAddresses: [tokenAddress],
              recipients: [to],
              amounts: [amount],
              paymentReferences: [referenceExample],
              feeAmounts: [feeAmount],
            },
          },
        ],
        feeAddress,
      );
    } else {
      batchFunction =
        erc20Function === 'batchERC20PaymentsWithReference'
          ? testBatchConversionProxy.batchERC20PaymentsWithReference
          : testBatchConversionProxy.batchERC20PaymentsMultiTokensWithReference;
      await batchFunction(
        erc20Function === 'batchERC20PaymentsWithReference' ? tokenAddress : [tokenAddress],
        [to],
        [amount],
        [referenceExample],
        [feeAmount],
        feeAddress,
      );
    }

    [fromDiffBalanceExpected, toDiffBalanceExpected, feeDiffBalanceExpected] =
      expectedERC20Balances([BigNumber.from(amount)], [BigNumber.from(feeAmount)], batchFee, false);
  };

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
    const gasUsed = receipt.gasUsed.mul(2 * 10 ** 10);

    const afterEthBalance = await provider.getBalance(await signer1.getAddress());
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

  before(async () => {
    [, from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, signer1, , , signer4] = await ethers.getSigners();

    chainlinkPath = chainlinkConversionPath.connect(network.name, signer1);

    const erc20FeeProxy = await new ERC20FeeProxy__factory(adminSigner).deploy();
    const ethFeeProxy = await new EthereumFeeProxy__factory(adminSigner).deploy();
    erc20ConversionProxy = await new Erc20ConversionProxy__factory(adminSigner).deploy(
      erc20FeeProxy.address,
      chainlinkPath.address,
      await adminSigner.getAddress(),
    );
    ethConversionProxy = await new EthConversionProxy__factory(adminSigner).deploy(
      ethFeeProxy.address,
      chainlinkPath.address,
      ETH_hash,
    );

    testBatchConversionProxy = await new BatchConversionPayments__factory(adminSigner).deploy(
      erc20FeeProxy.address,
      ethFeeProxy.address,
      erc20ConversionProxy.address,
      ethConversionProxy.address,
      await adminSigner.getAddress(),
    );

    // set batch proxy fees
    await testBatchConversionProxy.setBatchFee(batchFee);
    await testBatchConversionProxy.setBatchConversionFee(batchConvFee);
    testBatchConversionProxy = testBatchConversionProxy.connect(signer1);

    // set ERC20 tokens
    DAI_address = localERC20AlphaArtifact.getAddress(network.name);
    testERC20 = new TestERC20__factory(adminSigner).attach(DAI_address);
    await testERC20.transfer(from, BigNumber.from(thousandWith18Decimal));
    testERC20 = TestERC20__factory.connect(testERC20.address, signer1);

    FAU_address = secondLocalERC20AlphaArtifact.getAddress(network.name);
    testERC20b = new TestERC20__factory(adminSigner).attach(FAU_address);
    await testERC20b.transfer(from, BigNumber.from(thousandWith18Decimal));
    testERC20b = TestERC20__factory.connect(testERC20b.address, signer1);
  });
  describe('ERC20', async () => {
    beforeEach(async () => {
      fromDiffBalanceExpected = BigNumber.from(0);
      toDiffBalanceExpected = BigNumber.from(0);
      feeDiffBalanceExpected = BigNumber.from(0);
      await testERC20.approve(testBatchConversionProxy.address, thousandWith18Decimal, {
        from,
      });
      await testERC20b.approve(testBatchConversionProxy.address, thousandWith18Decimal, {
        from,
      });
      // get balances of testERC20 token
      fromOldBalance = await testERC20.balanceOf(from);
      toOldBalance = await testERC20.balanceOf(to);
      feeOldBalance = await testERC20.balanceOf(feeAddress);

      // create a default convDetail
      setConvToPayAndConvDetail(
        to,
        [EUR_hash, USD_hash, DAI_address],
        amountInFiat,
        feesAmountInFiat,
        0,
        chainlinkPath,
      );
    });

    afterEach(async () => {
      // check balances of testERC20 token
      checkBalancesForOneToken(
        testERC20,
        fromOldBalance,
        toOldBalance,
        feeOldBalance,
        fromDiffBalanceExpected,
        toDiffBalanceExpected,
        feeDiffBalanceExpected,
      );
    });

    describe('batchERC20ConversionPaymentsMultiTokens', async () => {
      it('make 1 payment with 1-step conversion', async () => {
        batchConvFunction = testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens;
        await onePaymentBatchConv([USD_hash, DAI_address]);
      });
      it('make 1 payment with 2-steps conversion', async () => {
        batchConvFunction = testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens;
        await onePaymentBatchConv([EUR_hash, USD_hash, DAI_address]);
      });
      it('make 3 payment with different tokens and conversion length', async () => {
        batchConvFunction = testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens;
        await manyPaymentsBatchConv([EUR_hash, USD_hash, DAI_address], [USD_hash, FAU_address]);
      });
    });

    describe('batchERC20ConversionPaymentsMultiTokens errors', async () => {
      before(async () => {
        batchConvFunction = testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens;
      });
      it('cannot transfer with invalid path', async function () {
        convDetail.path = [EUR_hash, ETH_hash, DAI_address];
        await expect(batchConvFunction([convDetail], feeAddress)).to.be.revertedWith(
          'revert No aggregator found',
        );
      });

      it('cannot transfer if max to spend too low', async function () {
        convDetail.maxToSpend = conversionToPay.add(conversionFees).sub(1).toString();
        await expect(batchConvFunction([convDetail], feeAddress)).to.be.revertedWith(
          'Amount to pay is over the user limit',
        );
      });

      it('cannot transfer if rate is too old', async function () {
        convDetail.maxRateTimespan = 10;
        await expect(batchConvFunction([convDetail], feeAddress)).to.be.revertedWith(
          'aggregator rate is outdated',
        );
      });

      it('Not enough allowance', async function () {
        // reduce signer1 allowance
        await testERC20.approve(
          testBatchConversionProxy.address,
          BigNumber.from(convDetail.maxToSpend).sub(2),
          {
            from,
          },
        );
        await expect(batchConvFunction([convDetail], feeAddress)).to.be.revertedWith(
          'Insufficient allowance for batch to pay',
        );
      });

      it('Not enough funds even if partially enough funds', async function () {
        // signer1 transfer enough token to pay just 1 invoice to signer4
        await testERC20
          .connect(signer1)
          .transfer(await signer4.getAddress(), BigNumber.from(convDetail.maxToSpend));
        // increase signer4 allowance
        await testERC20
          .connect(signer4)
          .approve(testBatchConversionProxy.address, thousandWith18Decimal);

        batchConvFunction =
          testBatchConversionProxy.connect(signer4).batchERC20ConversionPaymentsMultiTokens;

        // 3 invoices to pay
        await expect(
          batchConvFunction([convDetail, convDetail, convDetail], feeAddress),
        ).to.be.revertedWith('not enough funds, including fees');

        // signer4 transfer token to signer1
        await testERC20
          .connect(signer4)
          .transfer(from, await testERC20.balanceOf(await signer4.getAddress()));
        testERC20.connect(adminSigner);
        testBatchConversionProxy = testBatchConversionProxy.connect(signer1);
      });
    });

    describe('batchRouter', async () => {
      it(`1 payment with no conversion`, async function () {
        await batchERC20Payments(true, 'batchERC20PaymentsMultiTokensWithReference');
      });
      it('make 3 payment with different tokens and conversion length', async () => {
        batchConvFunction = testBatchConversionProxy.batchRouter;
        await manyPaymentsBatchConv(
          [EUR_hash, USD_hash, DAI_address],
          [USD_hash, FAU_address],
          true,
        );
      });

      it('make n heterogeneous payments', async () => {
        // set convDetail: done "beforeEach"

        // set cryptoDetails
        const tokenAddress = testERC20.address;
        const cryptoDetails = {
          tokenAddresses: [tokenAddress],
          recipients: [to],
          amounts: [amount],
          paymentReferences: [referenceExample],
          feeAmounts: [feeAmount],
        };

        testBatchConversionProxy.batchRouter(
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
          ],
          feeAddress,
        );

        const [
          conversionFromDiffBalanceExpected,
          conversionToDiffBalanceExpected,
          conversionFeeDiffBalanceExpected,
        ] = expectedERC20Balances([conversionToPay], [conversionFees], batchConvFee);

        const [
          noConversionFromDiffBalanceExpected,
          noConversionToDiffBalanceExpected,
          noConversionFeeDiffBalanceExpected,
        ] = expectedERC20Balances(
          [BigNumber.from(amount)],
          [BigNumber.from(feeAmount)],
          batchFee,
          false,
        );

        fromDiffBalanceExpected = conversionFromDiffBalanceExpected.add(
          noConversionFromDiffBalanceExpected,
        );
        toDiffBalanceExpected = conversionToDiffBalanceExpected.add(
          noConversionToDiffBalanceExpected,
        );
        feeDiffBalanceExpected = conversionFeeDiffBalanceExpected.add(
          noConversionFeeDiffBalanceExpected,
        );
      });
    });

    /** Make sure the existing ERC20 functions from the parent contract BatchPaymentPublic.sol are still working */
    describe('Functions herited from contract BatchErc20Payments ', () => {
      it(`batchERC20PaymentsWithReference 1 payment`, async function () {
        await batchERC20Payments(false, 'batchERC20PaymentsWithReference');
      });

      it(`batchERC20PaymentsMultiTokensWithReference 1 payment`, async function () {
        await batchERC20Payments(false, 'batchERC20PaymentsMultiTokensWithReference');
      });
    });
  });

  for (const useBatchRouter of [true, false]) {
    describe(`Test ETH batch functions ${
      useBatchRouter ? 'through batchRouter' : 'without batchRouter'
    }`, () => {
      before(async () => {
        convDetail = {
          recipient: to,
          requestAmount: amount,
          path: [USD_hash, ETH_hash],
          paymentReference: referenceExample,
          feeAmount: feeAmount,
          maxToSpend: BigNumber.from(0),
          maxRateTimespan: BigNumber.from(0),
        };

        // basic setup: 1 payment
        usdConversionToPay = (
          await chainlinkPath.getConversion(convDetail.requestAmount, convDetail.path)
        ).result;
        usdConversionFee = (
          await chainlinkPath.getConversion(convDetail.feeAmount, convDetail.path)
        ).result;

        if (useBatchRouter) {
          batchConvFunction = testBatchConversionProxy.batchRouter;
        } else {
          batchConvFunction = testBatchConversionProxy.batchEthConversionPaymentsWithReference;
        }
      });

      beforeEach(async () => {
        beforeEthBalanceTo = await provider.getBalance(to);
        beforeEthBalanceFee = await provider.getBalance(feeAddress);
        beforeEthBalance = await provider.getBalance(await signer1.getAddress());

        // expected balances, it can be modified for each test
        amountToPayExpected = usdConversionToPay;
        // fees does not include batch fees yet
        feeToPayExpected = usdConversionFee;
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
          beforeEthBalance = await provider.getBalance(await signer1.getAddress());

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
