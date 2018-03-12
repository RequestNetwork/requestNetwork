const artifacts = require('./artifacts.js');

// Entry point for the package. Call this function from outside to get an artifact on a network and at an address
// The artifacts are stored in folders like RequestCore and RequestEthereum
// artifacts.js serves at mapping (network, address) => artifact
exports.default = function(networkName, address) {
	const artifact = artifacts[networkName] && artifacts[networkName][address.toLowerCase()];
	if(!artifact) {
		// TODO: Throw
		return null;
	}

	return require(`./${artifact}`);
}
