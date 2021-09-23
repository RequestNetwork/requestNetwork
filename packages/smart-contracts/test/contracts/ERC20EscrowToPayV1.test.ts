import { ethers } from 'hardhat';
import { 
  ERC20EscrowToPayV1__factory,
  ERC20FeeProxy__factory,
  ERC20FeeProxy,
  ERC20EscrowToPayV1,
  TestERC20__factory, 
} from '../../src/types';
import { Contract, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';

use(solidity);

describe('contract: ERC20EscrowToPayV1', () => {
  const referenceExample1 = '0xaaaa';
  const referenceExample2 = '0xbbbb';
  let feeAddress: '0xF4255c5e53a08f72b0573D1b8905C5a50aA9c2De';
  let from: string;
  let to: string;
  let signer: Signer;
  let erc20FeeProxy: ERC20FeeProxy;
  let erc20EscrowToPay: ERC20EscrowToPayV1;
  let testERC20: Contract;

  before(async () => {
    [from, to] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();
    
    erc20FeeProxy = await new ERC20FeeProxy__factory(signer).deploy();
    erc20EscrowToPay = await new ERC20EscrowToPayV1__factory(signer).deploy(erc20FeeProxy.address);
  });
  beforeEach(async () => {
    testERC20 = await new TestERC20__factory(signer).deploy(1000000);
  });
  it('allows to store a reference and fee', async function () {
    await testERC20.approve(erc20EscrowToPay.address, '1010');

    expect(
      await erc20EscrowToPay.openEscrow(
        referenceExample1,
        testERC20.address, 
        '1000',
        to,
        '10',
        feeAddress,
      ),
    )
      .to.emit(erc20EscrowToPay, 'OpenEscrow')
      .withArgs(
        ethers.utils.keccak256(referenceExample1),
        testERC20.address,
        '1000',
        to,
        '10',
        feeAddress,
      );
  });

  it('opens an Escrow and transfers tokens for payment and fees', async function () {

    await testERC20.connect(from).approve(erc20FeeProxy.address, '202');

    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);

    await erc20FeeProxy.transferFromWithReferenceAndFee(
      testERC20.address,
      to,
      '200',
      referenceExample2,
      '2',
      feeAddress,
    );

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(202).toString());
    expect(toNewBalance.toString()).to.equals(toOldBalance.add(200).toString());
    expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(2).toString());
  });

  it('should revert if no allowance', async function () {
    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);

    expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '2000',
        referenceExample1,
        '20',
        feeAddress,
      ),
    ).to.be.reverted;

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.toString(), 'Payer balance changed');
    expect(toNewBalance.toString()).to.equals(toOldBalance.toString(), 'Issuer balance changed');
    expect(feeNewBalance.toString()).to.equals(
      feeOldBalance.toString(),
      'Fee account balance changed',
    );
  });
});
