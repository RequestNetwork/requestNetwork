import { ethers, network } from 'hardhat';
import {
  BadERC20__factory,
  DiamondPaymentFacet,
  DiamondPaymentFacet__factory,
  ERC20,
  ERC20__factory,
  EtherPaymentFallback,
  EtherPaymentFallback__factory,
  GnosisSafeProxy,
  GnosisSafeProxy__factory,
} from '../../../src/types';
import { BigNumber, Contract, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { ERC20Addresses, setupERC20 } from '../../../scripts-diamond/setup/setupERC20';
import { deployDiamondAndFacets } from '../../../scripts-diamond/deploy';
import { HttpNetworkConfig } from 'hardhat/types';

use(solidity);

describe('contract: PaymentFacet', () => {
  const referenceExample = '0xaaaa';
  const DEFAULT_GAS_PRICE = BigNumber.from('100000000000');
  const amount = BigNumber.from('10000000000000000');
  const feeAmount = BigNumber.from('2000000000000000');
  const provider = new ethers.providers.JsonRpcProvider((network.config as HttpNetworkConfig).url);
  let diamondAddress: string;
  let signer: Signer;
  let toSigner: Signer;
  let from: string;
  let to: string;
  let feeAddress: string;
  let testERC20: ERC20;
  let etherPaymentFallback: EtherPaymentFallback;
  let erc20Adresses: ERC20Addresses;
  let paymentFacet: DiamondPaymentFacet;
  let gnosisSafeProxy: GnosisSafeProxy;

  before(async () => {
    [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [signer, toSigner] = await ethers.getSigners();
    diamondAddress = await deployDiamondAndFacets();
    erc20Adresses = await setupERC20();
    paymentFacet = DiamondPaymentFacet__factory.connect(diamondAddress, signer);

    // Gnosis Safe specific deployments
    etherPaymentFallback = await new EtherPaymentFallback__factory(signer).deploy();
    gnosisSafeProxy = await new GnosisSafeProxy__factory(signer).deploy(
      etherPaymentFallback.address,
    );
  });

  describe('Token Transfer', () => {
    // Before each test make an approval
    beforeEach(async () => {
      testERC20 = ERC20__factory.connect(erc20Adresses.ERC20TestAddress, signer);
      await testERC20.approve(paymentFacet.address, '1000');
    });

    // After each test send all funds from "to" to "from"
    afterEach(async () => {
      testERC20 = testERC20.connect(toSigner);
      const toFinalBalance = await testERC20.balanceOf(to);
      await testERC20.transfer(from, toFinalBalance);
      testERC20 = testERC20.connect(signer);
    });

    describe('method: TokenTransfer', () => {
      it('allows to store a reference', async function () {
        await expect(paymentFacet.tokenTransfer(testERC20.address, to, '100', referenceExample))
          .to.emit(paymentFacet, 'TokenTransfer')
          // transferReference indexes the event log, therefore the keccak256 is stored
          .withArgs(testERC20.address, to, '100', ethers.utils.keccak256(referenceExample));
      });

      it('allows to transfer tokens', async function () {
        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);

        await paymentFacet.tokenTransfer(testERC20.address, to, '100', referenceExample);

        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);

        // Check balance changes
        expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(100).toString());
        expect(toNewBalance.toString()).to.equals(toOldBalance.add(100).toString());
      });

      it('should revert if no fund', async function () {
        await testERC20.transfer(to, await testERC20.balanceOf(from));
        await expect(
          paymentFacet.tokenTransfer(testERC20.address, to, '100', referenceExample),
        ).to.be.revertedWith('TokenTransfer failed: transferFrom() failed');
      });
    });

    describe('method: TokenTransferWithFees', () => {
      it('stores reference and paid fee', async function () {
        await expect(
          paymentFacet.tokenTransferWithFees(
            testERC20.address,
            to,
            '100',
            referenceExample,
            '2',
            feeAddress,
          ),
        )
          .to.emit(paymentFacet, 'TokenTransferWithFees')
          .withArgs(
            testERC20.address,
            to,
            '100',
            ethers.utils.keccak256(referenceExample),
            '2',
            feeAddress,
          );
      });

      it('transfers tokens for payment and fees', async function () {
        await testERC20.approve(paymentFacet.address, '102', { from });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);

        await paymentFacet.tokenTransferWithFees(
          testERC20.address,
          to,
          '100',
          referenceExample,
          '2',
          feeAddress,
        );

        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);

        // Check balance changes
        expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(102).toString());
        expect(toNewBalance.toString()).to.equals(toOldBalance.add(100).toString());
        expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(2).toString());
      });

      it('should revert if no allowance', async function () {
        await testERC20.approve(diamondAddress, 0);

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);

        await expect(
          paymentFacet.tokenTransferWithFees(
            testERC20.address,
            to,
            '100',
            referenceExample,
            '2',
            feeAddress,
          ),
        ).to.be.revertedWith('revert');

        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);

        // Check balance changes
        expect(fromNewBalance.toString()).to.equals(
          fromOldBalance.toString(),
          'Payer balance changed',
        );
        expect(toNewBalance.toString()).to.equals(
          toOldBalance.toString(),
          'Issuer balance changed',
        );
        expect(feeNewBalance.toString()).to.equals(
          feeOldBalance.toString(),
          'Fee account balance changed',
        );
      });

      it('should revert if error', async function () {
        await testERC20.approve(paymentFacet.address, '102', { from });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);

        await expect(
          paymentFacet.tokenTransferWithFees(
            testERC20.address,
            to,
            '100',
            referenceExample,
            '-10',
            feeAddress,
            {
              from,
            },
          ),
        ).to.be.reverted; // Revert from invalid argument

        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);

        // Check balance changes
        expect(fromNewBalance.toString()).to.equals(fromOldBalance.toString());
        expect(toNewBalance.toString()).to.equals(toOldBalance.toString());
        expect(feeNewBalance.toString()).to.equals(feeOldBalance.toString());
      });

      it('should revert if no fund', async function () {
        // "toSigner" does not have any funds - see afterEach();
        testERC20 = testERC20.connect(toSigner);
        await expect(
          paymentFacet.tokenTransferWithFees(
            testERC20.address,
            from,
            '10000',
            referenceExample,
            '0',
            feeAddress,
          ),
        ).to.be.revertedWith('TokenTransferWithFees failed: transferFrom() failed (payment)');
      });

      it('no fee transfer if amount is 0', async function () {
        await testERC20.approve(paymentFacet.address, '100');
        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);

        await expect(
          paymentFacet.tokenTransferWithFees(
            testERC20.address,
            to,
            '100',
            referenceExample,
            '0',
            feeAddress,
            {
              from,
            },
          ),
        )
          // transferReference indexes the event log, therefore the keccak256 is stored
          .to.emit(paymentFacet, 'TokenTransferWithFees')
          .withArgs(
            testERC20.address,
            to,
            '100',
            ethers.utils.keccak256(referenceExample),
            '0',
            feeAddress,
          );

        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);

        // Check balance changes
        expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(100).toString());
        expect(toNewBalance.toString()).to.equals(toOldBalance.add(100).toString());
        expect(feeNewBalance.toString()).to.equals(feeOldBalance.toString());
      });

      it('transfers tokens for payment and fees on BadERC20', async function () {
        const badERC20 = BadERC20__factory.connect(erc20Adresses.BadERC20Address, signer);
        await badERC20.approve(paymentFacet.address, '102', { from });

        const fromOldBalance = await badERC20.balanceOf(from);
        const toOldBalance = await badERC20.balanceOf(to);
        const feeOldBalance = await badERC20.balanceOf(feeAddress);

        await paymentFacet.tokenTransferWithFees(
          badERC20.address,
          to,
          '100',
          referenceExample,
          '2',
          feeAddress,
          {
            from,
          },
        );

        const fromNewBalance = await badERC20.balanceOf(from);
        const toNewBalance = await badERC20.balanceOf(to);
        const feeNewBalance = await badERC20.balanceOf(feeAddress);

        // Check balance changes
        expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(102).toString());
        expect(toNewBalance.toString()).to.equals(toOldBalance.add(100).toString());
        expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(2).toString());
      });

      it('transfers tokens for payment and fees on a variety of ERC20 contract formats', async function () {
        const tokenAddressesToTest_Success = [
          erc20Adresses.ERC20TrueAddress,
          erc20Adresses.ERC20NoReturnAddress,
        ];
        const tokenAddressesToTest_Fail = [
          erc20Adresses.ERC20FalseAddress,
          erc20Adresses.ERC20RevertAddress,
        ];

        for (let erc20Address of tokenAddressesToTest_Success) {
          await expect(
            paymentFacet.tokenTransferWithFees(
              erc20Address,
              to,
              '100',
              referenceExample,
              '2',
              feeAddress,
            ),
          )
            .to.emit(paymentFacet, 'TokenTransferWithFees')
            .withArgs(
              erc20Address,
              to,
              '100',
              ethers.utils.keccak256(referenceExample),
              '2',
              feeAddress,
            );
        }

        await expect(
          paymentFacet.tokenTransferWithFees(
            tokenAddressesToTest_Fail[0],
            to,
            '100',
            referenceExample,
            '2',
            feeAddress,
          ),
        ).to.be.revertedWith('TokenTransferWithFees failed: transferFrom() failed (payment)');

        await expect(
          paymentFacet.tokenTransferWithFees(
            tokenAddressesToTest_Fail[1],
            to,
            '100',
            referenceExample,
            '2',
            feeAddress,
          ),
        ).to.be.revertedWith('revert');
      });
    });
  });

  describe('Native Transfer', () => {
    describe('method: NativeTransfer', () => {
      it('allows to store a reference', async () => {
        await expect(
          paymentFacet.nativeTransfer(to, referenceExample, {
            value: amount,
          }),
        )
          .to.emit(paymentFacet, 'NativeTransfer')
          .withArgs(to, amount.toString(), ethers.utils.keccak256(referenceExample));
      });

      it('allows to transfer ethers', async () => {
        const fromOldBalance = await provider.getBalance(from);
        const toOldBalance = await provider.getBalance(to);

        await (
          await paymentFacet.nativeTransfer(to, referenceExample, {
            value: amount,
            gasPrice: DEFAULT_GAS_PRICE,
          })
        ).wait();

        const fromNewBalance = await provider.getBalance(from);
        const toNewBalance = await provider.getBalance(to);

        // Check balance changes
        expect(fromNewBalance).to.be.lt(fromOldBalance.sub(amount));
        expect(fromNewBalance).to.be.gt(fromOldBalance.sub(amount).mul(95).div(100));
        expect(toNewBalance.toString()).to.equals(toOldBalance.add(amount).toString());
      });

      it('allow to transfer ethers to a gnosis safe', async () => {
        const fromOldBalance = await provider.getBalance(from);
        const gnosisSafeProxyOldBalance = await provider.getBalance(gnosisSafeProxy.address);

        await (
          await paymentFacet.nativeTransfer(gnosisSafeProxy.address, referenceExample, {
            value: amount,
            gasPrice: DEFAULT_GAS_PRICE,
          })
        ).wait();

        const fromNewBalance = await provider.getBalance(from);
        const gnosisSafeProxyNewBalance = await provider.getBalance(gnosisSafeProxy.address);

        // Check balance changes
        expect(fromNewBalance).to.be.lt(fromOldBalance.sub(amount));
        expect(fromNewBalance).to.be.gt(fromOldBalance.sub(amount).mul(95).div(100));
        expect(gnosisSafeProxyNewBalance.toString()).to.equals(
          gnosisSafeProxyOldBalance.add(amount).toString(),
        );
      });
    });

    describe('method: NativeTransferWithFees', () => {
      it('allows to pays with a reference', async () => {
        const toOldBalance = await provider.getBalance(to);
        const feeAddressOldBalance = await provider.getBalance(feeAddress);

        await expect(
          paymentFacet.nativeTransferWithFees(to, referenceExample, feeAmount, feeAddress, {
            value: amount.add(feeAmount),
          }),
        )
          .to.emit(paymentFacet, 'NativeTransferWithFees')
          .withArgs(
            to,
            amount.toString(),
            ethers.utils.keccak256(referenceExample),
            feeAmount.toString(),
            feeAddress,
          );

        const toNewBalance = await provider.getBalance(to);
        const feeAddressNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(paymentFacet.address);

        // Check balance changes
        expect(toNewBalance.toString()).to.equals(toOldBalance.add(amount).toString());
        expect(feeAddressNewBalance.toString()).to.equals(
          feeAddressOldBalance.add(feeAmount).toString(),
        );
        expect(contractBalance.toString()).to.equals('0');
      });

      it('allows to pays exact eth with a reference with extra msg.value', async () => {
        const toOldBalance = await provider.getBalance(to);
        const feeAddressOldBalance = await provider.getBalance(feeAddress);

        await expect(
          paymentFacet.exactNativeTransferWithFees(
            to,
            amount,
            referenceExample,
            feeAmount,
            feeAddress,
            {
              value: amount.add(feeAmount).add('10000'),
            },
          ),
        )
          .to.emit(paymentFacet, 'NativeTransferWithFees')
          .withArgs(
            to,
            amount.toString(),
            ethers.utils.keccak256(referenceExample),
            feeAmount.toString(),
            feeAddress,
          );

        const toNewBalance = await provider.getBalance(to);
        const feeAddressNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(paymentFacet.address);

        // Check balance changes
        expect(toNewBalance.toString()).to.equals(toOldBalance.add(amount).toString());
        expect(feeAddressNewBalance.toString()).to.equals(
          feeAddressOldBalance.add(feeAmount).toString(),
        );
        expect(contractBalance.toString()).to.equals('0');
      });

      it('cannot transfer if msg.value is too low', async () => {
        await expect(
          paymentFacet.nativeTransferWithFees(to, referenceExample, amount, feeAddress, {
            value: feeAmount,
          }),
        ).to.be.revertedWith('revert');
      });

      it('allows to pay with a reference to a gnosis safe', async () => {
        const gnosisSafeProxyOldBalance = await provider.getBalance(gnosisSafeProxy.address);

        await expect(
          paymentFacet.nativeTransferWithFees(
            gnosisSafeProxy.address,
            referenceExample,
            feeAmount,
            feeAddress,
            {
              value: amount.add(feeAmount),
            },
          ),
        )
          .to.emit(paymentFacet, 'NativeTransferWithFees')
          .withArgs(
            gnosisSafeProxy.address,
            amount.toString(),
            ethers.utils.keccak256(referenceExample),
            feeAmount.toString(),
            feeAddress,
          );

        const gnosisSafeProxyNewBalance = await provider.getBalance(gnosisSafeProxy.address);
        expect(gnosisSafeProxyNewBalance.toString()).to.equals(
          gnosisSafeProxyOldBalance.add(amount).toString(),
        );
      });

      it('allows to pays exact eth with a reference with extra msg.value to a gnosisSafe', async () => {
        const gnosisSafeOldBalance = await provider.getBalance(gnosisSafeProxy.address);
        const feeAddressOldBalance = await provider.getBalance(feeAddress);

        await expect(
          paymentFacet.exactNativeTransferWithFees(
            gnosisSafeProxy.address,
            amount,
            referenceExample,
            feeAmount,
            feeAddress,
            {
              value: amount.add(feeAmount).add('10000'),
            },
          ),
        )
          .to.emit(paymentFacet, 'NativeTransferWithFees')
          .withArgs(
            gnosisSafeProxy.address,
            amount.toString(),
            ethers.utils.keccak256(referenceExample),
            feeAmount.toString(),
            feeAddress,
          );

        const gnosisSafeNewBalance = await provider.getBalance(gnosisSafeProxy.address);
        const feeAddressNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(paymentFacet.address);

        // Check balance changes
        expect(gnosisSafeNewBalance.toString()).to.equals(
          gnosisSafeOldBalance.add(amount).toString(),
        );
        expect(feeAddressNewBalance.toString()).to.equals(
          feeAddressOldBalance.add(feeAmount).toString(),
        );
        expect(contractBalance.toString()).to.equals('0');
      });
    });
  });
});
