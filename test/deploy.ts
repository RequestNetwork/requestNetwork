import { Web3Single } from '../src/servicesExternal/web3-Single';

let RequestCoreJson = require("../src/artifacts/RequestCore.json");
let RequestEthereumJson = require("../src/artifacts/RequestEthereum.json");
let RequestSynchroneExtensionEscrowJson = require("../src/artifacts/RequestSynchroneExtensionEscrow.json");

const config = require('../src/config.json');


let web3Single = new Web3Single();

// let web3Single = Web3Sgl.Web3Single.getInstance();


let instanceRequestCore = new web3Single.web3.eth.Contract(RequestCoreJson.abi);
let instanceRequestEthereum = new web3Single.web3.eth.Contract(RequestEthereumJson.abi);
let instanceSynchroneExtensionEscrow = new web3Single.web3.eth.Contract(RequestSynchroneExtensionEscrowJson.abi);

let addressRequestCore;
let addressRequestEthereum;
let addressRequestExtensionEscrow;
let newContractInstanceRequestCore;
let newContractInstanceRequestEthereum;
let newContractInstanceRequestExtensionEscrow;

web3Single.getDefaultAccount().then(function(creator) {
    console.log("creator: " + creator);

    instanceRequestCore.deploy({
        data: RequestCoreJson.bytecode
    })
    .send({
        from: creator,
        gas: 15000000
    }, function(error, transactionHash) {
        if (error) {
            console.log('RequestCore - error transactionHash ##########################')
            console.log(error)
            console.log(transactionHash)
            console.log('RequestCore - error transactionHash ##########################')
        }
        // console.log('RequestCore - transactionHash : '+transactionHash);
    })
    .on('error', function(error) {
        console.log('RequestCore - error transactionHash ##########################')
        console.log(error)
        console.log('RequestCore - error transactionHash ##########################')
    })
    .then(function(newContractInstance) {
        addressRequestCore = newContractInstance.options.address;
        newContractInstanceRequestCore = newContractInstance;
        console.log('RequestCore - address : ' + newContractInstance.options.address) // instance with the new contract address

        instanceRequestEthereum.deploy({
                data: RequestEthereumJson.bytecode,
                arguments: [addressRequestCore]
            })
            .send({
                from: creator,
                gas: 15000000
            }, function(error, transactionHash) {
                if (error) {
                    console.log('RequestEthereum - error transactionHash ##########################')
                    console.log(error)
                    console.log(transactionHash)
                    console.log('RequestEthereum - error transactionHash ##########################')
                }
                // console.log('RequestCore - transactionHash : '+transactionHash);
            })
            .on('error', function(error) {
                console.log('RequestEthereum - error transactionHash ##########################')
                console.log(error)
                console.log('RequestEthereum - error transactionHash ##########################')
            })
            .then(function(newContractInstance) {
                console.log('RequestEthereum - address : ' + newContractInstance.options.address) // instance with the new contract address
                addressRequestEthereum = newContractInstance.options.address;
                newContractInstanceRequestEthereum = newContractInstance;

                instanceSynchroneExtensionEscrow.deploy({
                        data: RequestSynchroneExtensionEscrowJson.bytecode,
                        arguments: [addressRequestCore]
                    })
                    .send({
                        from: creator,
                        gas: 15000000
                    }, function(error, transactionHash) {
                        if (error) {
                            console.log('ExtensionEscrow - error transactionHash ##########################')
                            console.log(error)
                            console.log(transactionHash)
                            console.log('ExtensionEscrow - error transactionHash ##########################')
                        }
                        // console.log('RequestCore - transactionHash : '+transactionHash);
                    })
                    .on('error', function(error) {
                        console.log('ExtensionEscrow - error transactionHash ##########################')
                        console.log(error)
                        console.log('ExtensionEscrow - error transactionHash ##########################')
                    })
                    .then(function(newContractInstance) {
                        console.log('ExtensionEscrow - address : ' + newContractInstance.options.address) // instance with the new contract address
                        addressRequestExtensionEscrow = newContractInstance.options.address;
                        newContractInstanceRequestExtensionEscrow = newContractInstance;

                        web3Single.broadcastMethod(
                            newContractInstanceRequestCore.methods.adminAddTrustedSubContract(addressRequestEthereum),
                            (transactionHash: string) => {
                                // we do nothing here!
                            },
                            (receipt: any) => {
                                if (receipt.status == 1) {
                                    console.log('adminAddTrustedSubContract: ' + addressRequestEthereum);
                                }
                            },
                            (confirmationNumber: number, receipt: any) => {
                                // we do nothing here!
                            },
                            (error: Error) => {
                                console.log('adminAddTrustedSubContract - error ##########################')
                                console.log(error)
                                console.log('adminAddTrustedSubContract - error ##########################')
                            });


                        web3Single.broadcastMethod(
                            newContractInstanceRequestCore.methods.adminAddTrustedExtension(addressRequestExtensionEscrow),
                            (transactionHash: string) => {
                                // we do nothing here!
                            },
                            (receipt: any) => {
                                if (receipt.status == 1) {
                                    console.log('adminAddTrustedExtension: ' + addressRequestExtensionEscrow);
                                }
                            },
                            (confirmationNumber: number, receipt: any) => {
                                // we do nothing here!
                            },
                            (error: Error) => {
                                console.log('adminAddTrustedExtension - error ##########################')
                                console.log(error)
                                console.log('adminAddTrustedExtension - error ##########################')
                            });

                    });
            });

    });
});

