const addressContractBurner = 0;
const feesPerTenThousand = 10; // 0.1 %
const maxFees = '120000000000000'; // 0.00012 ether in wei
const tokenMintAtStart = '100000000000000000000000000000000000000000000000000000000';

import requestArtifacts from 'requestnetworkartifacts';
import TestToken from '../test/centralBank';

import { Web3Single } from '../src/servicesExternal/web3-single';

const requestCoreJson = requestArtifacts('private', 'last-RequestCore');
const requestEthereumJson = requestArtifacts('private', 'last-RequestEthereum');
const requestERC20Json = requestArtifacts('private', 'last-RequestErc20-0x345ca3e014aaf5dca488057592ee47305d9b3e10');



Web3Single.init('http://localhost:8545', 10000000000);
const web3Single = Web3Single.getInstance();

const instanceRequestCore = new web3Single.web3.eth.Contract(requestCoreJson.abi);
const instanceRequestEthereum = new web3Single.web3.eth.Contract(requestEthereumJson.abi);
const instanceRequestERC20 = new web3Single.web3.eth.Contract(requestERC20Json.abi);
const instanceERC20TestToken = new web3Single.web3.eth.Contract(TestToken.abi);

let addressRequestCore: string;
let addressRequestEthereum: string;
let addressRequestERC20: string;

let addressCentralBank: string;


let newContractInstanceRequestCore: any;
let newContractInstanceRequestEthereum: any;
let newContractInstanceRequestERC20: any;

