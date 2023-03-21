import { Contract, providers, Signer } from 'ethers';
import type { JsonFragment } from '@ethersproject/abi';
import type { CurrencyTypes } from '@requestnetwork/types';

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
export type ArtifactDeploymentInfo<TNetwork extends CurrencyTypes.VMChainName> = {
  abi: JsonFragment[];
  deployment: Partial<Record<TNetwork, ArtifactNetworkInfo>>;
};

/** Deployment information and ABI per version and network */
export type ArtifactInfo<
  TVersion extends string = string,
  TNetwork extends CurrencyTypes.VMChainName = CurrencyTypes.VMChainName,
> = Record<TVersion, ArtifactDeploymentInfo<TNetwork>>;

export type DeploymentInformation = {
  address: string;
  creationBlockNumber: number;
};

/**
 * Provides information on a deployed smart-contract,
 * and utilities to connect to it
 **/
export class ContractArtifact<TContract extends Contract> {
  constructor(private info: ArtifactInfo, private lastVersion: string) {
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
    networkName: CurrencyTypes.EvmChainName,
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
  getAddress(networkName: CurrencyTypes.VMChainName, version = this.lastVersion): string {
    return this.getDeploymentInformation(networkName, version).address;
  }

  /**
   * Retrieve all addresses for all versions
   * @param networkName the name of the network where the contract is deployed
   * @returns the addresses of the deployed contract and the associated version.
   */
  getAllAddresses(
    networkName: CurrencyTypes.VMChainName,
  ): { version: string; address: string | undefined }[] {
    const entries = Object.entries(this.info);
    return entries.map(([version, { deployment }]) => ({
      version,
      address: deployment[networkName]?.address,
    }));
  }

  /**
   * Retrieve all addresses for all versions for all networks
   * @returns the addresses of the deployed contract and the associated network and version.
   */
  getAllAddressesFromAllNetworks(): {
    version: string;
    address: string;
    networkName: CurrencyTypes.VMChainName;
  }[] {
    const deployments = [];
    for (const version in this.info) {
      let networkName: CurrencyTypes.VMChainName;
      for (networkName in this.info[version].deployment) {
        const address = this.info[version].deployment[networkName]?.address;
        if (!address) continue;
        deployments.push({
          version,
          address,
          networkName,
        });
      }
    }
    return deployments;
  }

  /**
   * Retrieve the block creation number from the artifact of the used version
   * deployed into the specified network
   * @param networkName the name of the network where the contract is deployed
   * @returns the number of the block where the contract was deployed
   */
  getCreationBlockNumber(
    networkName: CurrencyTypes.VMChainName,
    version = this.lastVersion,
  ): number {
    return this.getDeploymentInformation(networkName, version).creationBlockNumber;
  }

  /**
   * Retrieve the deployment information from the artifact of the used version
   * deployed into the specified network. Will trow an error if the version of network is incorrect.
   * @param networkName the name of the network where the contract is deployed
   * @returns The address and the number of the creation block
   */
  getDeploymentInformation(
    networkName: CurrencyTypes.VMChainName,
    version = this.lastVersion,
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
    networkName: CurrencyTypes.VMChainName,
    version = this.lastVersion,
  ): DeploymentInformation | null {
    console.debug(this.info, version, networkName);
    return this.info[version]?.deployment[networkName] || null;
  }
}
