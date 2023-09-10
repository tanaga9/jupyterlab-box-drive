const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/auth.html", to: "assets" },
        { from: "src/BoxSdk.min.js", to: "assets" },
      ],
    }),
  ],
  output: {
    assetModuleFilename: 'assets/[hash][ext][query]'
  },
  resolve: {
    alias: {
      '@/assets': path.resolve(__dirname, './assets'),
    },
  },
  module: {
    rules: [
      {
        test: /\.html/,
        type: 'asset/resource'
      }/*,
      {
        test: /\.js/,
        type: 'asset/resource'
      }*/
    ] 
  }
}
