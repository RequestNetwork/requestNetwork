import { ethers, network } from 'hardhat';
import {
  ERC20FeeProxy__factory,
  Erc20ConversionProxy__factory,
  BatchConversionPayments__factory,
  EthereumFeeProxy__factory,
  ERC20FeeProxy,
  EthereumFeeProxy,
  ChainlinkConversionPath,
  TestERC20,
  Erc20ConversionProxy,
  TestERC20__factory,
  BatchConversionPayments,
} from '../../src/types';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction, Signer } from 'ethers';
import { expect } from 'chai';
import { CurrencyManager } from '@requestnetwork/currency';
import { chainlinkConversionPath } from '../../src/lib';
import { localERC20AlphaArtifact } from './localArtifacts';
import Utils from '@requestnetwork/utils';

describe('contract: BatchErc20ConversionPayments', () => {
  let from: string;
  let to: string;
  let feeAddress: string;
  let batchAddress: string;
  let signer: Signer;
  const basicFee = 10;
  const batchFee = 30;
  const batchConvFee = 100;
  const amountInFiat = '100000000'; // 1 with 8 decimal
  const feesAmountInFiat = '100000'; // 0.001 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  // const hundredWith18Decimal =  '100000000000000000000';
  const referenceExample = '0xaaaa';

  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
  let DAI_address: string;
  let USDT_address: string;
  let fakeFAU_address: string;

  let testErc20ConversionProxy: Erc20ConversionProxy;
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
    _recipient: string;
    _requestAmount: BigNumberish;
    _path: string[];
    _paymentReference: BytesLike;
    _feeAmount: BigNumberish;
    _maxToSpend: BigNumberish;
    _maxRateTimespan: BigNumberish;
  };
  let requestInfo: RequestInfo;

  // type
  let requestsInfoParent1 = {
    _tokenAddresses: [],
    _recipients: [],
    _amounts: [],
    _paymentReferences: [],
    _feeAmounts: [],
  };
  let emitOneTx: Function;

  let batchConvFunction: (args: any, feeAddress: string) => Promise<ContractTransaction>;
  let argTemplate: Function;

  before(async () => {
    [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();

    chainlinkPath = chainlinkConversionPath.connect(network.name, signer);
    erc20FeeProxy = await new ERC20FeeProxy__factory(signer).deploy();
    ethereumFeeProxy = await new EthereumFeeProxy__factory(signer).deploy();
    testErc20ConversionProxy = await new Erc20ConversionProxy__factory(signer).deploy(
      erc20FeeProxy.address,
      chainlinkPath.address,
      await signer.getAddress(),
    );
    testBatchConversionProxy = await new BatchConversionPayments__factory(signer).deploy(
      erc20FeeProxy.address,
      ethereumFeeProxy.address,
      testErc20ConversionProxy.address,
      chainlinkPath.address,
      await signer.getAddress(),
    );

    await testBatchConversionProxy.setBasicFee(basicFee);
    await testBatchConversionProxy.setBatchFee(batchFee);
    await testBatchConversionProxy.setBatchConversionFee(batchConvFee);

    DAI_address = localERC20AlphaArtifact.getAddress(network.name);
    testERC20 = new TestERC20__factory(signer).attach(DAI_address);

    fakeFAU_address = '0x7153CCD1a20Bbb2f6dc89c1024de368326EC6b4F';
    testERC20b = new TestERC20__factory(signer).attach(fakeFAU_address);
    USDT_address = '0xF328c11c4dF88d18FcBd30ad38d8B4714F4b33bF'; // '0xF328c11c4dF88d18FcBd30ad38d8B4714F4b33bF';
    batchAddress = testBatchConversionProxy.address;
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
          requestInfo._requestAmount,
          ethers.utils.getAddress(requestInfo._path[0]),
          ethers.utils.keccak256(referenceExample),
          requestInfo._feeAmount,
          '0',
        )
        .to.emit(testErc20ConversionProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          ethers.utils.getAddress(DAI_address),
          ethers.utils.getAddress(requestInfo._recipient),
          _conversionToPay.result,
          ethers.utils.keccak256(referenceExample),
          _conversionFees.result,
          feeAddress,
        );
    };
  });

  const batchFeeToPay = (conversionAmountToPay: BigNumber) => {
    return conversionAmountToPay.mul(batchConvFee).div(10000);
  };

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
      _recipient: _recipient,
      _requestAmount: _requestAmount,
      _path: _path,
      _paymentReference: referenceExample,
      _feeAmount: _feeAmount,
      _maxToSpend: conversionToPay.result.add(conversionFees.result).toString(),
      _maxRateTimespan: _maxRateTimespan,
    };
  };
  beforeEach(async () => {
    fromDiffBalanceExpected = BigNumber.from(0);
    toDiffBalanceExpected = BigNumber.from(0);
    feeDiffBalanceExpected = BigNumber.from(0);
    path = [USD_hash, DAI_address];
    initConvToPayAndRequestInfo(to, path, amountInFiat, feesAmountInFiat, 0, chainlinkPath);
    await testERC20.approve(testBatchConversionProxy.address, thousandWith18Decimal, {
      from,
    });
    await testERC20b.approve(testBatchConversionProxy.address, thousandWith18Decimal, {
      from,
    });
    fromOldBalance = await testERC20.connect(signer).balanceOf(from);
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

  const calculBalances = (
    _conversionToPay: ConvToPay,
    _conversionFees: ConvToPay,
    _conversionsToPay: ConvToPay[],
  ) => {
    fromDiffBalanceExpected = fromDiffBalanceExpected
      .add(_conversionToPay.result)
      .add(_conversionFees.result);

    toDiffBalanceExpected = toDiffBalanceExpected.add(_conversionToPay.result);
    feeDiffBalanceExpected = feeDiffBalanceExpected.add(_conversionFees.result);
    if (_conversionsToPay.length > 0) calculBatchFeeBalances(_conversionsToPay);
  };

  const calculBatchFeeBalances = (_conversionsToPay: ConvToPay[]) => {
    let sumToPay = BigNumber.from(0);
    for (let i = 0; i < _conversionsToPay.length; i++) {
      sumToPay = sumToPay.add(_conversionsToPay[i].result);
    }
    fromDiffBalanceExpected = fromDiffBalanceExpected.add(batchFeeToPay(sumToPay));
    feeDiffBalanceExpected = feeDiffBalanceExpected.add(batchFeeToPay(sumToPay));
  };

  const transferOneTokenConv = async (path: string[], logGas = false) => {
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

    calculBalances(conversionToPay, conversionFees, [conversionToPay]);
  };

  const twoTransferOneTokenConv = async (path2: string[], nTimes: number, logGas = false) => {
    const coef = 2;
    const amountInFiat2 = BigNumber.from(amountInFiat).mul(coef).toString();
    const feesAmountInFiat2 = BigNumber.from(feesAmountInFiat).mul(coef).toString();

    const conversionToPay2 = await chainlinkPath.getConversion(amountInFiat2, path2);
    const conversionFees2 = await chainlinkPath.getConversion(feesAmountInFiat2, path2);

    let requestInfo2 = Utils.deepCopy(requestInfo);

    requestInfo2._path = path2;
    requestInfo2._requestAmount = amountInFiat2;
    requestInfo2._feeAmount = feesAmountInFiat2;
    requestInfo2._maxToSpend = conversionToPay2.result.add(conversionFees2.result).toString();

    let requestInfos: RequestInfo[] = [];
    let conversionsToPay: ConvToPay[] = [];
    for (let i = 0; i < nTimes; i++) {
      requestInfos = requestInfos.concat([requestInfo, requestInfo2]);
      conversionsToPay = conversionsToPay.concat([conversionToPay, conversionToPay2]);
    }
    const result = batchConvFunction(argTemplate(requestInfos), feeAddress);
    const tx = await result;
    await tx.wait(1);
    if (logGas) {
      const receipt = await tx.wait();
      console.log(`${2 * nTimes} req, gas consumption: `, receipt.gasUsed.toString());
    }

    if (
      requestInfo._path[requestInfo._path.length - 1] ===
      requestInfo2._path[requestInfo2._path.length - 1]
    ) {
      for (let i = 0; i < nTimes - 1; i++) {
        calculBalances(conversionToPay, conversionFees, []);
        calculBalances(conversionToPay2, conversionFees2, []);
      }
      calculBalances(conversionToPay, conversionFees, []);
      calculBalances(conversionToPay2, conversionFees2, conversionsToPay);
    } else {
      for (let i = 0; i < nTimes - 1; i++) {
        calculBalances(conversionToPay, conversionFees, []);
      }
      const conversionsToPayBis = conversionsToPay.filter((_, i) => i % 2 === 0);

      calculBalances(conversionToPay, conversionFees, conversionsToPayBis);
    }
  };

  const testSuite = (suiteName: string) => {
    describe(suiteName, () => {
      before(() => {
        if (suiteName === 'batchRouter') {
          batchConvFunction = testBatchConversionProxy.batchRouter;
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
        if (suiteName === 'batchERC20ConversionPaymentsMultiTokensEasy') {
          batchConvFunction = testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokensEasy;
          argTemplate = (requestInfos: RequestInfo[]) => {
            return requestInfos;
          };
        }
      });

      describe('batchERC20ConversionPaymentsMultiTokensEasy with DAI', async () => {
        it('allows to transfer DAI tokens for USD payment', async () => {
          await transferOneTokenConv(path);
        });
        it('allows to transfer DAI tokens for EUR payment', async () => {
          path = [EUR_hash, USD_hash, DAI_address];
          await transferOneTokenConv(path);
        });
        it('allows to transfer 2 transactions DAI tokens for USD payment', async function () {
          await twoTransferOneTokenConv(path, 1);
        });
        it('allows to transfer DAI tokens for EUR payment - GAS', async () => {
          path = [EUR_hash, USD_hash, DAI_address];
          await transferOneTokenConv(path, true);
        });
        it('allows to transfer 2 transactions DAI tokens for USD and EUR payment - GAS', async function () {
          const path2 = [EUR_hash, USD_hash, DAI_address];
          await twoTransferOneTokenConv(path2, 1, true);
        });
        it('TMP allows to transfer two kind of tokens for USD - GAS', async function () {
          const path2 = [USD_hash, fakeFAU_address];
          await twoTransferOneTokenConv(path2, 1, true);
        });
      });
    });

    describe('batchERC20ConversionPaymentsMultiTokensEasy with errors', () => {
      it('cannot transfer with invalid path', async function () {
        const wrongPath = [EUR_hash, ETH_hash, DAI_address];
        requestInfo._path = wrongPath;
        await expect(batchConvFunction(argTemplate([requestInfo]), feeAddress)).to.be.revertedWith(
          'revert No aggregator found',
        );
      });

      it('cannot transfer if max to spend too low', async function () {
        requestInfo._maxToSpend = conversionToPay.result
          .add(conversionFees.result)
          .sub(1)
          .toString();
        await expect(batchConvFunction(argTemplate([requestInfo]), feeAddress)).to.be.revertedWith(
          'Amount to pay is over the user limit',
        );
      });

      it('cannot transfer if rate is too old', async function () {
        requestInfo._maxRateTimespan = 10;

        await expect(batchConvFunction(argTemplate([requestInfo]), feeAddress)).to.be.revertedWith(
          'aggregator rate is outdated',
        );
      });
    });
  };
  testSuite('batchRouter');
  testSuite('batchERC20ConversionPaymentsMultiTokensEasy');
});
