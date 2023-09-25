import '@nomiclabs/hardhat-ethers';
import { BytesLike, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  TestERC20__factory,
  TestERC20,
  ERC20TransferableReceivable__factory,
  ERC20TransferableReceivable,
  ERC20FeeProxy,
  ERC20FeeProxy__factory,
} from '../../src/types';
import { BigNumber as BN } from 'ethers';

const BASE_DECIMAL = BN.from(10).pow(BN.from(18));

describe('contract: ERC20TransferableReceivable', () => {
  let deployer: Signer;
  let user1: Signer, user1Addr: string;
  let user2: Signer, user2Addr: string;
  let user3: Signer, user3Addr: string;

  let testToken: TestERC20, receivable: ERC20TransferableReceivable, erc20FeeProxy: ERC20FeeProxy;

  before(async function () {
    [deployer, user1, user2, user3] = await ethers.getSigners();
    user1Addr = await user1.getAddress();
    user2Addr = await user2.getAddress();
    user3Addr = await user3.getAddress();
  });

  beforeEach(async function () {
    testToken = await new TestERC20__factory(deployer).deploy(BN.from(1000000).mul(BASE_DECIMAL));
    erc20FeeProxy = await new ERC20FeeProxy__factory(deployer).deploy();
    receivable = await new ERC20TransferableReceivable__factory(deployer).deploy(
      'Request Network Transferable Receivable',
      'tREC',
      erc20FeeProxy.address,
    );

    await testToken.approve(receivable.address, ethers.constants.MaxUint256);
  });

  async function verifyReceivables(userAddr: string, tokenIds: any) {
    for (let tokenId of tokenIds) {
      expect(await receivable.ownerOf(tokenId)).to.equals(userAddr);
    }
  }

  describe('mint', async function () {
    it('revert with empty paymentReference', async function () {
      await expect(receivable.mint(user1Addr, [], 1, testToken.address)).to.be.revertedWith(
        'Zero paymentReference provided',
      );
    });

    it('revert with zero amount', async function () {
      await expect(receivable.mint(user1Addr, '0x01', 0, testToken.address)).to.be.revertedWith(
        'Zero amount provided',
      );
    });

    it('revert with empty asset address', async function () {
      await expect(
        receivable.mint(user1Addr, '0x01', 1, ethers.constants.AddressZero),
      ).to.be.revertedWith('Zero address provided');
    });

    it('revert when trying to mint a receivable for the same request', async function () {
      await receivable.connect(user1).mint(user1Addr, '0x01', 1, testToken.address);
    });

    it('revert with empty owner address', async function () {
      await expect(
        receivable.mint(ethers.constants.AddressZero, '0x01', 1, testToken.address),
      ).to.be.revertedWith('Zero address provided for owner');
    });

    it('revert with duplicated receivableId', async function () {
      await receivable.connect(user1).mint(user1Addr, '0x01', 1, testToken.address);
      await expect(
        receivable.connect(user1).mint(user1Addr, '0x01', 2, testToken.address),
      ).to.be.revertedWith('Receivable has already been minted for this user and request');
    });

    it('success', async function () {
      const paymentRef = '0x01' as BytesLike;
      await receivable.connect(user1).mint(user1Addr, paymentRef, BASE_DECIMAL, testToken.address);
      const tokenId = 1;
      expect(await receivable.ownerOf(tokenId)).to.equals(user1Addr);
      const key = ethers.utils.solidityKeccak256(['address', 'bytes'], [user1Addr, paymentRef]);
      expect(await receivable.receivableTokenIdMapping(key)).to.equals(tokenId);

      const receivableInfo = await receivable.receivableInfoMapping(tokenId);
      expect(receivableInfo.tokenAddress).to.equal(testToken.address);
      expect(receivableInfo.amount).to.equal(BASE_DECIMAL);
      expect(receivableInfo.balance).to.equal(0);
    });

    it('list receivables', async function () {
      await receivable.connect(user1).mint(user1Addr, '0x01', BASE_DECIMAL, testToken.address);
      await receivable.connect(user1).mint(user1Addr, '0x02', BASE_DECIMAL, testToken.address);
      await receivable.connect(user1).mint(user1Addr, '0x03', BASE_DECIMAL, testToken.address);
      await verifyReceivables(user1Addr, [1, 2, 3]);
      await receivable.connect(user2).mint(user2Addr, '0x04', BASE_DECIMAL, testToken.address);
      await receivable.connect(user2).mint(user2Addr, '0x05', BASE_DECIMAL, testToken.address);
      await verifyReceivables(user2Addr, [4, 5]);
      await receivable.connect(user1).transferFrom(user1Addr, user2Addr, 1);
      await verifyReceivables(user1Addr, [3, 2]);
      await verifyReceivables(user2Addr, [4, 5, 1]);
      await receivable
        .connect(user2)
        ['safeTransferFrom(address,address,uint256)'](user2Addr, user1Addr, 5);
      await verifyReceivables(user1Addr, [3, 2, 5]);
      await verifyReceivables(user2Addr, [4, 1]);
      await receivable.connect(user1).approve(user3Addr, 3);
      await receivable.connect(user1).approve(user3Addr, 2);
      await receivable.connect(user1).approve(user3Addr, 5);
      await receivable.connect(user2).approve(user3Addr, 4);
      await receivable.connect(user3).transferFrom(user1Addr, user3Addr, 5);
      await receivable.connect(user3).transferFrom(user1Addr, user3Addr, 2);
      await receivable.connect(user3).transferFrom(user1Addr, user3Addr, 3);
      await receivable.connect(user3).transferFrom(user2Addr, user3Addr, 4);
      await verifyReceivables(user1Addr, []);
      await verifyReceivables(user2Addr, [1]);
      await verifyReceivables(user3Addr, [5, 2, 3, 4]);
    });
  });

  describe('payOwner', async function () {
    let tokenId: BN;
    let paymentRef: BytesLike;
    let amount: BN;
    let feeAmount: BN;

    beforeEach(async () => {
      paymentRef = '0x01' as BytesLike;
      amount = BN.from(100).mul(BASE_DECIMAL);
      await receivable.connect(user1).mint(user1Addr, paymentRef, amount, testToken.address);
      tokenId = BN.from(1);
      feeAmount = BN.from(10).mul(BASE_DECIMAL);
    });

    it('revert with zero amount', async function () {
      await expect(
        receivable.payOwner(tokenId, 0, paymentRef, 0, ethers.constants.AddressZero),
      ).to.be.revertedWith('Zero amount provided');
    });

    it('reverts when proxy payment ERC20FeeProxy contract fails', async function () {
      await testToken.transfer(await user2.getAddress(), amount.add(feeAmount));
      await testToken.connect(user2).approve(receivable.address, amount.add(feeAmount));
      // user2 does not have enough tokens to pay this request
      await expect(
        receivable
          .connect(user2)
          .payOwner(tokenId, amount.mul(2), paymentRef, feeAmount, user3Addr),
      ).to.be.revertedWith('transferFromWithReferenceAndFee failed');
    });

    it('success for original owner', async function () {
      const beforeBal = await testToken.balanceOf(user1Addr);
      await expect(
        receivable.payOwner(tokenId, amount, paymentRef, 0, ethers.constants.AddressZero),
      )
        .to.emit(receivable, 'TransferWithReferenceAndFee')
        .withArgs(
          testToken.address,
          user1Addr,
          amount,
          paymentRef,
          0,
          ethers.constants.AddressZero,
        );
      const afterBal = await testToken.balanceOf(user1Addr);
      expect(amount).to.equals(afterBal.sub(beforeBal));
    });

    it('allow multiple mints per receivable', async function () {
      await receivable.connect(user2).mint(user2Addr, paymentRef, amount, testToken.address);
      const key = ethers.utils.solidityKeccak256(['address', 'bytes'], [user1Addr, paymentRef]);
      expect(await receivable.receivableTokenIdMapping(key)).to.equals(tokenId);
    });

    it('allows user to mint on behalf of another user', async function () {
      paymentRef = '0x02' as BytesLike;
      await receivable.connect(user1).mint(user2Addr, paymentRef, amount, testToken.address);
      const key = ethers.utils.solidityKeccak256(['address', 'bytes'], [user2Addr, paymentRef]);
      tokenId = BN.from(2);
      expect(await receivable.receivableTokenIdMapping(key)).to.equals(tokenId);
    });

    it('payment greater than amount', async function () {
      const receivableInfoBefore = await receivable.receivableInfoMapping(tokenId);
      const beforeBal = await testToken.balanceOf(user1Addr);
      await expect(
        receivable.payOwner(tokenId, amount.mul(2), paymentRef, 0, ethers.constants.AddressZero),
      )
        .to.emit(receivable, 'TransferWithReferenceAndFee')
        .withArgs(
          testToken.address,
          user1Addr,
          amount.mul(2),
          paymentRef,
          0,
          ethers.constants.AddressZero,
        );
      const receivableInfoAfter = await receivable.receivableInfoMapping(tokenId);
      const afterBal = await testToken.balanceOf(user1Addr);
      expect(amount.mul(2)).to.equals(afterBal.sub(beforeBal));
      expect(amount.mul(2)).to.equals(
        receivableInfoAfter.balance.sub(receivableInfoBefore.balance),
      );
    });

    it('payment less than amount', async function () {
      const beforeBal = await testToken.balanceOf(user1Addr);
      await expect(
        receivable.payOwner(tokenId, amount.div(2), paymentRef, 0, ethers.constants.AddressZero),
      )
        .to.emit(receivable, 'TransferWithReferenceAndFee')
        .withArgs(
          testToken.address,
          user1Addr,
          amount.div(2),
          paymentRef,
          0,
          ethers.constants.AddressZero,
        );
      const afterBal = await testToken.balanceOf(user1Addr);
      expect(amount.div(2)).to.equals(afterBal.sub(beforeBal));

      const receivableInfo = await receivable.receivableInfoMapping(tokenId);
      expect(amount.div(2)).to.equals(receivableInfo.balance);
    });

    it('payment with two different payees', async function () {
      const beforeBal = await testToken.balanceOf(user1Addr);
      await expect(
        receivable.payOwner(tokenId, amount.div(2), paymentRef, 0, ethers.constants.AddressZero),
      )
        .to.emit(receivable, 'TransferWithReferenceAndFee')
        .withArgs(
          testToken.address,
          user1Addr,
          amount.div(2),
          paymentRef,
          0,
          ethers.constants.AddressZero,
        );
      const afterBal = await testToken.balanceOf(user1Addr);
      expect(amount.div(2)).to.equals(afterBal.sub(beforeBal));

      let receivableInfo = await receivable.receivableInfoMapping(tokenId);
      expect(amount.div(2)).to.equals(receivableInfo.balance);

      // Transfer receivable
      await receivable.connect(user1).transferFrom(user1Addr, user2Addr, tokenId);
      expect(await receivable.ownerOf(tokenId)).to.equal(user2Addr);

      const beforeBalUser2 = await testToken.balanceOf(user2Addr);
      await expect(
        receivable.payOwner(tokenId, amount.div(2), paymentRef, 0, ethers.constants.AddressZero),
      )
        .to.emit(receivable, 'TransferWithReferenceAndFee')
        .withArgs(
          testToken.address,
          user2Addr,
          amount.div(2),
          paymentRef,
          0,
          ethers.constants.AddressZero,
        );
      const afterBalUser2 = await testToken.balanceOf(user2Addr);
      expect(amount.div(2)).to.equals(afterBalUser2.sub(beforeBalUser2));

      receivableInfo = await receivable.receivableInfoMapping(tokenId);
      expect(amount).to.equals(receivableInfo.balance);
    });

    it('success for new owner', async function () {
      const user1Addr = await user1.getAddress();
      const user2Addr = await user2.getAddress();
      const user3Addr = await user3.getAddress();

      await receivable.connect(user1).transferFrom(user1Addr, user2Addr, tokenId);

      const feeAmount = BN.from(10).mul(BASE_DECIMAL);
      const beforeBal2 = await testToken.balanceOf(user2Addr);
      const beforeBal3 = await testToken.balanceOf(user3Addr);
      await expect(await receivable.payOwner(tokenId, amount, paymentRef, feeAmount, user3Addr))
        .to.emit(receivable, 'TransferWithReferenceAndFee')
        .withArgs(testToken.address, user2Addr, amount, paymentRef, feeAmount, user3Addr);
      const afterBal2 = await testToken.balanceOf(user2Addr);
      const afterBal3 = await testToken.balanceOf(user3Addr);
      expect(amount).to.equals(afterBal2.sub(beforeBal2));
      expect(feeAmount).to.equals(afterBal3.sub(beforeBal3));
    });
  });
});
