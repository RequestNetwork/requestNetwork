"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Web3Sgl = require("../src/servicesExternal/web3-Single");
var RequestCoreJson = require("../src/artifacts/RequestCore.json");
var RequestEthereumJson = require("../src/artifacts/RequestEthereum.json");
var RequestSynchroneExtensionEscrowJson = require("../src/artifacts/RequestSynchroneExtensionEscrow.json");
var config = require('../src/config.json');
var web3Single = Web3Sgl.Web3Single.getInstance();
var instanceRequestCore = new web3Single.web3.eth.Contract(RequestCoreJson.abi);
var instanceRequestEthereum = new web3Single.web3.eth.Contract(RequestEthereumJson.abi);
var instanceSynchroneExtensionEscrow = new web3Single.web3.eth.Contract(RequestSynchroneExtensionEscrowJson.abi);
var addressRequestCore;
console.log("creator: " + config.ethereum.from);
instanceRequestCore.deploy({
    data: RequestCoreJson.bytecode,
})
    .send({
    from: config.ethereum.from,
    gas: 15000000
}, function (error, transactionHash) {
    if (error) {
        console.log('RequestCore - error transactionHash ##########################');
        console.log(error);
        console.log(transactionHash);
        console.log('RequestCore - error transactionHash ##########################');
    }
    // console.log('RequestCore - transactionHash : '+transactionHash);
})
    .on('error', function (error) {
    console.log('RequestCore - error transactionHash ##########################');
    console.log(error);
    console.log('RequestCore - error transactionHash ##########################');
})
    .then(function (newContractInstance) {
    addressRequestCore = newContractInstance.options.address;
    console.log('RequestCore - address : ' + newContractInstance.options.address); // instance with the new contract address
    instanceRequestEthereum.deploy({
        data: RequestEthereumJson.bytecode,
        arguments: [addressRequestCore]
    })
        .send({
        from: config.ethereum.from,
        gas: 15000000
    }, function (error, transactionHash) {
        if (error) {
            console.log('RequestEthereum - error transactionHash ##########################');
            console.log(error);
            console.log(transactionHash);
            console.log('RequestEthereum - error transactionHash ##########################');
        }
        // console.log('RequestCore - transactionHash : '+transactionHash);
    })
        .on('error', function (error) {
        console.log('RequestEthereum - error transactionHash ##########################');
        console.log(error);
        console.log('RequestEthereum - error transactionHash ##########################');
    })
        .then(function (newContractInstance) {
        console.log('RequestEthereum - address : ' + newContractInstance.options.address); // instance with the new contract address
        instanceSynchroneExtensionEscrow.deploy({
            data: RequestSynchroneExtensionEscrowJson.bytecode,
            arguments: [addressRequestCore]
        })
            .send({
            from: config.ethereum.from,
            gas: 15000000
        }, function (error, transactionHash) {
            if (error) {
                console.log('ExtensionEscrow - error transactionHash ##########################');
                console.log(error);
                console.log(transactionHash);
                console.log('ExtensionEscrow - error transactionHash ##########################');
            }
            // console.log('RequestCore - transactionHash : '+transactionHash);
        })
            .on('error', function (error) {
            console.log('ExtensionEscrow - error transactionHash ##########################');
            console.log(error);
            console.log('ExtensionEscrow - error transactionHash ##########################');
        })
            .then(function (newContractInstance) {
            console.log('ExtensionEscrow - address : ' + newContractInstance.options.address); // instance with the new contract address
        });
    });
});
//# sourceMappingURL=deploy.js.map