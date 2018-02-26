const addressContractBurner = 0;
const feesPerTenThousand = 10; // 0.1 %
const maxFees = '120000000000000'; // 0.00012 ether in wei

import requestArtifacts from 'requestnetworkartifacts';
import { Web3Single } from '../src/servicesExternal/web3-Single';

const requestCoreJson = requestArtifacts('private', 'last-RequestCore');
const requestEthereumJson = requestArtifacts('private', 'last-RequestEthereum');
const requestBurnManagerSimple = requestArtifacts('private', 'last-RequestBurnManagerSimple');

Web3Single.init('http://localhost:8545', 10000000000);
const web3Single = Web3Single.getInstance();

const instanceRequestCore = new web3Single.web3.eth.Contract(requestCoreJson.abi);
const instanceRequestEthereum = new web3Single.web3.eth.Contract(requestEthereumJson.abi);
// const instancerequestBurnManagerSimple = new web3Single.web3.eth.Contract(requestBurnManagerSimple.abi)

let addressRequestCore: string;
let addressRequestEthereum: string;
// let addressrequestBurnManagerSimple: string;
let newContractInstanceRequestCore: any;
let newContractInstanceRequestEthereum: any;
// let newContractInstancerequestBurnManagerSimple: any;

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
        console.log('RequestCore - error transactionHash ##########################')
        console.log(error)
        console.log('RequestCore - error transactionHash ##########################')
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
                // console.log('RequestCore - transactionHash : '+transactionHash);
            })
            .on('error', (error: Error) => {
                console.log('RequestEthereum - error transactionHash ##########################')
                console.log(error)
                console.log('RequestEthereum - error transactionHash ##########################')
            })
            .then((newContractInstance: any) => {
                console.log('RequestEthereum - address : ' + newContractInstance.options.address) // instance with the new contract address
                addressRequestEthereum = newContractInstance.options.address;
                newContractInstanceRequestEthereum = newContractInstance;

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

