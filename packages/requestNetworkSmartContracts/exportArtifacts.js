// Core + ETH currency contract
const artifacts = ['RequestCore', 'RequestEthereum', 'RequestERC20', 'RequestBitcoinNodesValidation'];

const PACKAGE = require('./package.json');
const fs = require('fs');
const assert = require('assert');

// Output of truffle compile
const BUILD_DIR = './build/contracts/';

// Output of this script
const EXPORT_DIR = './export/';

// Checks that the input contracts have been generated
const contractHaveBeenCompiled = fs.readdirSync(BUILD_DIR).find(file => file.includes('.json'));
assert(contractHaveBeenCompiled, `No json compiled file found in ${BUILD_DIR}. Did you run \`truffle compile?\``);

fs.mkdirSync(EXPORT_DIR);
fs.mkdirSync(EXPORT_DIR+'test/');
fs.mkdirSync(EXPORT_DIR+'prod/');

// Takes the export of `truffle compile` and add and remove some information
// Manually executed
artifacts.forEach(function(name) {
	const artifact = require(BUILD_DIR+name+'.json');

	let artifactForTestExported = {
		contractName: artifact.contractName,
		abi: artifact.abi,

		bytecode: artifact.bytecode,
		compiler: artifact.compiler,
		version: PACKAGE.version,
		networks: {
			private: {
				address: '',
				blockNumber: 0,
			}
		}
	};

	let artifactForProdExported = {
		contractName: artifact.contractName,
		abi: artifact.abi,
		version: PACKAGE.version,
		networks: {
			rinkeby: {
				address: '',
				blockNumber: 0,
			}
		}
	};
	
	const nameTest = EXPORT_DIR+'test/'+name+'-'+PACKAGE.version+'-test.json';
	fs.writeFile(nameTest, JSON.stringify(artifactForTestExported, null, 2), function(err) {
		if(err) {
			return console.log(err);
		}
		console.log(nameTest+' saved!');
	}); 
	
	const nameProd = EXPORT_DIR+'prod/'+name+'-'+PACKAGE.version+'-prod.json';
	fs.writeFile(nameProd, JSON.stringify(artifactForProdExported, null, 2), function(err) {
		if(err) {
			return console.log(err);
		}
		console.log(nameProd+' saved!');
	}); 
});
