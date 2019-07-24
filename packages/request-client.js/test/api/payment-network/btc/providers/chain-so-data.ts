// tslint:disable:object-literal-sort-keys
export const exampleAddressInfo = {
  status: 'success',
  data: {
    network: 'BTCTEST',
    address: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
    balance: '0.00500000',
    received_value: '0.50500000',
    pending_value: '0.00000000',
    total_txs: 2,
    txs: [
      {
        txid: '2ff7b73cb1b0dca6ccf079f9ad1d92832f9c56176e5181310c7c453dac7e477e',
        block_no: 1354205,
        confirmations: 167375,
        time: 1531880116,
        outgoing: {
          value: '0.50000000',
          outputs: [
            {
              output_no: 0,
              address: 'mybKCJZRYF4PcjmvY2uQfgdLu2iSK6x9wV',
              value: '0.49499646',
              spent: null,
            },
            {
              output_no: 1,
              address: 'mp4jrwUTAPX3iPRAzHvzCqrvrrQTvr7sae',
              value: '0.00500000',
              spent: null,
            },
          ],
        },
      },
      {
        txid: '2a14f1ad2dfa4601bdc7a6be325241bbdc2ae99d05f096357fda76264b1c5c26',
        block_no: 1354204,
        confirmations: 167376,
        time: 1531879904,
        incoming: {
          output_no: 0,
          value: '0.00500000',
          spent: null,
          inputs: [
            {
              input_no: 0,
              address: 'myNSJA1CVfsACFjNGUytNe5XtcfS9dGzPD',
              received_from: {
                txid: '7d84924c034798dedcc95f479c9cdb24fe014437f7ce0ee0c2f4bf3580e017d8',
                output_no: 0,
              },
            },
          ],
          req_sigs: 1,
          script_asm:
            'OP_DUP OP_HASH160 098644afadda014ec2b262ee87a05c592d315a52 OP_EQUALVERIFY OP_CHECKSIG',
          script_hex: '76a914098644afadda014ec2b262ee87a05c592d315a5288ac',
        },
      },
      {
        txid: '7d84924c034798dedcc95f479c9cdb24fe014437f7ce0ee0c2f4bf3580e017d8',
        block_no: 1354075,
        confirmations: 167505,
        time: 1531817766,
        incoming: {
          output_no: 1,
          value: '0.50000000',
          spent: {
            txid: '2ff7b73cb1b0dca6ccf079f9ad1d92832f9c56176e5181310c7c453dac7e477e',
            input_no: 0,
          },
          inputs: [
            {
              input_no: 0,
              address: 'mg6ZUb3EJRNynouL4ai8rYWncpNi3ndhPB',
              received_from: {
                txid: 'a9cc998c0798f9cb38f3f1c531f99c9ebf1a58fda0dae5563760efe2dc037a10',
                output_no: 0,
              },
            },
          ],
          req_sigs: 1,
          script_asm:
            'OP_DUP OP_HASH160 098644afadda014ec2b262ee87a05c592d315a52 OP_EQUALVERIFY OP_CHECKSIG',
          script_hex: '76a914098644afadda014ec2b262ee87a05c592d315a5288ac',
        },
      },
    ],
  },
  code: 200,
  message: '',
};
