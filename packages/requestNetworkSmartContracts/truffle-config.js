var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonicRinkeby = "";

var mnemonicMainnet = "";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: new HDWalletProvider(mnemonicRinkeby, "https://rinkeby.infura.io/"),
      network_id: 4,
      gasPrice: "5000000000", // 5 Gwei
    },
    mainnet: {
      provider: new HDWalletProvider(mnemonicMainnet, "https://mainnet.infura.io/"),
      network_id: 1,
      gasPrice: "5000000000", // 5 Gwei
    }
  }
};