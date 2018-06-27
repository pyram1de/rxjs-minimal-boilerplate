const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
var OpenBrowserPlugin = require('open-browser-webpack-plugin');

module.exports = {
  entry: {
    index: ["babel-polyfill", "./src/index.js"]
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
  },

  plugins: [new HtmlWebpackPlugin(),
            new OpenBrowserPlugin('http://localhost:8080/webpack-dev-server')],

  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, "src"),
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: { presets: ["env"] }
        }
      },
      {
        test: /\.css$/,
        include: path.join(__dirname, "src"),
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  }
};
