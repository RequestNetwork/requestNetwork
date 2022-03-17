import { HardhatRuntimeEnvironment } from 'hardhat/types';

export interface IDeploymentParams {
  contract: string;
  constructorArgs?: Array<any>;
}

export type HardhatRuntimeEnvironmentExtended = HardhatRuntimeEnvironment & {
  config: {
    xdeploy: {
      networks: Array<string>;
      rpcUrls: Array<string>;
      salt: string;
      signer: string;
      deployerAddress: string;
      gasLimit?: number;
    };
  };
};

export interface IDeploymentResult {
  network: string;
  contract: string;
  address: string;
  receipt: any;
  deployed: boolean;
  error: Error | undefined;
}
