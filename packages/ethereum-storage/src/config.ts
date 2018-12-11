const config = require('../config.json');
const requestHashStorageJson = require('../RequestHashStorage.json');

// Importing hash storage contract abi
config.ethereum.contracts.RequestHashStorage.abi = requestHashStorageJson.abi;

export default config;
