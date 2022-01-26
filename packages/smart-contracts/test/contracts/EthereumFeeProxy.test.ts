import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { EthereumFeeProxy } from '../../src/types';
import { ethereumFeeProxyArtifact } from '../../src/lib/';
import { HttpNetworkConfig } from 'hardhat/types';

use(solidity);

describe('contract: EthereumFeeProxy', () => {
  let to: string;
  let signer: Signer;
  let ethFeeProxy: EthereumFeeProxy;
  const referenceExample = '0xaaaa';
  const amount = BigNumber.from('10000000000000000');
  const feeAmount = BigNumber.from('2000000000000000');
  const networkConfig = network.config as HttpNetworkConfig;
  const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);
  const feeAddress = '0xF4255c5e53a08f72b0573D1b8905C5a50aA9c2De';

  before(async () => {
    [, to] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();
    ethFeeProxy = ethereumFeeProxyArtifact.connect(network.name, signer);
  });

  it('allows to pays with a reference', async () => {
    const toOldBalance = await provider.getBalance(to);
    const feeAddressOldBalance = await provider.getBalance(feeAddress);

    await expect(
      ethFeeProxy.transferWithReferenceAndFee(to, referenceExample, feeAmount, feeAddress, {
        value: amount.add(feeAmount),
      }),
    )
      .to.emit(ethFeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        to,
        amount.toString(),
        ethers.utils.keccak256(referenceExample),
        feeAmount.toString(),
        feeAddress,
      );

    const toNewBalance = await provider.getBalance(to);
    const feeAddressNewBalance = await provider.getBalance(feeAddress);
    const contractBalance = await provider.getBalance(ethFeeProxy.address);

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
      ethFeeProxy.transferExactEthWithReferenceAndFee(
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
      .to.emit(ethFeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        to,
        amount.toString(),
        ethers.utils.keccak256(referenceExample),
        feeAmount.toString(),
        feeAddress,
      );

    const toNewBalance = await provider.getBalance(to);
    const feeAddressNewBalance = await provider.getBalance(feeAddress);
    const contractBalance = await provider.getBalance(ethFeeProxy.address);

    // Check balance changes
    expect(toNewBalance.toString()).to.equals(toOldBalance.add(amount).toString());
    expect(feeAddressNewBalance.toString()).to.equals(
      feeAddressOldBalance.add(feeAmount).toString(),
    );
    expect(contractBalance.toString()).to.equals('0');
  });

  it('cannot transfer if msg.value is too low', async () => {
    await expect(
      ethFeeProxy.transferWithReferenceAndFee(to, referenceExample, amount, feeAddress, {
        value: feeAmount,
      }),
    ).to.be.revertedWith('revert');
  });
});
