import '@nomiclabs/hardhat-ethers';
import { deployOne } from '../utils/deploy-one';
import { ethers } from 'hardhat';

export interface ERC20Addresses {
  BadERC20Address: string;
  ERC20TrueAddress: string;
  ERC20FalseAddress: string;
  ERC20NoReturnAddress: string;
  ERC20RevertAddress: string;
  ERC20TestAddress: string;
  ERC20UsdtAddress: string;
}

// Deploys, set up the contracts
export const setupERC20 = async (): Promise<ERC20Addresses> => {
  const erc20Factory = await ethers.getContractFactory('TestERC20');

  // Deploy the ERC20 contract
  const testERC20Instance = await erc20Factory.deploy('1000000000000000000000000000000');

  // Deploy the BadERC20 contract
  const { address: BadERC20Address } = await deployOne('BadERC20', {
    constructorArguments: [1000, 'BadERC20', 'BAD', 8],
  });

  // Deploy test ERC20 contracts
  const { address: ERC20TrueAddress } = await deployOne('ERC20True');

  const { address: ERC20FalseAddress } = await deployOne('ERC20False');

  const { address: ERC20NoReturnAddress } = await deployOne('ERC20NoReturn');

  const { address: ERC20RevertAddress } = await deployOne('ERC20Revert');

  // Deploy the USDT-like contract
  const { address: ERC20UsdtAddress } = await deployOne('UsdtFake');

  return {
    BadERC20Address,
    ERC20TrueAddress,
    ERC20FalseAddress,
    ERC20NoReturnAddress,
    ERC20RevertAddress,
    ERC20TestAddress: testERC20Instance.address,
    ERC20UsdtAddress,
  };
};
