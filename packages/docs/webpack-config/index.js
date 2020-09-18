const webpack = require('webpack');

module.exports = function (context, options) {
  return {
    name: 'webpack-config',
    configureWebpack(config, isServer, utils) {
      return {
       plugins: [new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })]
      }
    }
  }
};