const artifactsERC20Proxy = require('../../artifacts/ERC20Proxy/artifacts.json');
const ARTIFACTS_VERSION: string = artifactsERC20Proxy.lastVersion;

/**
 * Retrieve the abi from the artifact of the used version
 * @returns the abi of the artifact as a json object
 */
export function getContractAbi(): any {
  const artifactFilename: string = artifactsERC20Proxy[ARTIFACTS_VERSION].artifact;

  const artifact = require(`../../artifacts/ERC20Proxy/${artifactFilename.replace(
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
 * @returns the address of the deployed contract
 */
export function getAddress(networkName: string): string {
  return getDeploymentInformation(networkName).address;
}

/**
 * Retrieve the block creation number from the artifact of the used version
 * deployed into the specified network
 * @param networkName the name of the network where the contract is deployed
 * @returns the number of the block where the contract was deployed
 */
export function getCreationBlockNumber(networkName: string): number {
  return getDeploymentInformation(networkName).creationBlockNumber;
}

/**
 * Retrieve the deployment information from the artifact of the used version
 * deployed into the specified network
 * @param networkName the name of the network where the contract is deployed
 * @returns the deployment information of the contract as a json object containing address and the number of the creation block
 */
function getDeploymentInformation(
  networkName: string,
): { address: string; creationBlockNumber: number } {
  const deploymentInformation = artifactsERC20Proxy[ARTIFACTS_VERSION].deployment[networkName];

  // Check the artifact has been deployed into the specified network
  if (!deploymentInformation) {
    throw Error(`No deployment for network: ${networkName}`);
  }

  return deploymentInformation;
}