web3Single.getDefaultAccount().then((creator) => {
    console.log('creator: ' + creator);


    instanceRequestCore.deploy({
        data: requestCoreJson.bytecode
    })
    .send({
        from: creator,
        gas: 15000000
    }, (error: Error, transactionHash: string) => {
        if (error) {
            console.log('RequestCore - error transactionHash ##########################')
            console.log(error)
            console.log(transactionHash)
            console.log('RequestCore - error transactionHash ##########################')
        }
        // console.log('RequestCore - transactionHash : '+transactionHash);
    })
    .on('error', (error: Error) => {
        console.log('RequestCore - error ##########################')
        console.log(error)
        console.log('RequestCore - error ##########################')
    })
    .then((newContractInstance: any) => {
        addressRequestCore = newContractInstance.options.address;
        newContractInstanceRequestCore = newContractInstance;
        console.log('RequestCore - address : ' + newContractInstance.options.address) // instance with the new contract address

        instanceRequestEthereum.deploy({
                data: requestEthereumJson.bytecode,
                arguments: [addressRequestCore,addressContractBurner]
            })
            .send({
                from: creator,
                gas: 15000000
            }, (error: Error, transactionHash: string) => {
                if (error) {
                    console.log('RequestEthereum - error transactionHash ##########################')
                    console.log(error)
                    console.log(transactionHash)
                    console.log('RequestEthereum - error transactionHash ##########################')
                }
            })
            .on('error', (error: Error) => {
                console.log('RequestEthereum - error ##########################')
                console.log(error)
                console.log('RequestEthereum - error ##########################')
            })
            .then((newContractInstance: any) => {
                console.log('RequestEthereum - address : ' + newContractInstance.options.address) // instance with the new contract address
                addressRequestEthereum = newContractInstance.options.address;
                newContractInstanceRequestEthereum = newContractInstance;

                // Create a testing token that can be mint by anyone
                instanceERC20TestToken.deploy({
                    data: TestToken.bytecode,
                    arguments: [tokenMintAtStart]
                })
                .send({
                    from: creator,
                    gas: 1500000
                }, (error: Error, transactionHash: string) => {
                    if (error) {
                        console.log('TestToken - error transactionHash ##########################')
                        console.log(error)
                        console.log(transactionHash)
                        console.log('TestToken - error transactionHash ##########################')
                    }
                    // console.log('RequestCore - transactionHash : '+transactionHash);
                })
                .on('error', (error: Error) => {
                    console.log('TestToken - error ##########################')
                    console.log(error)
                    console.log('TestToken - error ##########################')
                })
                .then( (newContractInstance: any) => {
                    console.log('TestToken - address : ' + newContractInstance.options.address);
                    addressCentralBank = newContractInstance.options.address;

                    instanceRequestERC20.deploy({
                        data: requestERC20Json.bytecode,
                        arguments: [addressRequestCore, addressContractBurner, addressCentralBank]
                    })
                    .send({
                        from: creator,
                        gas: 15000000
                    }, (error: Error, transactionHash: string) => {
                        if (error) {
                            console.log('RequestERC20 - error transactionHash ##########################')
                            console.log(error)
                            console.log(transactionHash)
                            console.log('RequestERC20 - error transactionHash ##########################')
                        }
                        // console.log('RequestCore - transactionHash : '+transactionHash);
                    })
                    .on('error', (error: Error) => {
                        console.log('RequestERC20 - error ##########################')
                        console.log(error)
                        console.log('RequestERC20 - error ##########################')
                    })
                    .then((newContractInstance: any) => {
                        console.log('RequestERC20 - address : ' + newContractInstance.options.address) // instance with the new contract address
                        addressRequestERC20 = newContractInstance.options.address;
                        newContractInstanceRequestERC20 = newContractInstance;


                        web3Single.broadcastMethod(
                            newContractInstanceRequestCore.methods.adminAddTrustedCurrencyContract(addressRequestERC20),
                            (transactionHash: string) => {
                                // we do nothing here!
                            },
                            (receipt: any) => {
                                if (receipt.status == 1) {
                                    console.log('adminAddTrustedCurrencyContract: ' + addressRequestERC20);
                                }
                            },
                            (confirmationNumber: number, receipt: any) => {
                                // we do nothing here!
                            },
                            (error: Error) => {
                                console.log('adminAddTrustedCurrencyContract - error ##########################')
                                console.log(error)
                                console.log('adminAddTrustedCurrencyContract - error ##########################')
                            });

                        web3Single.broadcastMethod(
                            newContractInstanceRequestCore.methods.adminAddTrustedCurrencyContract(addressRequestEthereum),
                            (transactionHash: string) => {
                                // we do nothing here!
                            },
                            (receipt: any) => {
                                if (receipt.status == 1) {
                                    console.log('adminAddTrustedCurrencyContract: ' + addressRequestEthereum);
                                }
                            },
                            (confirmationNumber: number, receipt: any) => {
                                // we do nothing here!
                            },
                            (error: Error) => {
                                console.log('adminAddTrustedCurrencyContract - error ##########################')
                                console.log(error)
                                console.log('adminAddTrustedCurrencyContract - error ##########################')
                            });

                        web3Single.broadcastMethod(
                            newContractInstanceRequestEthereum.methods.setFeesPerTenThousand(feesPerTenThousand),
                            (transactionHash: string) => {
                                // we do nothing here!
                            },
                            (receipt: any) => {
                                if (receipt.status == 1) {
                                    console.log('setFeesPerTenThousand: ' + feesPerTenThousand);
                                }
                            },
                            (confirmationNumber: number, receipt: any) => {
                                // we do nothing here!
                            },
                            (error: Error) => {
                                console.log('setFeesPerTenThousand - error ##########################')
                                console.log(error)
                                console.log('setFeesPerTenThousand - error ##########################')
                            });

                        web3Single.broadcastMethod(
                            newContractInstanceRequestEthereum.methods.setMaxCollectable(maxFees),
                            (transactionHash: string) => {
                                // we do nothing here!
                            },
                            (receipt: any) => {
                                if (receipt.status == 1) {
                                    console.log('maxFees: ' + maxFees);
                                }
                            },
                            (confirmationNumber: number, receipt: any) => {
                                // we do nothing here!
                            },
                            (error: Error) => {
                                console.log('setMaxCollectable - error ##########################')
                                console.log(error)
                                console.log('setMaxCollectable - error ##########################')
                            });

                        });

                });
            });
    });

});

