const artifactsEthereumProxy = require('../../artifacts/EthereumProxy/artifacts.json');
const ARTIFACTS_VERSION: string = artifactsEthereumProxy.lastVersion;

/**
 * Retrieve the abi from the artifact of the used version
 * @param version version of the contract
 * @returns the abi of the artifact as a json object
 */
export function getContractAbi(version?: string): any {
  const artifactObject: any = artifactsEthereumProxy[version || ARTIFACTS_VERSION];
  if (!artifactObject) {
    throw Error(`No artifact found for version ${version || ARTIFACTS_VERSION}`);
  }
  const artifactFilename: string = artifactObject.artifact;

  const artifact = require(`../../artifacts/EthereumProxy/${artifactFilename.replace(
    /\.[^/.]+$/,
    '',
  )}.json`);

  // Check the abi exists inside the artifact file
  if (!artifact.abi) {
    throw Error(`No abi in artifact ${artifactFilename}`);
  }

  return artifact.abi;
}

/**
 * Retrieve the address from the artifact of the used version
 * deployed into the specified network
 * @param networkName the name of the network where the contract is deployed
 * @param version version of the contract
 * @returns the address of the deployed contract
 */
export function getAddress(networkName: string, version?: string): string {
  return getDeploymentInformation(networkName, version).address;
}

/**
 * Retrieve the block creation number from the artifact of the used version
 * deployed into the specified network
 * @param networkName the name of the network where the contract is deployed
 * @param version version of the contract
 * @returns the number of the block where the contract was deployed
 */
export function getCreationBlockNumber(networkName: string, version?: string): number {
  return getDeploymentInformation(networkName, version).creationBlockNumber;
}

/**
 * Retrieve the deployment information from the artifact of the used version
 * deployed into the specified network
 * @param networkName the name of the network where the contract is deployed
 * @param version version of the contract
 * @returns the deployment information of the contract as a json object containing address and the number of the creation block
 */
function getDeploymentInformation(
  networkName: string,
  version?: string,
): { address: string; creationBlockNumber: number } {
  const artifactObject: any = artifactsEthereumProxy[version || ARTIFACTS_VERSION];
  if (!artifactObject) {
    throw Error(`No artifact found for version ${version || ARTIFACTS_VERSION}`);
  }
  const deploymentInformation = artifactObject.deployment[networkName];

  // Check the artifact has been deployed into the specified network
  if (!deploymentInformation) {
    throw Error(`No deployment for network: ${networkName}`);
  }

  return deploymentInformation;
}
