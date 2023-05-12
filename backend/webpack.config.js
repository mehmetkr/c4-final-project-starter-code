const path = require('path');
const slsw = require('serverless-webpack');
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');

module.exports = {
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  entry: slsw.lib.entries,
  devtool: 'source-map',
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  target: 'node',
  node: {
    __dirname: false,
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' },
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
      {
        test: /\.(gif|svg|jpg|png)$/,
        use: 'file-loader',
      },
      {
        test: /chart\.js$/,
        use: 'script-loader',
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      }
    ],
  },
  plugins: [
    new ModuleConcatenationPlugin(),
  ],
};
