import { ethers } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  RequestFeeBurner,
  RequestFeeBurner__factory,
  MockBurnableReq,
  MockBurnableReq__factory,
  MockNonBurnableReq__factory,
  MockUsdtStrictApprove,
  MockUsdtStrictApprove__factory,
  MockWrappedNative,
  MockWrappedNative__factory,
  MockSwapRouterExactIn,
  MockSwapRouterExactIn__factory,
  MockReentrantRouter__factory,
  MockAllowanceCheckingRouter__factory,
  TestERC20,
  TestERC20__factory,
  ERC20FeeProxy__factory,
  EthereumFeeProxy__factory,
} from '../../src/types';

use(solidity);

const DEAD = '0x000000000000000000000000000000000000dEaD';
const ZERO = ethers.constants.AddressZero;
const ONE = ethers.utils.parseEther('1');

/** Asserts that a call reverted with a given custom error (hardhat network message format). */
async function expectCustomError(promise: Promise<unknown>, name: string): Promise<void> {
  try {
    await promise;
  } catch (e) {
    const message = (e as Error).message;
    // Transactions report "reverted with custom error 'X(...)'", view calls report errorName="X".
    const matched =
      message.includes(`reverted with custom error '${name}(`) ||
      message.includes(`errorName="${name}"`);
    expect(matched, message).to.equal(true);
    return;
  }
  expect.fail(`Expected custom error ${name}, but the call succeeded`);
}

