const artifacts = require('./artifacts.json');

// Entry point for the package, exports the artifacts to the outside.
// Call this function to get an artifact on a network and at an address
// The artifacts are stored in folders like RequestCore and RequestEthereum
// artifacts.json serves at mapping (network, address) => artifact
exports.default = function(networkName, address) {
	const artifact = artifacts[networkName] && artifacts[networkName][address.toLowerCase()];
	if (!artifact) {
		return null;
	}

  // Webpack will try to parse the whole folder if we don't explicitly add .json on the require call, so we have to strip the file extension
  const artifactName = artifact.replace(/\.[^/.]+$/, '');

	return require(`./${artifactName}.json`);
}

// Temporary hack that should be properly fixed. Needs some refactor to remove the default export
exports.default.getAllArtifactsForNetwork = function(networkName) {
	return artifacts[networkName];
}

// Temporary hack that should be properly fixed. Needs some refactor to remove the default export
// Returns the contract name of an address, like 'RequestEthereum','RequestBitcoinNodesValidation','RequestERC20-req','RequestERC20-knc'
exports.default.getContractNameForAddress = function(contractAddress) {
	const artifactPath = Object.keys(artifacts).reduce(
		(result, network) =>  result || artifacts[network][contractAddress],
		''
    );
    if (!artifactPath) {
        return null;
    }

    let contractName = artifactPath.split('/')[0];
    
    // Handle ERC20
    if (contractName === 'RequestERC20') {
        const dashSections = artifactPath.split('.json')[0].split('-');
        const erc20currencyName = dashSections[dashSections.length-2];
        contractName = `${contractName}-${erc20currencyName}`;
    }

    return contractName;
}
