const artifacts = require('./artifacts.json');

// Entry point for the package. Call this function from outside to get an artifact on a network and at an address
// The artifacts are stored in folders like RequestCore and RequestEthereum
// artifacts.json serves at mapping (network, address) => artifact
exports.default = function(networkName, address) {
	const artifact = artifacts[networkName] && artifacts[networkName][address.toLowerCase()];
	if (!artifact) {
		return null;
	}

	return require(`./${artifact}`);
}

// Temporary hack that should be properly fixed. Needs some refactor to remove the default export
exports.default.getAllArtifactsForNetwork = function(networkName) {
	return artifacts[networkName];
}
