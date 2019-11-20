// tslint:disable:object-literal-sort-keys
export const exampleAddressInfo = {
  hash160: '098644afadda014ec2b262ee87a05c592d315a52',
  address: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
  n_tx: 3,
  total_received: 50500000,
  total_sent: 50000000,
  final_balance: 500000,
  txs: [
    {
      ver: 1,
      inputs: [
        {
          sequence: 4294967295,
          witness: '',
          prev_out: {
            spent: true,
            spending_outpoints: [
              {
                tx_index: 200279016,
                n: 0,
              },
            ],
            tx_index: 200086044,
            type: 0,
            addr: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
            value: 50000000,
            n: 1,
            script: '76a914098644afadda014ec2b262ee87a05c592d315a5288ac',
          },
          script:
            '47304402202385622a787cc36ddb663277846a276d7039686fb27d709b28bd1943a0246a49022045664017a5b1a9a3f5fa207de2f03d49131f44d3ec3253a88c4315353bdb59d901210311f5ed5f9455c13f3ffb9510ba70343a8827b046fec002a69e8aff22fd3904dd',
        },
      ],
      weight: 900,
      block_height: 1354205,
      relayed_by: '0.0.0.0',
      out: [
        {
          spent: false,
          tx_index: 200279016,
          type: 0,
          addr: 'mybKCJZRYF4PcjmvY2uQfgdLu2iSK6x9wV',
          value: 49499646,
          n: 0,
          script: '76a914c64560072d66a3a5be70770b26e588e26b9bbe6688ac',
        },
        {
          spent: false,
          tx_index: 200279016,
          type: 0,
          addr: 'mp4jrwUTAPX3iPRAzHvzCqrvrrQTvr7sae',
          value: 500000,
          n: 1,
          script: '76a9145dc3f041a409c05e81eeb82da709ec817d0af02188ac',
        },
      ],
      lock_time: 0,
      result: 0,
      size: 225,
      block_index: 5173452,
      time: 1531880116,
      tx_index: 200279016,
      vin_sz: 1,
      hash: '2ff7b73cb1b0dca6ccf079f9ad1d92832f9c56176e5181310c7c453dac7e477e',
      vout_sz: 2,
    },

    {
      ver: 1,
      inputs: [
        {
          sequence: 4294967295,
          witness: '',
          prev_out: {
            spent: true,
            spending_outpoints: [
              {
                tx_index: 200277915,
                n: 0,
              },
            ],
            tx_index: 200086044,
            type: 0,
            addr: 'myNSJA1CVfsACFjNGUytNe5XtcfS9dGzPD',
            value: 79949264,
            n: 0,
            script: '76a914c3d5e5281b70676a654c2d76bfb92a7e1bcc026788ac',
          },
          script:
            '4830450221008a8e7a285ed502f6ae9e33b9526161581b5bed49d30f628a87ffaaf18c1aefa202201017b8bf17bf86440b4cff10480a12483c4ce19974ac605e4a599258cbf1afbf0121025c16fbab48ff717e58de9ddc8a008b6677e6b426123d987892367e02cb3a77a0',
        },
      ],
      weight: 904,
      block_height: 1354204,
      relayed_by: '0.0.0.0',
      out: [
        {
          spent: false,
          tx_index: 200277915,
          type: 0,
          addr: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
          value: 500000,
          n: 0,
          script: '76a914098644afadda014ec2b262ee87a05c592d315a5288ac',
        },
        {
          spent: false,
          tx_index: 200277915,
          type: 0,
          addr: 'mmzY6hpYrePEQ1zVLeMMmNnzBEBrYKaJYQ',
          value: 79448910,
          n: 1,
          script: '76a9144708343face765d3d8928027a9da4fc4330b4fce88ac',
        },
      ],
      lock_time: 0,
      result: -50000000,
      size: 226,
      block_index: 5173449,
      time: 1531879904,
      tx_index: 200277915,
      vin_sz: 1,
      hash: '2a14f1ad2dfa4601bdc7a6be325241bbdc2ae99d05f096357fda76264b1c5c26',
      vout_sz: 2,
    },

    {
      ver: 1,
      inputs: [
        {
          sequence: 4294967295,
          witness: '',
          prev_out: {
            spent: true,
            spending_outpoints: [
              {
                tx_index: 200086044,
                n: 0,
              },
            ],
            tx_index: 199750503,
            type: 0,
            addr: 'mg6ZUb3EJRNynouL4ai8rYWncpNi3ndhPB',
            value: 129949618,
            n: 0,
            script: '76a914065b18498b90cf992cf5dcd50927c1d6b8d258b488ac',
          },
          script:
            '483045022100a9a3979fa0ff90293ca12a46feeef73b4a8cdb3b3f3c15ae95e02a679feb74140220626cc16cc32856037a6d666f1a1bd5f1253c8bdc49e7648ff7240732a4e7ac54012103c345078aba1bd6df47393a1efe5de1d4e8c8fc9c5b549668c4b16909d96b2e4a',
        },
      ],
      weight: 904,
      block_height: 1354075,
      relayed_by: '0.0.0.0',
      out: [
        {
          spent: true,
          spending_outpoints: [
            {
              tx_index: 200277915,
              n: 0,
            },
          ],
          tx_index: 200086044,
          type: 0,
          addr: 'myNSJA1CVfsACFjNGUytNe5XtcfS9dGzPD',
          value: 79949264,
          n: 0,
          script: '76a914c3d5e5281b70676a654c2d76bfb92a7e1bcc026788ac',
        },
        {
          spent: true,
          spending_outpoints: [
            {
              tx_index: 200279016,
              n: 0,
            },
          ],
          tx_index: 200086044,
          type: 0,
          addr: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
          value: 50000000,
          n: 1,
          script: '76a914098644afadda014ec2b262ee87a05c592d315a5288ac',
        },
      ],
      lock_time: 0,
      result: 500000,
      size: 226,
      block_index: 5173062,
      time: 1531817766,
      tx_index: 200086044,
      vin_sz: 1,
      hash: '7d84924c034798dedcc95f479c9cdb24fe014437f7ce0ee0c2f4bf3580e017d8',
      vout_sz: 2,
    },
  ],
};
