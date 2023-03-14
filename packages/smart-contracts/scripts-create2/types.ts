import { HardhatRuntimeEnvironment } from 'hardhat/types';

export interface IDeploymentParams {
  contract: string;
  constructorArgs?: Array<any>;
}

export type HardhatRuntimeEnvironmentExtended = HardhatRuntimeEnvironment & {
  config: {
    xdeploy: {
      networks: Array<string>;
      salt: string;
      signer: string;
      deployerAddress: string;
      gasLimit?: number;
    };
    tenderly: {
      project: string;
      username: string;
      accessKey: string;
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
