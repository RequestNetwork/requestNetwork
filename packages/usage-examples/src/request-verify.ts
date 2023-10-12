
const snarkjs = require("snarkjs");


async function verifyProof(
    name: string
) : Promise<boolean> {   
    const proofsJSON = require(`./data/proof.json`); 
    const publicSignals = proofsJSON[name].publicSignals;
    const proof = proofsJSON[name].proof;

    const vKey = require(`/home/vincent/Documents/request/vrolland-requestNetwork/packages/request-logic/src/circom/${name}_verification_key.json`);

    // const vKey = JSON.parse(fs.readFileSync("build/requestErc20FeeProxy_verification_key.json"));
    // const vKey = JSON.parse(vKeyJSON);

    return snarkjs.groth16.verify(vKey, publicSignals, proof);

}




(async () => {
    const proofsJSON = require(`./data/proof.json`);
    // TODO CHECK about currency !
    console.log('## Create')
    console.log('verified:', await verifyProof('requestErc20FeeProxy'))
    console.log('## Accept')
    console.log('verified:', await verifyProof('accept') && proofsJSON.requestErc20FeeProxy.publicSignals[0] == proofsJSON.accept.publicSignals[0])
    console.log('## Payment')
    console.log('Payment address:', '0x'+BigInt(proofsJSON.checkBalanceErc20FeeProxy.publicSignals[3]).toString(16))
    console.log('Payment Reference:', BigInt(proofsJSON.checkBalanceErc20FeeProxy.publicSignals[2]).toString(16).slice(-16))
    console.log('Payment amount declared:', proofsJSON.checkBalanceErc20FeeProxy.publicSignals[1] == "1" ? proofsJSON.checkBalanceErc20FeeProxy.publicSignals[4] : 'unknown')
    console.log('verified:', await verifyProof('checkBalanceErc20FeeProxy') 
                                    && proofsJSON.requestErc20FeeProxy.publicSignals[0] == proofsJSON.accept.publicSignals[0]
                                    && proofsJSON.checkBalanceErc20FeeProxy.publicSignals[1] == "1"
                                    && false // TODO check if amount match the address & reference on the Erc20FeeProxy contract
                                    )
    console.log("/!\\ on chain check required for the payment")
    // TODO
    console.log("## Payee registered")
    console.log("TODO")
    console.log("## Payer registered")
    console.log("TODO")

})()
