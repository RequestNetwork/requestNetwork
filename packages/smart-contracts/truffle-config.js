module.exports = {
  networks: {
    development: {
      host: process.env.TRUFFLE_GANACHE_HOST || 'localhost',
      port: process.env.TRUFFLE_GANACHE_PORT || 8545,
      network_id: '*', // Match any network id
    },
    rinkeby: {
      network_id: 4,
      gasPrice: '5000000000', // 5 Gwei
    },
    mainnet: {
      network_id: 1,
      gasPrice: '5000000000', // 5 Gwei
    },
  
    // ref from https://www.xdaichain.com/for-developers/smart-contract-deployment

    xdai: {
          provider: function() {
                return new HDWalletProvider(
               process.env.MNEMONIC,
               "https://dai.poa.network")
          },
          network_id: 100,
          gas: 500000,
          gasPrice: 1000000000
    }  
  
  
  },
  compilers: {
    solc: {
      version: "0.8.0"
    }

  }

};
