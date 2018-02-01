var HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    kovan: {
      provider: function() {
      	// 0 : 0x4ae11D8925d635Bd09aE05a4C78617E841A77904	
      	// 1 : 0xE54D8F2e86ed3c8a8aDcDFc11fc9c6CFFaE59839
        return new HDWalletProvider("TODO", "https://kovan.infura.io/BQBjfSi5EKSCQQpXebOe")
      },
      gasPrice:1000000000,
      network_id: 42
    } 
  }
};
