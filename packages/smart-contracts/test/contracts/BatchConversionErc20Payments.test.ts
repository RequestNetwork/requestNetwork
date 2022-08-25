import { ethers, network } from 'hardhat';
import {
  ERC20FeeProxy__factory,
  Erc20ConversionProxy__factory,
  EthConversionProxy__factory,
  EthereumFeeProxy__factory,
  ERC20FeeProxy,
  EthereumFeeProxy,
  ChainlinkConversionPath,
  TestERC20,
  Erc20ConversionProxy,
  EthConversionProxy,
  TestERC20__factory,
  BatchConversionPayments,
} from '../../src/types';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction, Signer } from 'ethers';
import { expect } from 'chai';
import { CurrencyManager } from '@requestnetwork/currency';
import { chainlinkConversionPath, batchConversionPaymentsArtifact } from '../../src/lib';
import { localERC20AlphaArtifact, secondLocalERC20AlphaArtifact } from './localArtifacts';
import Utils from '@requestnetwork/utils';

// set to true to log batch payments's gas consumption
const logGas = false;

describe('contract: BatchConversionPayments', () => {
  let from: string;
  let to: string;
  let feeAddress: string;
  let batchAddress: string;
  let signer1: Signer;
  let signer4: Signer;

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

  let testErc20ConversionProxy: Erc20ConversionProxy;
  let testEthConversionProxy: EthConversionProxy;
  let testBatchConversionProxy: BatchConversionPayments;
  let testERC20: TestERC20;
  let testERC20b: TestERC20;
  let erc20FeeProxy: ERC20FeeProxy;
  let ethereumFeeProxy: EthereumFeeProxy;
  let chainlinkPath: ChainlinkConversionPath;

  // variables used to check testERC20 balances
  let fromOldBalance: BigNumber;
  let toOldBalance: BigNumber;
  let feeOldBalance: BigNumber;

  let fromDiffBalanceExpected: BigNumber;
  let toDiffBalanceExpected: BigNumber;
  let feeDiffBalanceExpected: BigNumber;

  // variables needed for chainlink and conversion payments
  let path: string[];
  let conversionToPay: BigNumber;
  let conversionFees: BigNumber;

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

  /**
   * @notice Function batch conversion, it can be the batchRouter function,
   * used with conversion args, or directly batchERC20ConversionPaymentsMultiTokens
   */
  let batchConvFunction: (
    args: any,
    feeAddress: string,
    optional?: any,
  ) => Promise<ContractTransaction>;

  /** Format arguments so they can be used by batchConvFunction */
  let argTemplate: Function;

  /**
   * @notice it gets the conversions including fees to be paid, and it set the convDetail input
   */
  const getConvToPayAndConvDetail = async (
    _recipient: string,
    _path: string[],
    _requestAmount: string,
    _feeAmount: string,
    _maxRateTimespan: number,
    _chainlinkPath: ChainlinkConversionPath,
  ) => {
    const conversionToPayFull = await _chainlinkPath.getConversion(_requestAmount, _path);
    conversionToPay = conversionToPayFull.result;
    const conversionFeeFull = await _chainlinkPath.getConversion(_feeAmount, _path);
    conversionFees = conversionFeeFull.result;
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
    const batchBalance = await _testERC20.balanceOf(batchAddress);

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
   * It sets the right batch conversion function, with the associated arguments format
   * @param useBatchRouter allows to use batchERC20ConversionPaymentsMultiTokens with batchRouter
   * @param _signer
   */
  const setBatchConvFunction = async (useBatchRouter: boolean, _signer: Signer) => {
    if (useBatchRouter) {
      batchConvFunction = testBatchConversionProxy.connect(_signer).batchRouter;
      argTemplate = (convDetails: ConversionDetail[]) => {
        return [
          {
            paymentNetworkId: '0',
            conversionDetails: convDetails,
            cryptoDetails: {
              tokenAddresses: [],
              recipients: [],
              amounts: [],
              paymentReferences: [],
              feeAmounts: [],
            },
          },
        ];
      };
    } else {
      batchConvFunction =
        testBatchConversionProxy.connect(_signer).batchERC20ConversionPaymentsMultiTokens;
      argTemplate = (convDetails: ConversionDetail[]) => {
        return convDetails;
      };
    }
  };

  /**
   * Function used to check the events emitted from the batch conversion proxy.
   * @dev referenceExample and feeAddress are not args because there values never change
   */
  const emitOneTx = (
    result: Chai.Assertion,
    _convDetail: ConversionDetail,
    _conversionToPay = conversionToPay,
    _conversionFees = conversionFees,
    _testErc20ConversionProxy = testErc20ConversionProxy,
  ) => {
    return result.to
      .emit(_testErc20ConversionProxy, 'TransferWithConversionAndReference')
      .withArgs(
        _convDetail.requestAmount,
        ethers.utils.getAddress(_convDetail.path[0]),
        ethers.utils.keccak256(referenceExample),
        _convDetail.feeAmount,
        '0',
      )
      .to.emit(_testErc20ConversionProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        ethers.utils.getAddress(DAI_address),
        ethers.utils.getAddress(_convDetail.recipient),
        _conversionToPay,
        ethers.utils.keccak256(referenceExample),
        _conversionFees,
        feeAddress,
      );
  };

  /**
   * @notice update convDetail, do an ERC20 conversion batch payment with a single payment inside and calculate the balances
   * @param path to update the convDetail
   */
  const onePaymentBatchConv = async (path: string[]) => {
    await getConvToPayAndConvDetail(to, path, amountInFiat, feesAmountInFiat, 0, chainlinkPath);

    const result = batchConvFunction(argTemplate([convDetail]), feeAddress);
    if (logGas) {
      const tx = await result;
      await tx.wait(1);
      const receipt = await tx.wait();
      console.log(`gas consumption: `, receipt.gasUsed.toString());
    } else {
      await emitOneTx(expect(result), convDetail, conversionToPay, conversionFees);
    }

    [fromDiffBalanceExpected, toDiffBalanceExpected, feeDiffBalanceExpected] =
      expectedERC20Balances([conversionToPay], [conversionFees], batchConvFee);
  };

  /**
   * @notice generate nTimes 2 convDetails, do an ERC20 conv batch payment with theses 2*nTimes payments
   *         and calculate the balances
   * @param path2 to update the second convDetail
   */
  const manyPaymentsBatchConv = async (path2: string[], nTimes: number) => {
    // define a second payment request
    const amountInFiat2 = BigNumber.from(amountInFiat).mul(2).toString();
    const feesAmountInFiat2 = BigNumber.from(feesAmountInFiat).mul(2).toString();

    const conversionToPayFull2 = await chainlinkPath.getConversion(amountInFiat2, path2);
    const conversionFeesFull2 = await chainlinkPath.getConversion(feesAmountInFiat2, path2);

    let convDetail2 = Utils.deepCopy(convDetail);

    convDetail2.path = path2;
    convDetail2.requestAmount = amountInFiat2;
    convDetail2.feeAmount = feesAmountInFiat2;
    convDetail2.maxToSpend = conversionToPayFull2.result.add(conversionFeesFull2.result).toString();

    // define the new arg convDetails for the function,
    // and conversionsToPay & conversionsFees results to calculate the expected balances
    let convDetails: ConversionDetail[] = [];
    let conversionsToPay_results: BigNumber[] = [];
    let conversionsFees_results: BigNumber[] = [];
    for (let i = 0; i < nTimes; i++) {
      convDetails = convDetails.concat([convDetail, convDetail2]);
      conversionsToPay_results = conversionsToPay_results.concat([
        conversionToPay,
        conversionToPayFull2.result,
      ]);
      conversionsFees_results = conversionsFees_results.concat([
        conversionFees,
        conversionFeesFull2.result,
      ]);
    }

    // get balances of the 2nd token, useful when there are 2 different tokens used
    const fromOldBalance2 = await testERC20b.balanceOf(from);
    const toOldBalance2 = await testERC20b.balanceOf(to);
    const feeOldBalance2 = await testERC20b.balanceOf(feeAddress);

    const tx = await batchConvFunction(argTemplate(convDetails), feeAddress);
    if (logGas) {
      const receipt = await tx.wait();
      console.log(`${2 * nTimes} req, gas consumption: `, receipt.gasUsed.toString());
    }

    // 1st condition: every tokens (end of the paths) are identicals
    if (
      convDetail.path[convDetail.path.length - 1] === convDetail2.path[convDetail2.path.length - 1]
    ) {
      [fromDiffBalanceExpected, toDiffBalanceExpected, feeDiffBalanceExpected] =
        expectedERC20Balances(conversionsToPay_results, conversionsFees_results, batchConvFee);
    }
    // else: there are 2 different tokens used (end of the paths): testERC20 and testERC20b
    else {
      // calculate the expected balances of the 1st token: testERC20
      [fromDiffBalanceExpected, toDiffBalanceExpected, feeDiffBalanceExpected] =
        expectedERC20Balances(
          conversionsToPay_results.filter((_, i) => i % 2 === 0),
          conversionsFees_results.filter((_, i) => i % 2 === 0),
          batchConvFee,
        );

      // calculate the expected balances of the 2nd token: testERC20b
      const [fromDiffBalanceExpected2, toDiffBalanceExpected2, feeDiffBalanceExpected2] =
        expectedERC20Balances(
          conversionsToPay_results.filter((_, i) => i % 2 === 1),
          conversionsFees_results.filter((_, i) => i % 2 === 1),
          batchConvFee,
        );

      // check the balance of testERC20b token, which is not checked in "afterEach" as testERC20 token.
      checkBalancesForOneToken(
        testERC20b,
        fromOldBalance2,
        toOldBalance2,
        feeOldBalance2,
        fromDiffBalanceExpected2,
        toDiffBalanceExpected2,
        feeDiffBalanceExpected2,
      );
    }
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
    const amount = 200000;
    const feeAmount = 3000;
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
   * @notice it contains all the tests related to the ERC20 batch payment, and its context required
   * @param useBatchRouter allows to use the function "batchERC20ConversionPaymentsMultiTokens"
   *                     through the batchRouter or directly
   */
  for (const useBatchRouter of [true, false]) {
    before(async () => {
      [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
      [signer1, signer4, signer4, signer4] = await ethers.getSigners();
      chainlinkPath = chainlinkConversionPath.connect(network.name, signer1);
      erc20FeeProxy = await new ERC20FeeProxy__factory(signer1).deploy();
      ethereumFeeProxy = await new EthereumFeeProxy__factory(signer1).deploy();
      testErc20ConversionProxy = await new Erc20ConversionProxy__factory(signer1).deploy(
        erc20FeeProxy.address,
        chainlinkPath.address,
        await signer1.getAddress(),
      );
      testEthConversionProxy = await new EthConversionProxy__factory(signer1).deploy(
        ethereumFeeProxy.address,
        chainlinkPath.address,
        ETH_hash,
      );
      testBatchConversionProxy = batchConversionPaymentsArtifact.connect(network.name, signer1);

      // update batch payment proxies, and batch fees
      await testBatchConversionProxy.setPaymentErc20Proxy(erc20FeeProxy.address);
      await testBatchConversionProxy.setPaymentEthProxy(ethereumFeeProxy.address);
      await testBatchConversionProxy.setPaymentErc20ConversionProxy(
        testErc20ConversionProxy.address,
      );
      await testBatchConversionProxy.setPaymentEthConversionProxy(testEthConversionProxy.address);

      await testBatchConversionProxy.setBatchFee(batchFee);
      await testBatchConversionProxy.setBatchConversionFee(batchConvFee);

      // set ERC20 tokens
      DAI_address = localERC20AlphaArtifact.getAddress(network.name);
      testERC20 = new TestERC20__factory(signer1).attach(DAI_address);

      FAU_address = secondLocalERC20AlphaArtifact.getAddress(network.name);
      testERC20b = new TestERC20__factory(signer1).attach(FAU_address);
      batchAddress = testBatchConversionProxy.address;

      setBatchConvFunction(useBatchRouter, signer1);
    });

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
      path = [USD_hash, DAI_address];
      getConvToPayAndConvDetail(to, path, amountInFiat, feesAmountInFiat, 0, chainlinkPath);
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

    after(async () => {
      // restore previous values for consistency
      await testBatchConversionProxy.setBatchFee(30);
      await testBatchConversionProxy.setBatchConversionFee(30);
    });

    describe(useBatchRouter ? 'Through batchRouter' : 'Without batchRouter', () => {
      describe('batchERC20ConversionPaymentsMultiTokens with DAI', async () => {
        it('allows to transfer DAI tokens for USD payment', async () => {
          await onePaymentBatchConv(path);
        });
        it('allows to transfer DAI tokens for EUR payment', async () => {
          path = [EUR_hash, USD_hash, DAI_address];
          await onePaymentBatchConv(path);
        });
        it('allows to transfer 2 transactions DAI tokens for USD payment', async function () {
          await manyPaymentsBatchConv(path, 1);
        });
        it('allows to transfer DAI tokens for EUR payment', async () => {
          path = [EUR_hash, USD_hash, DAI_address];
          await onePaymentBatchConv(path);
        });
        it('allows to transfer 2 transactions DAI tokens for USD and EUR payments', async function () {
          const path2 = [EUR_hash, USD_hash, DAI_address];
          await manyPaymentsBatchConv(path2, 1);
        });
        it('allows to transfer two kinds of tokens for USD', async function () {
          const path2 = [USD_hash, FAU_address];
          await manyPaymentsBatchConv(path2, 1);
        });
      });
    });

    describe('batchERC20ConversionPaymentsMultiTokens with errors', () => {
      it('cannot transfer with invalid path', async function () {
        const wrongPath = [EUR_hash, ETH_hash, DAI_address];
        convDetail.path = wrongPath;
        await expect(batchConvFunction(argTemplate([convDetail]), feeAddress)).to.be.revertedWith(
          'revert No aggregator found',
        );
      });

      it('cannot transfer if max to spend too low', async function () {
        convDetail.maxToSpend = conversionToPay.add(conversionFees).sub(1).toString();
        await expect(batchConvFunction(argTemplate([convDetail]), feeAddress)).to.be.revertedWith(
          'Amount to pay is over the user limit',
        );
      });

      it('cannot transfer if rate is too old', async function () {
        convDetail.maxRateTimespan = 10;

        await expect(batchConvFunction(argTemplate([convDetail]), feeAddress)).to.be.revertedWith(
          'aggregator rate is outdated',
        );
      });

      it('Not enough allowance', async function () {
        // signer4 connect to the batch function
        setBatchConvFunction(useBatchRouter, signer4);
        await expect(batchConvFunction(argTemplate([convDetail]), feeAddress)).to.be.revertedWith(
          'Insufficient allowance for batch to pay',
        );
        // reset: signer1 connect to the batch function
        setBatchConvFunction(useBatchRouter, signer1);
      });

      it('Not enough funds', async function () {
        // increase signer4 allowance
        await testERC20
          .connect(signer4)
          .approve(testBatchConversionProxy.address, thousandWith18Decimal);
        // signer4 connect to the batch function
        setBatchConvFunction(useBatchRouter, signer4);

        await expect(batchConvFunction(argTemplate([convDetail]), feeAddress)).to.be.revertedWith(
          'not enough funds, including fees',
        );

        // reset: decrease signer4 allowance and reconnect with signer1
        await testERC20.connect(signer4).approve(testBatchConversionProxy.address, '0');
        testERC20.connect(signer1);
        // reset: signer1 connect to the batch function
        setBatchConvFunction(useBatchRouter, signer1);
      });
    });

    /** Make sure the existing ERC20 functions from the parent contract BatchPaymentPublic.sol are still working */
    describe('Test BatchErc20Payments functions', () => {
      it(`${
        useBatchRouter ? 'with batchRouter, ' : ''
      }batchERC20PaymentsWithReference transfers token`, async function () {
        await batchERC20Payments(useBatchRouter, 'batchERC20PaymentsWithReference');
      });

      it(`${
        useBatchRouter ? 'with batchRouter, ' : ''
      }batchERC20PaymentsMultiTokensWithReference transfers token`, async function () {
        await batchERC20Payments(useBatchRouter, 'batchERC20PaymentsMultiTokensWithReference');
      });
    });
  }
});
