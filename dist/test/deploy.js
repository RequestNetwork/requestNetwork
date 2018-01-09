"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var addressContractBurner = 0;
var feesPerTenThousand = 10; // 0.1 %
var web3_Single_1 = require("../src/servicesExternal/web3-Single");
var requestCoreJson = require("../src/artifacts/RequestCore.json");
var requestEthereumJson = require("../src/artifacts/RequestEthereum.json");
var requestSynchroneExtensionEscrowJson = require("../src/artifacts/RequestSynchroneExtensionEscrow.json");
var requestBurnManagerSimple = require("../src/artifacts/requestBurnManagerSimple.json");
web3_Single_1.Web3Single.init("http://localhost:8545", 10000000000);
var web3Single = web3_Single_1.Web3Single.getInstance();
// let web3Single = Web3Sgl.Web3Single.getInstance();
var instanceRequestCore = new web3Single.web3.eth.Contract(requestCoreJson.abi);
var instanceRequestEthereum = new web3Single.web3.eth.Contract(requestEthereumJson.abi);
var instanceSynchroneExtensionEscrow = new web3Single.web3.eth.Contract(requestSynchroneExtensionEscrowJson.abi);
var instancerequestBurnManagerSimple = new web3Single.web3.eth.Contract(requestBurnManagerSimple.abi);
var addressRequestCore;
var addressRequestEthereum;
var addressRequestExtensionEscrow;
var addressrequestBurnManagerSimple;
var newContractInstanceRequestCore;
var newContractInstanceRequestEthereum;
var newContractInstanceRequestExtensionEscrow;
var newContractInstancerequestBurnManagerSimple;
web3Single.getDefaultAccount().then(function (creator) {
    console.log("creator: " + creator);
    instanceRequestCore.deploy({
        data: requestCoreJson.bytecode
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
            data: requestEthereumJson.bytecode,
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
                data: requestSynchroneExtensionEscrowJson.bytecode,
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
                instancerequestBurnManagerSimple.deploy({
                    data: requestBurnManagerSimple.bytecode,
                    arguments: [addressContractBurner]
                })
                    .send({
                    from: creator,
                    gas: 15000000
                }, function (error, transactionHash) {
                    if (error) {
                        console.log('requestBurnManagerSimple - error transactionHash ##########################');
                        console.log(error);
                        console.log(transactionHash);
                        console.log('requestBurnManagerSimple - error transactionHash ##########################');
                    }
                    // console.log('RequestCore - transactionHash : '+transactionHash);
                })
                    .on('error', function (error) {
                    console.log('requestBurnManagerSimple - error transactionHash ##########################');
                    console.log(error);
                    console.log('requestBurnManagerSimple - error transactionHash ##########################');
                })
                    .then(function (newContractInstance) {
                    console.log('requestBurnManagerSimple - address : ' + newContractInstance.options.address); // instance with the new contract address
                    addressrequestBurnManagerSimple = newContractInstance.options.address;
                    newContractInstancerequestBurnManagerSimple = newContractInstance;
                    web3Single.broadcastMethod(newContractInstancerequestBurnManagerSimple.methods.setFeesPerTenThousand(feesPerTenThousand), // 0.1 %
                    function (transactionHash) {
                        // we do nothing here!
                    }, function (receipt) {
                        if (receipt.status == 1) {
                            console.log('setFeesPerTenThousand: ' + feesPerTenThousand);
                        }
                    }, function (confirmationNumber, receipt) {
                        // we do nothing here!
                    }, function (error) {
                        console.log('setFeesPerTenThousand - error ##########################');
                        console.log(error);
                        console.log('setFeesPerTenThousand - error ##########################');
                    });
                    web3Single.broadcastMethod(newContractInstanceRequestCore.methods.setBurnManager(addressrequestBurnManagerSimple), function (transactionHash) {
                        // we do nothing here!
                    }, function (receipt) {
                        if (receipt.status == 1) {
                            console.log('setBurnManager: ' + addressrequestBurnManagerSimple);
                        }
                    }, function (confirmationNumber, receipt) {
                        // we do nothing here!
                    }, function (error) {
                        console.log('setBurnManager - error ##########################');
                        console.log(error);
                        console.log('setBurnManager - error ##########################');
                    });
                    web3Single.broadcastMethod(newContractInstanceRequestCore.methods.adminAddTrustedCurrencyContract(addressRequestEthereum), function (transactionHash) {
                        // we do nothing here!
                    }, function (receipt) {
                        if (receipt.status == 1) {
                            console.log('adminAddTrustedCurrencyContract: ' + addressRequestEthereum);
                        }
                    }, function (confirmationNumber, receipt) {
                        // we do nothing here!
                    }, function (error) {
                        console.log('adminAddTrustedCurrencyContract - error ##########################');
                        console.log(error);
                        console.log('adminAddTrustedCurrencyContract - error ##########################');
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
});
//# sourceMappingURL=deploy.js.map