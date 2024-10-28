/**
 * This is to generate the umd bundle only
 * From https://github.com/0xProject/0x-monorepo/blob/development/packages/0x.js/webpack.config.js
 */
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');

module.exports = {
  entry: {
    'epk-cypher.min': './src/index.ts',
  },
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'EthereumPrivateKeyCypherProvider',
    umdNamedDefine: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
    },
  },
  devtool: 'source-map',
  optimization: {
    minimizer: [new TerserPlugin({ sourceMap: true })],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.build.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false }),
    new DuplicatePackageCheckerPlugin(),
  ],
};
