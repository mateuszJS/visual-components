const path = require("path");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  experiments: {
		asyncWebAssembly: true
	},
  mode: process.env.NODE_ENV,
  entry: {
    index: './src/index.ts',
    integrationTest: {
      runtime: 'test-runtime',
      import: './integration-tests/index.ts',
      filename: 'test.js'
    }
  },
  devtool: isProd ? undefined : "eval-source-map",
  watch: !isProd,
  devServer: {
    // static: "./dist", // do not use it. It's gonna serve last SSG pages while dev mode
    historyApiFallback: true // fallback to index.html while 404
  },
  resolve: {
    extensions: [".ts", ".js", '.wasm', '.wgsl', '.jpg', '.png'],
    modules: [path.resolve(__dirname, "src"), "node_modules"],
    /* useful with absolute imports, "src" dir now takes precedence over "node_modules",
    otherwise you got an error:
    Requests that start with a name are treated as module requests and resolve within module directories (node_modules).
    */
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.wgsl$/,
        type: "asset/source",
      },
      {
        test: /\.(png|jpg)$/,
        type: "asset/resource",
      },
    ],
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  optimization: {
    // https://webpack.jakoblind.no/optimize/ suppose to give you suggestion how to improve build
    runtimeChunk: "single", // split runtime code into a separate chunk using the
    // looks like it's needed because each deployment, reach changes something
    // so [contenthash] also gonna change each time
    // it contains references to all modules, so changes in each deployment

    moduleIds: 'deterministic', /* still some modules can change because order of improts has changed
    so with deterministic module id, the order won't matter!! contenthash should stay the same*/
  },
  plugins: [
    // isProd && !process.env.CI && new BundleAnalyzerPlugin({
    //   analyzerMode: 'static' // 'server' had issue running along with PrerendererWebpackPlugin
    // }),
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, "crate"),
    }),
    new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "integration-tests/template.html"),
      inject: true,
      chunks: ['integrationTest'],
    }),
  ],
};
