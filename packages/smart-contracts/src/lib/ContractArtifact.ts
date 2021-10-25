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

export type DeploymentInformation = {
  address: string;
  creationBlockNumber: number;
};

/**
 * Provides information on a deployed smart-contract,
 * and utilities to connect to it
 **/
export class ContractArtifact<
  TContract extends Contract,
  TVersion extends string = string,
  TNetwork extends string = string
> {
  constructor(private info: ArtifactInfo<TVersion, TNetwork>, private lastVersion: TVersion) {
    this.connect = this.connect.bind(this);
    this.getInterface = this.getInterface.bind(this);
    this.getContractAbi = this.getContractAbi.bind(this);
    this.getAddress = this.getAddress.bind(this);
    this.getCreationBlockNumber = this.getCreationBlockNumber.bind(this);
    this.getDeploymentInformation = this.getDeploymentInformation.bind(this);
    this.getAllAddresses = this.getAllAddresses.bind(this);
    this.getOptionalDeploymentInformation = this.getOptionalDeploymentInformation.bind(this);
  }

  /**
   * Returns an ethers contract instance for the given `networkName`
   */
  connect(
    networkName: TNetwork,
    signerOrProvider: Signer | providers.Provider,
    version: TVersion = this.lastVersion,
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
  getAddress(networkName: TNetwork, version = this.lastVersion): string {
    return this.getDeploymentInformation(networkName, version).address;
  }

  /**
   * Retrieve all addresses for all versions
   * @param networkName the name of the network where the contract is deployed
   * @returns the addresses of the deployed contract and the associated version.
   */
  getAllAddresses(networkName: TNetwork): { version: TVersion; address: string }[] {
    const entries = Object.entries(this.info) as [TVersion, ArtifactDeploymentInfo<TNetwork>][];

    return entries.map(([version, { deployment }]) => ({
      version,
      address: deployment[networkName].address,
    }));
  }

  /**
   * Retrieve the block creation number from the artifact of the used version
   * deployed into the specified network
   * @param networkName the name of the network where the contract is deployed
   * @returns the number of the block where the contract was deployed
   */
  getCreationBlockNumber(networkName: TNetwork, version = this.lastVersion): number {
    return this.getDeploymentInformation(networkName, version).creationBlockNumber;
  }

  /**
   * Retrieve the deployment information from the artifact of the used version
   * deployed into the specified network. Will trow an error if the version of network is incorrect.
   * @param networkName the name of the network where the contract is deployed
   * @returns The address and the number of the creation block
   */
  getDeploymentInformation(
    networkName: TNetwork,
    version: TVersion = this.lastVersion,
  ): DeploymentInformation {
    const versionInfo = this.info[version];
    if (!versionInfo) {
      throw Error(`No deployment for version: ${version}.`);
    }
    const info = versionInfo.deployment[networkName];
    // Check the artifact has been deployed into the specified network
    if (!info) {
      throw Error(`No deployment for network: ${networkName}.`);
    }
    return info;
  }

  /**
   * Retrieve the deployment information from the artifact of the used version
   * deployed into the specified network
   * @param networkName the name of the network where the contract is deployed
   * @returns The address and the number of the creation block, or null if not found
   */
  getOptionalDeploymentInformation(
    networkName: TNetwork,
    version = this.lastVersion,
  ): DeploymentInformation | null {
    return this.info[version]?.deployment[networkName] || null;
  }
}
