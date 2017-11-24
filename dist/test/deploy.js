"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var web3_Single_1 = require("../src/servicesExternal/web3-Single");
var RequestCoreJson = require("../src/artifacts/RequestCore.json");
var RequestEthereumJson = require("../src/artifacts/RequestEthereum.json");
var RequestSynchroneExtensionEscrowJson = require("../src/artifacts/RequestSynchroneExtensionEscrow.json");
var config = require('../src/config.json');
var web3Single = new web3_Single_1.Web3Single();
// let web3Single = Web3Sgl.Web3Single.getInstance();
var instanceRequestCore = new web3Single.web3.eth.Contract(RequestCoreJson.abi);
var instanceRequestEthereum = new web3Single.web3.eth.Contract(RequestEthereumJson.abi);
var instanceSynchroneExtensionEscrow = new web3Single.web3.eth.Contract(RequestSynchroneExtensionEscrowJson.abi);
var addressRequestCore;
var addressRequestEthereum;
var addressRequestExtensionEscrow;
var newContractInstanceRequestCore;
var newContractInstanceRequestEthereum;
var newContractInstanceRequestExtensionEscrow;
web3Single.getDefaultAccount().then(function (creator) {
    console.log("creator: " + creator);
    instanceRequestCore.deploy({
        data: RequestCoreJson.bytecode
    })
        .send({
        from: creator,
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
        newContractInstanceRequestCore = newContractInstance;
        console.log('RequestCore - address : ' + newContractInstance.options.address); // instance with the new contract address
        instanceRequestEthereum.deploy({
            data: RequestEthereumJson.bytecode,
            arguments: [addressRequestCore]
        })
            .send({
            from: creator,
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
            addressRequestEthereum = newContractInstance.options.address;
            newContractInstanceRequestEthereum = newContractInstance;
            instanceSynchroneExtensionEscrow.deploy({
                data: RequestSynchroneExtensionEscrowJson.bytecode,
                arguments: [addressRequestCore]
            })
                .send({
                from: creator,
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
                addressRequestExtensionEscrow = newContractInstance.options.address;
                newContractInstanceRequestExtensionEscrow = newContractInstance;
                web3Single.broadcastMethod(newContractInstanceRequestCore.methods.adminAddTrustedSubContract(addressRequestEthereum), function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    if (receipt.status == 1) {
                        console.log('adminAddTrustedSubContract: ' + addressRequestEthereum);
                    }
                }, function (confirmationNumber, receipt) {
                    // we do nothing here!
                }, function (error) {
                    console.log('adminAddTrustedSubContract - error ##########################');
                    console.log(error);
                    console.log('adminAddTrustedSubContract - error ##########################');
                });
                web3Single.broadcastMethod(newContractInstanceRequestCore.methods.adminAddTrustedExtension(addressRequestExtensionEscrow), function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    if (receipt.status == 1) {
                        console.log('adminAddTrustedExtension: ' + addressRequestExtensionEscrow);
                    }
                }, function (confirmationNumber, receipt) {
                    // we do nothing here!
                }, function (error) {
                    console.log('adminAddTrustedExtension - error ##########################');
                    console.log(error);
                    console.log('adminAddTrustedExtension - error ##########################');
                });
            });
        });
    });
});
//# sourceMappingURL=deploy.js.map