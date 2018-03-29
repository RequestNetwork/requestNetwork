var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonicLocalhost = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

var mnemonicRinkeby = "";

var mnemonicMainnet = "";

module.exports = {
  networks: {
    development: {
      provider: new HDWalletProvider(mnemonicLocalhost, "http://localhost:8545/"),
      network_id: "*"
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