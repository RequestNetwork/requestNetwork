import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { XdeployConfig } from 'xdeployer/src/types';

export type HardhatRuntimeEnvironmentExtended = HardhatRuntimeEnvironment & {
  config: {
    xdeploy: XdeployConfig;
  };
};

export interface IDeploymentParams {
  contract: string;
  constructorArgs?: Array<any>;
}

/**
 * List of smart contract that we deploy using the CREATE2 scheme thourhg the Request Deployer contract
 */
export const create2ContractDeploymentList = ['EthereumProxy', 'EthereumFeeProxy'];
