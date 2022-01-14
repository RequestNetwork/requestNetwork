import { ethers, network } from 'hardhat';
import { Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { EthereumProxy } from '../../src/types';
import { ethereumProxyArtifact } from '../../src/lib/';
import { HttpNetworkConfig } from 'hardhat/types';

use(solidity);

describe('contract: EthereumProxy', () => {
  let from: string;
  let to: string;
  let signer: Signer;
  let ethProxy: EthereumProxy;
  const referenceExample = '0xaaaa';
  const DEFAULT_GAS_PRICE = ethers.BigNumber.from('100000000000');
  const amount = ethers.BigNumber.from('10000000000000000');
  const networkConfig = network.config as HttpNetworkConfig
  const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);


  before(async () => {
    [from, to] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();
    ethProxy = ethereumProxyArtifact.connect(network.name, signer);
  });

  it('allows to store a reference', async () => {
    await expect(
      ethProxy.transferWithReference(to, referenceExample, {
        value: amount,
      }),
    )
      .to.emit(ethProxy, 'TransferWithReference')
      .withArgs(to, amount.toString(), ethers.utils.keccak256(referenceExample));
  });

  it('allows to transfer ethers', async () => {
    const fromOldBalance = await provider.getBalance(from);
    const toOldBalance = await provider.getBalance(to);

    await (
      await ethProxy.transferWithReference(to, referenceExample, {
        value: amount,
        gasPrice: DEFAULT_GAS_PRICE,
      })
    ).wait();

    const fromNewBalance = await provider.getBalance(from);
    const toNewBalance = await provider.getBalance(to);

    // Check balance changes
    expect(fromNewBalance).to.be.lt(fromOldBalance.sub(amount));
    expect(toNewBalance.toString()).to.equals(toOldBalance.add(amount).toString());
  });
});
