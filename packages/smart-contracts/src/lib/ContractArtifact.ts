import { Contract, providers, Signer } from 'ethers';
import type { JsonFragment } from '@ethersproject/abi';

/**
 * Contract information specific to a network
 */
export type ArtifactNetworkInfo = {
  /** Contract's address */
  address: string;
  /** Block number at which the contract was created */
  creationBlockNumber: number;
};

/** Deployment information and ABI per network */
export type ArtifactDeploymentInfo<TNetwork extends string = string> = {
  abi: JsonFragment[];
  deployment: Record<TNetwork, ArtifactNetworkInfo>;
};

/** Deployment information and ABI per version and network */
export type ArtifactInfo<
  TVersion extends string = string,
  TNetwork extends string = string
> = Record<TVersion, ArtifactDeploymentInfo<TNetwork>>;

/**
 * Provides information on a deployed smart-contract,
 * and utilities to connect to it
 **/
export class ContractArtifact<TContract extends Contract> {
  constructor(private info: ArtifactInfo<string, string>, private lastVersion: string) {
    this.connect = this.connect.bind(this);
    this.getInterface = this.getInterface.bind(this);
    this.getContractAbi = this.getContractAbi.bind(this);
    this.getAddress = this.getAddress.bind(this);
    this.getCreationBlockNumber = this.getCreationBlockNumber.bind(this);
    this.getDeploymentInformation = this.getDeploymentInformation.bind(this);
  }

  /**
   * Returns an ethers contract instance for the given `networkName`
   */
  connect(
    networkName: string,
    signerOrProvider: Signer | providers.Provider,
    version: string = this.lastVersion,
  ): TContract {
    return new Contract(
      this.getAddress(networkName, version),
      this.getContractAbi(version),
      signerOrProvider,
    ) as TContract;
  }

  getInterface(): TContract['interface'] {
    return Contract.getInterface(this.getContractAbi());
  }

  /**
   * Retrieve the abi from the artifact of the used version
   * @returns the abi of the artifact as a json object
   */
  getContractAbi(version = this.lastVersion): JsonFragment[] {
    return this.info[version].abi;
  }

  /**
   * Retrieve the address from the artifact of the used version
   * deployed into the specified network
   * @param networkName the name of the network where the contract is deployed
   * @returns the address of the deployed contract
   */
  getAddress(networkName: string, version = this.lastVersion): string {
    return this.getDeploymentInformation(networkName, version).address;
  }

  /**
   * Retrieve the block creation number from the artifact of the used version
   * deployed into the specified network
   * @param networkName the name of the network where the contract is deployed
   * @returns the number of the block where the contract was deployed
   */
  getCreationBlockNumber(networkName: string, version = this.lastVersion): number {
    return this.getDeploymentInformation(networkName, version).creationBlockNumber;
  }

  /**
   * Retrieve the deployment information from the artifact of the used version
   * deployed into the specified network
   * @param networkName the name of the network where the contract is deployed
   * @returns the deployment information of the contract as a json object containing address and the number of the creation block
   */
  getDeploymentInformation(
    networkName: string,
    version = this.lastVersion,
  ): { address: string; creationBlockNumber: number } {
    const info = this.info[version].deployment[networkName];
    // Check the artifact has been deployed into the specified network
    if (!info) {
      throw Error(`No deployment for network: ${networkName}`);
    }
    return info;
  }
}
