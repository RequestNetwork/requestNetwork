// import { ethers, network } from 'hardhat';
// import { BigNumber, Signer } from 'ethers';
// import { expect, use } from 'chai';
// import { solidity } from 'ethereum-waffle';
// import { EthereumFeeProxy } from '../../src/types';
// import { ethereumProxyArtifact } from '../../src/lib/';

// use(solidity);

// describe('contract: EthereumFeeProxy', () => {
//   let from: string;
//   let to: string;
//   let signer: Signer;
//   let ethFeeProxy: EthereumFeeProxy;
//   const referenceExample = '0xaaaa';
//   const DEFAULT_GAS_PRICE = ethers.BigNumber.from('100000000000');
//   const amount = ethers.BigNumber.from('10000000000000000');
//   const provider = new ethers.providers.JsonRpcProvider();

//   before(async () => {
//     [from, to] = (await ethers.getSigners()).map((s) => s.address);
//     [signer] = await ethers.getSigners();
//     ethFeeProxy = ethereumProxyArtifact.connect(network.name, signer);
//   });

//   it('allows to store a reference', async () => {
//     await expect(
//       ethFeeProxy.transferFromWithReferenceAndFee(to, referenceExample, {
//         value: amount,
//       }),
//     )
//       .to.emit(ethFeeProxy, 'TransferWithReferenceAndFee')
//       .withArgs(to, amount.toString(), ethers.utils.keccak256(referenceExample));
//   });

//   it('allows to transfer ethers', async () => {
//     const fromOldBalance = await provider.getBalance(from);
//     const toOldBalance = await provider.getBalance(to);

//     const receipt = await (
//       await ethFeeProxy.transferFromWithReferenceAndFee(to, referenceExample, {
//         value: amount,
//         gasPrice: DEFAULT_GAS_PRICE,
//       })
//     ).wait();

//     const gasCost = DEFAULT_GAS_PRICE.mul(BigNumber.from(receipt.gasUsed));

//     const fromNewBalance = await provider.getBalance(from);
//     const toNewBalance = await provider.getBalance(to);

//     // Check balance changes
//     expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(gasCost).sub(amount).toString());
//     expect(toNewBalance.toString()).to.equals(toOldBalance.add(amount).toString());
//   });
// });
