import { ethers } from 'hardhat';
import { BytesUtilsMock__factory } from '../../types';
import { expect, use } from 'chai';
import { Contract } from 'ethers';
import { solidity } from 'ethereum-waffle';

use(solidity);

describe('contract: Bytes Utils', async () => {
  let bytesUtils: Contract;

  before(async () => {
    const [signer] = await ethers.getSigners();
    const factory = await new BytesUtilsMock__factory(signer);
    bytesUtils = await factory.deploy();
  });

  it('extractBytes32 works correctly', async () => {
    const rawHexBytes32 = 'abc0000000000000000000000000000000000000000000000000000000000def';
    const expectedBytes32 = `0x${rawHexBytes32}`;

    await bytesUtils.extractBytes32(`0x${rawHexBytes32}`, 0);
    let result = await bytesUtils.extractBytes32Result();
    expect(result).equal(expectedBytes32);

    await bytesUtils.extractBytes32(`0x9999${rawHexBytes32}BBBB`, 2);
    result = await bytesUtils.extractBytes32Result();
    expect(result).equal(expectedBytes32);
  });
});
