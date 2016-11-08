const webpack = require('webpack');

module.exports = {
  entry: {
    'client': './src/client/index.js',
    'editor': './src/editor/index.js'
  },
  devtool: 'source-map',
  output: {
    path: __dirname + '/web',
    filename: '[name].bundle.js'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false
    //   }
    // })
  ]
};