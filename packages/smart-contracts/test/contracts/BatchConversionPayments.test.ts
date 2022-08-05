import { ethers, network } from 'hardhat';
import {
  ERC20FeeProxy__factory,
  Erc20ConversionProxy__factory,
  EthConversionProxy__factory,
  BatchConversionPayments__factory,
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
import { chainlinkConversionPath } from '../../src/lib';
import { localERC20AlphaArtifact, secondLocalERC20AlphaArtifact } from './localArtifacts';
import Utils from '@requestnetwork/utils';
import { HttpNetworkConfig } from 'hardhat/types';

// set to true to log batch payments's gas consumption
const logGas = false;

describe('contract: BatchErc20ConversionPayments', () => {
  const networkConfig = network.config as HttpNetworkConfig;
  const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);

  let from: string;
  let to: string;
  let feeAddress: string;
  let batchAddress: string;
  let signer: Signer;
  let xSigner: Signer;
  const batchFee = 100;
  const batchConvFee = 100;
  const amountInFiat = '100000000'; // 1 with 8 decimal
  const feesAmountInFiat = '100000'; // 0.001 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  const referenceExample = '0xaaaa';

  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
  let DAI_address: string;
  let fakeFAU_address: string;

  let testErc20ConversionProxy: Erc20ConversionProxy;
  let testEthConversionProxy: EthConversionProxy;
  let testBatchConversionProxy: BatchConversionPayments;
  let testERC20: TestERC20;
  let testERC20b: TestERC20;
  let erc20FeeProxy: ERC20FeeProxy;
  let ethereumFeeProxy: EthereumFeeProxy;
  let chainlinkPath: ChainlinkConversionPath;

  let path: string[];
  type ConvToPay = [BigNumber, BigNumber] & {
    result: BigNumber;
    oldestRateTimestamp: BigNumber;
  };
  let conversionToPay: ConvToPay;
  let conversionFees: ConvToPay;

  let fromOldBalance: BigNumber;
  let toOldBalance: BigNumber;
  let feeOldBalance: BigNumber;
  let batchOldBalance: BigNumber;

  let fromBalance: BigNumber;
  let toBalance: BigNumber;
  let feeBalance: BigNumber;
  let batchBalance: BigNumber;

  let fromDiffBalanceExpected: BigNumber;
  let toDiffBalanceExpected: BigNumber;
  let feeDiffBalanceExpected: BigNumber;

  type RequestInfo = {
    recipient: string;
    requestAmount: BigNumberish;
    path: string[];
    paymentReference: BytesLike;
    feeAmount: BigNumberish;
    maxToSpend: BigNumberish;
    maxRateTimespan: BigNumberish;
  };
  let requestInfo: RequestInfo;

  let requestsInfoParent1 = {
    tokenAddresses: [],
    recipients: [],
    amounts: [],
    paymentReferences: [],
    feeAmounts: [],
  };
  /** Function used to emit events of batch conversion proxy */
  let emitOneTx: Function;
  /**
   * @notice Function batch conversion, it can be the batchRouter function, used with conversion args,
   *  or directly batchERC20ConversionPaymentsMultiTokens
   * */
  let batchConvFunction: (
    args: any,
    feeAddress: string,
    optional?: any,
  ) => Promise<ContractTransaction>;
  /** Format arguments so they can be used by batchConvFunction */
  let argTemplate: Function;

  before(async () => {
    [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [signer, xSigner, xSigner, xSigner] = await ethers.getSigners();
    chainlinkPath = chainlinkConversionPath.connect(network.name, signer);
    erc20FeeProxy = await new ERC20FeeProxy__factory(signer).deploy();
    ethereumFeeProxy = await new EthereumFeeProxy__factory(signer).deploy();
    testErc20ConversionProxy = await new Erc20ConversionProxy__factory(signer).deploy(
      erc20FeeProxy.address,
      chainlinkPath.address,
      await signer.getAddress(),
    );
    testEthConversionProxy = await new EthConversionProxy__factory(signer).deploy(
      ethereumFeeProxy.address,
      chainlinkPath.address,
      ETH_hash,
    );
    testBatchConversionProxy = await new BatchConversionPayments__factory(signer).deploy(
      erc20FeeProxy.address,
      ethereumFeeProxy.address,
      testErc20ConversionProxy.address,
      testEthConversionProxy.address,
      chainlinkPath.address,
      await signer.getAddress(),
    );

    await testBatchConversionProxy.setBatchFee(batchFee);
    await testBatchConversionProxy.setBatchConversionFee(batchConvFee);

    DAI_address = localERC20AlphaArtifact.getAddress(network.name);
    testERC20 = new TestERC20__factory(signer).attach(DAI_address);

    // caution, change add one transaction in deployment will modify this address !
    // fakeFAU_address = '0x51FC52Fd0B30fA0319D97893dEFE0201fEd39C4c';
    fakeFAU_address = secondLocalERC20AlphaArtifact.getAddress(network.name);
    testERC20b = new TestERC20__factory(signer).attach(fakeFAU_address);
    batchAddress = testBatchConversionProxy.address;
  });

  const batchFeeToPay = (conversionAmountToPay: BigNumber) => {
    return conversionAmountToPay.mul(batchConvFee).div(10000);
  };

  /**
   * @notice it gets the conversions including fees to be paid, and it set the requestInfo
   */
  const initConvToPayAndRequestInfo = async (
    _recipient: string,
    _path: string[],
    _requestAmount: string,
    _feeAmount: string,
    _maxRateTimespan: number,
    _chainlinkPath: ChainlinkConversionPath,
  ) => {
    conversionToPay = await _chainlinkPath.getConversion(_requestAmount, _path);
    conversionFees = await _chainlinkPath.getConversion(_feeAmount, _path);
    requestInfo = {
      recipient: _recipient,
      requestAmount: _requestAmount,
      path: _path,
      paymentReference: referenceExample,
      feeAmount: _feeAmount,
      maxToSpend: conversionToPay.result.add(conversionFees.result).toString(),
      maxRateTimespan: _maxRateTimespan,
    };
  };

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
    fromOldBalance = await testERC20.balanceOf(from);
    toOldBalance = await testERC20.balanceOf(to);
    feeOldBalance = await testERC20.balanceOf(feeAddress);
    batchOldBalance = await testERC20.balanceOf(batchAddress);
  });

  afterEach(async () => {
    fromBalance = await testERC20.balanceOf(from);
    toBalance = await testERC20.balanceOf(to);
    feeBalance = await testERC20.balanceOf(feeAddress);
    batchBalance = await testERC20.balanceOf(batchAddress);
    const fromDiffBalance = BigNumber.from(fromBalance.toString())
      .sub(fromOldBalance.toString())
      .toString();
    const toDiffBalance = BigNumber.from(toBalance.toString())
      .sub(toOldBalance.toString())
      .toString();
    const feeDiffBalance = BigNumber.from(feeBalance.toString())
      .sub(feeOldBalance.toString())
      .toString();
    const batchDiffBalance = BigNumber.from(batchBalance.toString())
      .sub(batchOldBalance.toString())
      .toString();

    // Check balance changes
    expect(fromDiffBalance).to.equals(
      (fromDiffBalanceExpected.toString() !== '0' ? '-' : '') + fromDiffBalanceExpected.toString(),
      'fromDiffBalance',
    );
    expect(toDiffBalance).to.equals(toDiffBalanceExpected.toString(), 'toDiffBalance');
    expect(feeDiffBalance).to.equals(feeDiffBalanceExpected.toString(), 'feeDiffBalance');
    expect(batchDiffBalance).to.equals('0', 'batchDiffBalance');
  });

  /**
   * @notice Used to calcul the expected new ERC20 balance for batch conversion.
   * It can also be used for batch IF batchFee == batchConvFee
   * @param _conversionsToPay_results is used to calcul batch fees, in case of multiple payments
   */
  const calculERC20Balances = (
    _conversionToPay_result: BigNumber,
    _conversionFees_result: BigNumber,
    _conversionsToPay_results: BigNumber[],
    _conversionFees_results: BigNumber[],
  ) => {
    fromDiffBalanceExpected = fromDiffBalanceExpected
      .add(_conversionToPay_result)
      .add(_conversionFees_result);

    toDiffBalanceExpected = toDiffBalanceExpected.add(_conversionToPay_result);
    feeDiffBalanceExpected = feeDiffBalanceExpected.add(_conversionFees_result);
    if (_conversionsToPay_results.length > 0)
      calculERC20BatchFeeBalances(_conversionsToPay_results, _conversionFees_results);
  };

  /**
   * @notice Used to calcul the expected new ERC20 fee batch balance for batch conversion.
   * @param _conversionsToPay_results is used to calcul batch fees, it case of payments multiple
   * @dev in case of payments multiple, we sum the amount paid including fees, and then, we calcul the batch fees amount
   *      because the sum(batchFeeToPay(amountPay[i])) != batchFeeToPay(sum(amountPay[i]))
   */
  const calculERC20BatchFeeBalances = (
    _conversionsToPay_results: BigNumber[],
    _conversionFees_result: BigNumber[],
  ) => {
    let sumToPay = BigNumber.from(0);
    for (let i = 0; i < _conversionsToPay_results.length; i++) {
      sumToPay = sumToPay.add(_conversionsToPay_results[i]).add(_conversionFees_result[i]);
    }
    fromDiffBalanceExpected = fromDiffBalanceExpected.add(batchFeeToPay(sumToPay));
    feeDiffBalanceExpected = feeDiffBalanceExpected.add(batchFeeToPay(sumToPay));
  };

  /**
   * @notice update requestInfo, do an ERC20 conv batch payment and calcul the balances
   * @param path to update the resquestInfo
   */
  const transferOneTokenConv = async (path: string[]) => {
    await initConvToPayAndRequestInfo(to, path, amountInFiat, feesAmountInFiat, 0, chainlinkPath);

    const result = batchConvFunction(argTemplate([requestInfo]), feeAddress);
    if (logGas) {
      const tx = await result;
      await tx.wait(1);
      const receipt = await tx.wait();
      console.log(`gas consumption: `, receipt.gasUsed.toString());
    } else {
      await emitOneTx(expect(result), requestInfo, conversionToPay, conversionFees);
    }

    calculERC20Balances(
      conversionToPay.result,
      conversionFees.result,
      [conversionToPay.result],
      [conversionFees.result],
    );
  };

  /**
   * @notice generate nTimes 2 requestInfos, do an ERC20 conv batch payment with theses 2*nTimes requests
   *         and calcul the balances
   * @param path2 to update the second resquestInfo
   */
  const transferTokensConv = async (path2: string[], nTimes: number) => {
    const coef = 2;
    const amountInFiat2 = BigNumber.from(amountInFiat).mul(coef).toString();
    const feesAmountInFiat2 = BigNumber.from(feesAmountInFiat).mul(coef).toString();

    const conversionToPay2 = await chainlinkPath.getConversion(amountInFiat2, path2);
    const conversionFees2 = await chainlinkPath.getConversion(feesAmountInFiat2, path2);

    let requestInfo2 = Utils.deepCopy(requestInfo);

    requestInfo2.path = path2;
    requestInfo2.requestAmount = amountInFiat2;
    requestInfo2.feeAmount = feesAmountInFiat2;
    requestInfo2.maxToSpend = conversionToPay2.result.add(conversionFees2.result).toString();

    let requestInfos: RequestInfo[] = [];
    let conversionsToPay: ConvToPay[] = [];
    let conversionsFees: ConvToPay[] = [];
    for (let i = 0; i < nTimes; i++) {
      requestInfos = requestInfos.concat([requestInfo, requestInfo2]);
      conversionsToPay = conversionsToPay.concat([conversionToPay, conversionToPay2]);
      conversionsFees = conversionsFees.concat([conversionFees, conversionFees2]);
    }
    const result = batchConvFunction(argTemplate(requestInfos), feeAddress);
    const tx = await result;
    await tx.wait(1);
    if (logGas) {
      const receipt = await tx.wait();
      console.log(`${2 * nTimes} req, gas consumption: `, receipt.gasUsed.toString());
    }

    if (
      requestInfo.path[requestInfo.path.length - 1] ===
      requestInfo2.path[requestInfo2.path.length - 1]
    ) {
      for (let i = 0; i < nTimes - 1; i++) {
        calculERC20Balances(conversionToPay.result, conversionFees.result, [], []);
        calculERC20Balances(conversionToPay2.result, conversionFees2.result, [], []);
      }
      calculERC20Balances(conversionToPay.result, conversionFees.result, [], []);
      calculERC20Balances(
        conversionToPay2.result,
        conversionFees2.result,
        conversionsToPay.map((ctp) => ctp.result),
        conversionsFees.map((ctp) => ctp.result),
      );
    } else {
      for (let i = 0; i < nTimes - 1; i++) {
        calculERC20Balances(conversionToPay.result, conversionFees.result, [], []);
      }
      const conversionsToPayBis = conversionsToPay.filter((_, i) => i % 2 === 0);

      calculERC20Balances(
        conversionToPay.result,
        conversionFees.result,
        conversionsToPayBis.map((ctp) => ctp.result),
        conversionsFees.map((ctp) => ctp.result),
      );
    }
  };

  /**
   * @notice it contains all the tests related to the ERC20 batch payment, and its context required
   * @param erc20Function is the batch function name tested: "batchRouter" or "batchERC20ConversionPaymentsMultiTokens"
   */
  const ERC20TestSuite = (erc20Function: string) => {
    emitOneTx = (
      result: Chai.Assertion,
      requestInfo: RequestInfo,
      _conversionToPay = conversionToPay,
      _conversionFees = conversionFees,
      _testErc20ConversionProxy = testErc20ConversionProxy,
    ) => {
      return result.to
        .emit(testErc20ConversionProxy, 'TransferWithConversionAndReference')
        .withArgs(
          requestInfo.requestAmount,
          ethers.utils.getAddress(requestInfo.path[0]),
          ethers.utils.keccak256(referenceExample),
          requestInfo.feeAmount,
          '0',
        )
        .to.emit(testErc20ConversionProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          ethers.utils.getAddress(DAI_address),
          ethers.utils.getAddress(requestInfo.recipient),
          _conversionToPay.result,
          ethers.utils.keccak256(referenceExample),
          _conversionFees.result,
          feeAddress,
        );
    };

    beforeEach(async () => {
      path = [USD_hash, DAI_address];
      initConvToPayAndRequestInfo(to, path, amountInFiat, feesAmountInFiat, 0, chainlinkPath);
    });

    const setBatchConvFunction = async (_signer: Signer) => {
      if (erc20Function === 'batchRouter') {
        batchConvFunction = testBatchConversionProxy.connect(_signer).batchRouter;
        argTemplate = (requestInfos: RequestInfo[]) => {
          return [
            {
              paymentNetworkId: '0',
              requestsInfo: requestInfos,
              requestsInfoParent: requestsInfoParent1,
            },
          ];
        };
      }
      if (erc20Function === 'batchERC20ConversionPaymentsMultiTokens') {
        batchConvFunction =
          testBatchConversionProxy.connect(_signer).batchERC20ConversionPaymentsMultiTokens;
        argTemplate = (requestInfos: RequestInfo[]) => {
          return requestInfos;
        };
      }
    };
    before(() => {
      setBatchConvFunction(signer);
    });
    describe(erc20Function, () => {
      describe('batchERC20ConversionPaymentsMultiTokens with DAI', async () => {
        it('allows to transfer DAI tokens for USD payment', async () => {
          await transferOneTokenConv(path);
        });
        it('allows to transfer DAI tokens for EUR payment', async () => {
          path = [EUR_hash, USD_hash, DAI_address];
          await transferOneTokenConv(path);
        });
        it('allows to transfer 2 transactions DAI tokens for USD payment', async function () {
          await transferTokensConv(path, 1);
        });
        it('allows to transfer DAI tokens for EUR payment', async () => {
          path = [EUR_hash, USD_hash, DAI_address];
          await transferOneTokenConv(path);
        });
        it('allows to transfer 2 transactions DAI tokens for USD and EUR payments', async function () {
          const path2 = [EUR_hash, USD_hash, DAI_address];
          await transferTokensConv(path2, 1);
        });
        it('allows to transfer two kinds of tokens for USD', async function () {
          const path2 = [USD_hash, fakeFAU_address];
          await transferTokensConv(path2, 1);
        });
      });
    });

    describe('batchERC20ConversionPaymentsMultiTokens with errors', () => {
      it('cannot transfer with invalid path', async function () {
        const wrongPath = [EUR_hash, ETH_hash, DAI_address];
        requestInfo.path = wrongPath;
        await expect(batchConvFunction(argTemplate([requestInfo]), feeAddress)).to.be.revertedWith(
          'revert No aggregator found',
        );
      });

      it('cannot transfer if max to spend too low', async function () {
        requestInfo.maxToSpend = conversionToPay.result
          .add(conversionFees.result)
          .sub(1)
          .toString();
        await expect(batchConvFunction(argTemplate([requestInfo]), feeAddress)).to.be.revertedWith(
          'Amount to pay is over the user limit',
        );
      });

      it('cannot transfer if rate is too old', async function () {
        requestInfo.maxRateTimespan = 10;

        await expect(batchConvFunction(argTemplate([requestInfo]), feeAddress)).to.be.revertedWith(
          'aggregator rate is outdated',
        );
      });

      it('Not enough allowance', async function () {
        // xSigner connect to the batch function
        setBatchConvFunction(xSigner);
        await expect(batchConvFunction(argTemplate([requestInfo]), feeAddress)).to.be.revertedWith(
          'Insufficient allowance for batch to pay',
        );
        // reset: signer connect to the batch function
        setBatchConvFunction(signer);
      });

      it('Not enough funds', async function () {
        // increase xSigner allowance
        await testERC20
          .connect(xSigner)
          .approve(testBatchConversionProxy.address, thousandWith18Decimal);
        // xSigner connect to the batch function
        setBatchConvFunction(xSigner);

        await expect(batchConvFunction(argTemplate([requestInfo]), feeAddress)).to.be.revertedWith(
          'not enough funds, including fees',
        );

        // reset:
        //   - decrease xSigner allowance
        //   - connect with signer account
        await testERC20.connect(xSigner).approve(testBatchConversionProxy.address, '0');
        testERC20.connect(signer);
        setBatchConvFunction(signer);
      });
    });
  };

  /** Make sure the existing ERC20 functions from the parent contract BatchPaymentPublic.sol are still working */
  describe('Test BatchErc20Payments functions', () => {
    const batchERC20Payments = async (isBatchRouter: boolean, subFunction: string) => {
      const amount = 200;
      const feeAmount = 20;
      let batchFunction: Function;
      const tokenAddress = testERC20.address;
      let result;
      if (isBatchRouter) {
        batchFunction = testBatchConversionProxy.batchRouter;
        result = batchFunction(
          [
            {
              paymentNetworkId: subFunction === 'batchERC20PaymentsWithReference' ? 1 : 2,
              requestsInfo: [],
              requestsInfoParent: {
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
          subFunction === 'batchERC20PaymentsWithReference'
            ? testBatchConversionProxy.batchERC20PaymentsWithReference
            : testBatchConversionProxy.batchERC20PaymentsMultiTokensWithReference;
        result = batchFunction(
          subFunction === 'batchERC20PaymentsWithReference' ? tokenAddress : [tokenAddress],
          [to],
          [amount],
          [referenceExample],
          [feeAmount],
          feeAddress,
        );
      }
      await expect(result)
        .to.emit(testERC20, 'Transfer')
        .withArgs(from, batchAddress, amount + feeAmount)
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          testERC20.address,
          to,
          amount,
          ethers.utils.keccak256(referenceExample),
          feeAmount,
          feeAddress,
        )
        // batch fee amount from the spender to feeAddress
        .to.emit(testERC20, 'Transfer')
        .withArgs(
          from,
          feeAddress,
          amount * (batchFee / 10_000), // batch fee amount = 200 * 1%
        );

      calculERC20Balances(
        BigNumber.from(amount),
        BigNumber.from(feeAmount),
        [BigNumber.from(amount)],
        [BigNumber.from(feeAmount)],
      );
    };
    it('batchERC20PaymentsWithReference transfers token', async function () {
      await batchERC20Payments(false, 'batchERC20PaymentsWithReference');
    });
    it('with batchRouter, batchERC20PaymentsWithReference transfers token', async function () {
      await batchERC20Payments(true, 'batchERC20PaymentsWithReference');
    });

    it('batchERC20PaymentsMultiTokensWithReference transfers token', async function () {
      await batchERC20Payments(false, 'batchERC20PaymentsMultiTokensWithReference');
    });
    it('with batchRouter, batchERC20PaymentsMultiTokensWithReference transfers token', async function () {
      await batchERC20Payments(true, 'batchERC20PaymentsMultiTokensWithReference');
    });
  });

  /**
   * @notice it contains all the tests related to the Eth batch payment, and its context required
   * @param ethFunction is the batch function name tested: "batchRouter" or "batchEthConversionPaymentsWithReference"
   */
  const EthTestSuite = (ethFunction: string) => {
    describe(`Test ETH ${ethFunction} functions`, () => {
      let beforeEthBalanceTo: BigNumber;
      let beforeEthBalanceFee: BigNumber;
      let beforeEthBalance: BigNumber;
      let feesToPay: ConvToPay;
      let tx: ContractTransaction;
      let amountToPayExpected: BigNumber;
      let feeToPayExpected: BigNumber;
      const amount = BigNumber.from(100000); // usually in USD
      const feeAmount = amount.mul(10).div(10000); // usually in USD
      let inputs: Array<RequestInfo>;
      const pathUsdEth = [USD_hash, ETH_hash];

      /**
       * @notice it modify the Eth batch inputs if needed, depending of the function used: ethFunction
       * @param inputs a list of requestInfo
       */
      const getInputs = (inputs: Array<RequestInfo>) => {
        if (ethFunction !== 'batchEthConversionPaymentsWithReference') {
          return [
            {
              paymentNetworkId: '3',
              requestsInfo: inputs,
              requestsInfoParent: requestsInfoParent1, // not used
            },
          ];
        }
        return inputs;
      };

      before(() => {
        if (ethFunction === 'batchEthConversionPaymentsWithReference') {
          batchConvFunction = testBatchConversionProxy.batchEthConversionPaymentsWithReference;
        } else {
          batchConvFunction = testBatchConversionProxy.batchRouter;
        }

        requestInfo = {
          recipient: to,
          requestAmount: amount,
          path: pathUsdEth,
          paymentReference: referenceExample,
          feeAmount: feeAmount,
          maxToSpend: BigNumber.from(0),
          maxRateTimespan: BigNumber.from(0),
        };
      });

      describe('success functions', () => {
        beforeEach(async () => {
          beforeEthBalanceTo = await provider.getBalance(to);
          beforeEthBalanceFee = await provider.getBalance(feeAddress);
          beforeEthBalance = await provider.getBalance(await signer.getAddress());
          requestInfo = {
            recipient: to,
            requestAmount: amount,
            path: pathUsdEth,
            paymentReference: referenceExample,
            feeAmount: feeAmount,
            maxToSpend: BigNumber.from(0),
            maxRateTimespan: BigNumber.from(0),
          };

          // basic setup: 1 payment
          conversionToPay = await chainlinkPath.getConversion(
            requestInfo.requestAmount,
            requestInfo.path,
          );
          feesToPay = await chainlinkPath.getConversion(requestInfo.feeAmount, requestInfo.path);

          amountToPayExpected = conversionToPay.result;
          // fees does not include batch conv fees yet
          feeToPayExpected = feesToPay.result;
        });

        afterEach(async () => {
          tx = await batchConvFunction(getInputs(inputs), feeAddress, {
            value: BigNumber.from('100000000000000000'),
          });
          const receipt = await tx.wait();
          if (logGas) console.log('gas consumption: ', receipt.gasUsed.toString());

          const afterEthBalance = await provider.getBalance(await signer.getAddress());
          const afterEthBalanceTo = await provider.getBalance(to);
          const afterEthBalanceFee = await provider.getBalance(feeAddress);
          const proxyBalance = await provider.getBalance(testBatchConversionProxy.address);
          const _diffBalance = beforeEthBalance.sub(afterEthBalance);
          const _diffBalanceTo = afterEthBalanceTo.sub(beforeEthBalanceTo);
          const _diffBalanceFee = afterEthBalanceFee.sub(beforeEthBalanceFee);
          const _diffBalanceExpect = receipt.gasUsed
            .mul(2 * 10 ** 10)
            .add(_diffBalanceTo)
            .add(_diffBalanceFee);
          expect(_diffBalance).to.equals(_diffBalanceExpect.toString(), 'DiffBalance');
          expect(_diffBalanceTo).to.equals(amountToPayExpected.toString(), 'diffBalanceTo');

          // feeToPayExpected includes batch conversion fees now
          feeToPayExpected = amountToPayExpected
            .add(feeToPayExpected)
            .mul(batchConvFee)
            .div(10000)
            .add(feeToPayExpected);
          expect(_diffBalanceFee.toString()).to.equals(
            feeToPayExpected.toString(),
            'diffBalanceFee',
          );
          expect(proxyBalance).to.equals('0', 'proxyBalance');
        });

        it('batchEthConversionPaymentsWithReference transfer 1 payment in ethers denominated in USD', async function () {
          inputs = [requestInfo];
        });

        it('batchEthConversionPaymentsWithReference transfer 3 payment in ethers denominated in USD', async function () {
          amountToPayExpected = amountToPayExpected.mul(3);
          feeToPayExpected = feeToPayExpected.mul(3);
          inputs = [requestInfo, requestInfo, requestInfo];
        });

        it('batchEthConversionPaymentsWithReference transfer 3 payments in ethers denominated in USD and EUR', async function () {
          const EurRequestInfo = Utils.deepCopy(requestInfo);
          EurRequestInfo.path = [EUR_hash, USD_hash, ETH_hash];

          const eurConversionToPay = await chainlinkPath.getConversion(
            EurRequestInfo.requestAmount,
            EurRequestInfo.path,
          );
          const eurFeesToPay = await chainlinkPath.getConversion(
            EurRequestInfo.feeAmount,
            EurRequestInfo.path,
          );

          amountToPayExpected = eurConversionToPay.result.add(amountToPayExpected.mul(2));
          feeToPayExpected = eurFeesToPay.result.add(feeToPayExpected.mul(2));
          inputs = [requestInfo, EurRequestInfo, requestInfo];
        });
      });
      it('batchEthConversionPaymentsWithReference transfer FAIL: not enough funds', async function () {
        await expect(
          batchConvFunction(getInputs([requestInfo]), feeAddress, {
            value: 10000,
          }),
        ).to.be.revertedWith('paymentProxy transferExactEthWithReferenceAndFee failed');
      });
    });
  };

  // ERC20TestSuite('batchRouter');
  ERC20TestSuite('batchERC20ConversionPaymentsMultiTokens');
  EthTestSuite('batchRouter');
  EthTestSuite('batchEthConversionPaymentsWithReference');
});
