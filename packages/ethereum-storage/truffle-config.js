module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
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
  },
};
