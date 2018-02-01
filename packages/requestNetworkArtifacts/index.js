const index = require('./index.json');

exports.default = function(networkName, address) {
	if(!index[networkName] || !index[networkName][address.toLowerCase()]) return null;
	return require('./'+index[networkName][address.toLowerCase()]);
}