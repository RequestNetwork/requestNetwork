import {expect} from 'chai';
import 'mocha';

import BitcoinService from '../../../src/servicesExternal/bitcoin-service';

let btcAddress: string;
let bitcoinService: BitcoinService;

describe('BitcoinService getMultiAddress', () => {
	beforeEach(() => {
        BitcoinService.init(3); // instanciate BitcoinService
        bitcoinService = BitcoinService.getInstance();
        
        btcAddress = 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v'
	});
    
	it('get info from blockchain.info', async () => {
        const res = await bitcoinService.getMultiAddress([btcAddress]);
        expect(res).to.not.be.undefined;
        expect(res, 'response to be an object').to.be.an('object');
        expect(res, 'response has property addresses').has.property('addresses');
        expect(res).has.property('info');
        expect(res).has.property('recommend_include_fee');
        expect(res).has.property('txs');
        expect(res).has.property('wallet');
        expect(res.addresses.length).to.be.not.null;
        expect(res.addresses[0]).has.property('account_index');
        expect(res.addresses[0]).has.property('address');
        expect(res.addresses[0].address).to.be.equal(btcAddress);
        expect(res.addresses[0]).has.property('change_index');
        expect(res.addresses[0]).has.property('final_balance');
        expect(res.addresses[0]).has.property('n_tx');
        expect(res.addresses[0]).has.property('total_received');
        expect(res.addresses[0]).has.property('total_sent');
    });
    
});
