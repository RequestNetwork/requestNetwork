const HDWalletProvider = require('truffle-hdwallet-provider');

const rinkebyMnemonic = '' 
const mainnetMnemonic = ''

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
    },
    rinkeby: {
      provider: new HDWalletProvider(rinkebyMnemonic, 'https://rinkeby.infura.io/'),
      network_id: 4,
      gasPrice: '5000000000', // 5 Gwei
    },
    mainnet: {
      provider: new HDWalletProvider(mainnetMnemonic, 'https://mainnet.infura.io/'),
      network_id: 1,
      gasPrice: '5000000000', // 5 Gwei
    },
  },
};
