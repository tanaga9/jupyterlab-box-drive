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
}