describe('contract: RequestFeeBurner', () => {
  let owner: Signer;
  let keeper: Signer;
  let stranger: Signer;
  let payer: Signer;
  let ownerAddress: string;
  let keeperAddress: string;
  let strangerAddress: string;
  let payerAddress: string;

  let req: MockBurnableReq;
  let usdc: TestERC20;
  let weth: MockWrappedNative;
  let router: MockSwapRouterExactIn;
  let burner: RequestFeeBurner;

  const deadline = () => Math.floor(Date.now() / 1000) + 3600;

  const deployBurner = async (
    reqAddress: string,
    routerAddress: string,
    wethAddress: string,
    useBurn: boolean,
  ): Promise<RequestFeeBurner> => {
    const b = await new RequestFeeBurner__factory(owner).deploy(
      reqAddress,
      routerAddress,
      wethAddress,
      useBurn,
      ownerAddress,
    );
    await b.connect(owner).setKeeper(keeperAddress, true);
    return b;
  };

  before(async () => {
    [owner, keeper, stranger, payer] = await ethers.getSigners();
    [ownerAddress, keeperAddress, strangerAddress, payerAddress] = await Promise.all(
      [owner, keeper, stranger, payer].map((s) => s.getAddress()),
    );
  });

  beforeEach(async () => {
    req = await new MockBurnableReq__factory(owner).deploy(ONE.mul(1_000_000));
    usdc = await new TestERC20__factory(owner).deploy(ONE.mul(1_000_000));
    weth = await new MockWrappedNative__factory(owner).deploy();
    router = await new MockSwapRouterExactIn__factory(owner).deploy();
    // 1 fee token = 10 REQ
    await router.setRate(10, 1);
    await req.transfer(router.address, ONE.mul(100_000));

    burner = await deployBurner(req.address, router.address, weth.address, true);
  });

  describe('deployment', () => {
    it('stores immutable configuration and owner', async () => {
      expect(await burner.reqToken()).to.equal(req.address);
      expect(await burner.swapRouter()).to.equal(router.address);
      expect(await burner.wrappedNativeToken()).to.equal(weth.address);
      expect(await burner.useBurnFunction()).to.equal(true);
      expect(await burner.owner()).to.equal(ownerAddress);
      expect(await burner.DEAD_ADDRESS()).to.equal(DEAD);
    });

    it('rejects zero addresses for REQ, router and owner', async () => {
      const f = new RequestFeeBurner__factory(owner);
      await expectCustomError(
        f.deploy(ZERO, router.address, weth.address, true, ownerAddress),
        'ZeroAddress',
      );
      await expectCustomError(
        f.deploy(req.address, ZERO, weth.address, true, ownerAddress),
        'ZeroAddress',
      );
      await expectCustomError(
        f.deploy(req.address, router.address, weth.address, true, ZERO),
        'ZeroAddress',
      );
    });

    it('assigns ownership to the given owner, not the deployer', async () => {
      const b = await new RequestFeeBurner__factory(stranger).deploy(
        req.address,
        router.address,
        weth.address,
        true,
        ownerAddress,
      );
      expect(await b.owner()).to.equal(ownerAddress);
    });

    it('exposes no function that can move fees out (ABI allow-list)', async () => {
      const mutating = Object.values(burner.interface.functions)
        .filter((f) => !f.constant)
        .map((f) => f.name)
        .sort();
      expect(mutating).to.deep.equal(
        [
          'acceptOwnership',
          'burnHeldReq',
          'setKeeper',
          'swapAndBurn',
          'transferOwnership',
          'wrapNative',
        ].sort(),
      );
      // renounceOwnership is overridden as a view that always reverts.
      expect(burner.interface.getFunction('renounceOwnership()').stateMutability).to.equal('view');
    });
  });

  describe('access control', () => {
    it('only the owner can manage keepers', async () => {
      await expect(burner.connect(stranger).setKeeper(strangerAddress, true)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
      await expect(burner.connect(owner).setKeeper(strangerAddress, true))
        .to.emit(burner, 'KeeperUpdated')
        .withArgs(strangerAddress, true);
      expect(await burner.isKeeper(strangerAddress)).to.equal(true);
      await burner.connect(owner).setKeeper(strangerAddress, false);
      expect(await burner.isKeeper(strangerAddress)).to.equal(false);
    });

    it('rejects the zero address as keeper', async () => {
      await expectCustomError(burner.connect(owner).setKeeper(ZERO, true), 'ZeroAddress');
    });

    it('cannot renounce ownership', async () => {
      await expectCustomError(
        burner.connect(owner).renounceOwnership(),
        'RenounceOwnershipDisabled',
      );
      await expect(burner.connect(stranger).renounceOwnership()).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });

    it('transfers ownership in two steps', async () => {
      await burner.connect(owner).transferOwnership(strangerAddress);
      expect(await burner.owner()).to.equal(ownerAddress);
      expect(await burner.pendingOwner()).to.equal(strangerAddress);
      await expect(burner.connect(payer).acceptOwnership()).to.be.revertedWith(
        'Ownable2Step: caller is not the new owner',
      );
      await burner.connect(stranger).acceptOwnership();
      expect(await burner.owner()).to.equal(strangerAddress);
    });

    it('non-keepers and revoked keepers cannot swap', async () => {
      await usdc.transfer(burner.address, ONE);
      await expectCustomError(
        burner.connect(stranger).swapAndBurn([usdc.address, req.address], ONE, 1, deadline()),
        'NotKeeper',
      );
      await expectCustomError(
        burner.connect(owner).swapAndBurn([usdc.address, req.address], ONE, 1, deadline()),
        'NotKeeper',
      );
      await burner.connect(owner).setKeeper(keeperAddress, false);
      await expectCustomError(
        burner.connect(keeper).swapAndBurn([usdc.address, req.address], ONE, 1, deadline()),
        'NotKeeper',
      );
    });
  });

  describe('swapAndBurn', () => {
    beforeEach(async () => {
      await usdc.transfer(burner.address, ONE.mul(100));
    });

    it('swaps fees into REQ and burns them, reducing total supply', async () => {
      const supplyBefore = await req.totalSupply();
      const amountIn = ONE.mul(40);
      const expectedReq = amountIn.mul(10);

      await expect(
        burner
          .connect(keeper)
          .swapAndBurn([usdc.address, req.address], amountIn, expectedReq, deadline()),
      )
        .to.emit(burner, 'FeesSwappedForReq')
        .withArgs(usdc.address, amountIn, expectedReq)
        .and.to.emit(burner, 'ReqBurned')
        .withArgs(expectedReq, expectedReq);

      expect(await req.totalSupply()).to.equal(supplyBefore.sub(expectedReq));
      expect(await req.balanceOf(burner.address)).to.equal(0);
      expect(await usdc.balanceOf(burner.address)).to.equal(ONE.mul(60));
      expect(await burner.totalReqBurned()).to.equal(expectedReq);
      expect(await usdc.allowance(burner.address, router.address)).to.equal(0);
    });

    it('also burns REQ that was already held by the contract', async () => {
      await req.transfer(burner.address, ONE.mul(5));
      await burner
        .connect(keeper)
        .swapAndBurn([usdc.address, req.address], ONE, ONE.mul(10), deadline());
      expect(await burner.totalReqBurned()).to.equal(ONE.mul(15));
      expect(await req.balanceOf(burner.address)).to.equal(0);
    });

    it('accepts multi-hop paths ending in REQ', async () => {
      await burner
        .connect(keeper)
        .swapAndBurn([usdc.address, weth.address, req.address], ONE, ONE.mul(10), deadline());
      expect(await burner.totalReqBurned()).to.equal(ONE.mul(10));
    });

    it('sends REQ to the dead address when burn() is not available', async () => {
      const bridgedReq = await new MockNonBurnableReq__factory(owner).deploy(ONE.mul(1_000_000));
      await bridgedReq.transfer(router.address, ONE.mul(1000));
      const b = await deployBurner(bridgedReq.address, router.address, weth.address, false);
      await usdc.transfer(b.address, ONE);

      await b.connect(keeper).swapAndBurn([usdc.address, bridgedReq.address], ONE, 1, deadline());

      expect(await bridgedReq.balanceOf(DEAD)).to.equal(ONE.mul(10));
      expect(await bridgedReq.balanceOf(b.address)).to.equal(0);
      expect(await b.totalReqBurned()).to.equal(ONE.mul(10));
    });

    it('reverts when burn mode is on but the token has no burn()', async () => {
      const bridgedReq = await new MockNonBurnableReq__factory(owner).deploy(ONE.mul(1_000_000));
      await bridgedReq.transfer(router.address, ONE.mul(1000));
      const b = await deployBurner(bridgedReq.address, router.address, weth.address, true);
      await usdc.transfer(b.address, ONE);
      await expect(
        b.connect(keeper).swapAndBurn([usdc.address, bridgedReq.address], ONE, 1, deadline()),
      ).to.be.reverted;
      // Atomic: the fee is still there, nothing was lost.
      expect(await usdc.balanceOf(b.address)).to.equal(ONE);
    });

    describe('input validation', () => {
      it('rejects paths that are too short, do not end in REQ, or start with REQ', async () => {
        const k = burner.connect(keeper);
        await expectCustomError(k.swapAndBurn([req.address], ONE, 1, deadline()), 'InvalidPath');
        await expectCustomError(k.swapAndBurn([], ONE, 1, deadline()), 'InvalidPath');
        await expectCustomError(
          k.swapAndBurn([usdc.address, weth.address], ONE, 1, deadline()),
          'InvalidPath',
        );
        await expectCustomError(
          k.swapAndBurn([req.address, usdc.address, req.address], ONE, 1, deadline()),
          'InvalidPath',
        );
      });

      it('rejects zero amount, zero minimum output and expired deadline', async () => {
        const k = burner.connect(keeper);
        const path = [usdc.address, req.address];
        await expectCustomError(k.swapAndBurn(path, 0, 1, deadline()), 'ZeroAmount');
        await expectCustomError(k.swapAndBurn(path, ONE, 0, deadline()), 'ZeroMinimumOutput');
        await expectCustomError(k.swapAndBurn(path, ONE, 1, 1), 'DeadlineExpired');
      });

      it('cannot swap more than the fee balance', async () => {
        await expectCustomError(
          burner
            .connect(keeper)
            .swapAndBurn([usdc.address, req.address], ONE.mul(101), 1, deadline()),
          'InsufficientFeeBalance',
        );
      });
    });

    describe('price protection', () => {
      it('reverts when the router cannot meet the minimum output', async () => {
        await expect(
          burner
            .connect(keeper)
            .swapAndBurn([usdc.address, req.address], ONE, ONE.mul(11), deadline()),
        ).to.be.revertedWith('UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
      });

      it('verifies received REQ independently of the router', async () => {
        await router.setShortchange(true);
        await expectCustomError(
          burner
            .connect(keeper)
            .swapAndBurn([usdc.address, req.address], ONE, ONE.mul(10), deadline()),
          'InsufficientReqReceived',
        );
        expect(await usdc.balanceOf(burner.address)).to.equal(ONE.mul(100));
      });
    });

    describe('token quirks', () => {
      it('works with USDT-style tokens (no return value, zero-first approve)', async () => {
        const usdt: MockUsdtStrictApprove = await new MockUsdtStrictApprove__factory(owner).deploy(
          1_000_000_000,
        );
        await usdt.transfer(burner.address, 3_000_000);
        const path = [usdt.address, req.address];

        // Twice, to make sure the allowance is reset between swaps.
        await burner.connect(keeper).swapAndBurn(path, 1_000_000, 10_000_000, deadline());
        await burner.connect(keeper).swapAndBurn(path, 1_000_000, 10_000_000, deadline());

        expect(await usdt.balanceOf(burner.address)).to.equal(1_000_000);
        expect(await usdt.allowance(burner.address, router.address)).to.equal(0);
        expect(await burner.totalReqBurned()).to.equal(20_000_000);
      });

      it('leaves no allowance behind when the router pulls less than approved', async () => {
        const lazyRouter = await new MockAllowanceCheckingRouter__factory(owner).deploy();
        await req.transfer(lazyRouter.address, ONE.mul(100));
        const b = await deployBurner(req.address, lazyRouter.address, weth.address, true);
        await usdc.transfer(b.address, ONE.mul(10));

        await b
          .connect(keeper)
          .swapAndBurn([usdc.address, req.address], ONE.mul(10), 1, deadline());

        expect(await usdc.allowance(b.address, lazyRouter.address)).to.equal(0);
        expect(await usdc.balanceOf(b.address)).to.equal(ONE.mul(5));
      });
    });

    describe('reentrancy', () => {
      for (const [target, label] of [
        [0, 'burnHeldReq'],
        [1, 'wrapNative'],
        [2, 'swapAndBurn'],
      ] as const) {
        it(`blocks re-entry into ${label} from the router`, async () => {
          const evilRouter = await new MockReentrantRouter__factory(owner).deploy();
          await evilRouter.setTarget(target);
          const b = await deployBurner(req.address, evilRouter.address, weth.address, true);
          // The router must be a keeper for swapAndBurn re-entry to get past the keeper check.
          await b.connect(owner).setKeeper(evilRouter.address, true);
          await usdc.transfer(b.address, ONE);
          await req.transfer(b.address, ONE);

          await expect(
            b.connect(keeper).swapAndBurn([usdc.address, req.address], ONE, 1, deadline()),
          ).to.be.revertedWith('ReentrancyGuard: reentrant call');
        });
      }
    });
  });

  describe('burnHeldReq', () => {
    it('lets anyone burn REQ held by the contract', async () => {
      await req.transfer(burner.address, ONE.mul(7));
      const supplyBefore = await req.totalSupply();
      await expect(burner.connect(stranger).burnHeldReq())
        .to.emit(burner, 'ReqBurned')
        .withArgs(ONE.mul(7), ONE.mul(7));
      expect(await req.totalSupply()).to.equal(supplyBefore.sub(ONE.mul(7)));
    });

    it('reverts when there is nothing to burn', async () => {
      await expectCustomError(burner.connect(stranger).burnHeldReq(), 'NothingToBurn');
    });
  });

  describe('native fees', () => {
    it('accepts native fees and lets anyone wrap them, then they can be burned', async () => {
      await payer.sendTransaction({ to: burner.address, value: ONE });
      await expect(burner.connect(stranger).wrapNative())
        .to.emit(burner, 'NativeWrapped')
        .withArgs(ONE);
      expect(await weth.balanceOf(burner.address)).to.equal(ONE);
      expect(await ethers.provider.getBalance(burner.address)).to.equal(0);

      await burner
        .connect(keeper)
        .swapAndBurn([weth.address, req.address], ONE, ONE.mul(10), deadline());
      expect(await burner.totalReqBurned()).to.equal(ONE.mul(10));
    });

    it('reverts wrapNative when there is no native balance', async () => {
      await expectCustomError(burner.wrapNative(), 'ZeroAmount');
    });

    it('refuses native fees when no wrapped native token is configured', async () => {
      const b = await deployBurner(req.address, router.address, ZERO, true);
      await expectCustomError(
        payer.sendTransaction({ to: b.address, value: ONE }),
        'NativeFeesDisabled',
      );
      await expectCustomError(b.wrapNative(), 'NativeFeesDisabled');
    });
  });

  describe('integration with Request fee proxies', () => {
    it('receives ERC20FeeProxy fees and burns them as REQ', async () => {
      const feeProxy = await new ERC20FeeProxy__factory(owner).deploy();
      const amount = ONE.mul(1000);
      const fee = ONE.mul(5); // 50 bps
      await usdc.transfer(payerAddress, amount.add(fee));
      await usdc.connect(payer).approve(feeProxy.address, amount.add(fee));

      await feeProxy
        .connect(payer)
        .transferFromWithReferenceAndFee(
          usdc.address,
          strangerAddress,
          amount,
          '0xaaaa',
          fee,
          burner.address,
        );
      expect(await usdc.balanceOf(burner.address)).to.equal(fee);

      const supplyBefore = await req.totalSupply();
      await burner
        .connect(keeper)
        .swapAndBurn([usdc.address, req.address], fee, fee.mul(10), deadline());
      expect(await req.totalSupply()).to.equal(supplyBefore.sub(fee.mul(10)));
      expect(await usdc.balanceOf(burner.address)).to.equal(0);
    });

    it('receives EthereumFeeProxy fees (2300 gas stipend) and burns them as REQ', async () => {
      const ethFeeProxy = await new EthereumFeeProxy__factory(owner).deploy();
      const fee = ONE.div(100);
      await ethFeeProxy
        .connect(payer)
        .transferWithReferenceAndFee(strangerAddress, '0xbbbb', fee, burner.address, {
          value: ONE,
        });
      expect(await ethers.provider.getBalance(burner.address)).to.equal(fee);

      await burner.wrapNative();
      await burner
        .connect(keeper)
        .swapAndBurn([weth.address, req.address], fee, fee.mul(10), deadline());
      expect(await burner.totalReqBurned()).to.equal(fee.mul(10));
    });
  });

  describe('accounting', () => {
    it('accumulates totalReqBurned across burns', async () => {
      await usdc.transfer(burner.address, ONE.mul(3));
      for (let i = 0; i < 3; i++) {
        await burner
          .connect(keeper)
          .swapAndBurn([usdc.address, req.address], ONE, ONE.mul(10), deadline());
      }
      await req.transfer(burner.address, ONE);
      await burner.burnHeldReq();
      expect(await burner.totalReqBurned()).to.equal(ONE.mul(31));
      expect(BigNumber.from(await req.balanceOf(burner.address))).to.equal(0);
    });
  });
});
