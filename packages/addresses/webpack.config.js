const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const config = {
  entry: {
    index: "./src/index.ts"
  },
  module: {
    rules: [
      {
        exclude: [/node_modules/, /test/],
        test: /\.ts(x?)$/,
        use: [
          {
            loader: "babel-loader"
          },
          {
            loader: "ts-loader"
          }
        ]
      }
    ]
  },
  output: {
    filename: "zetachain-addresses.js",
    globalObject: "this",
    library: "ZetachainAddresses",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "./dist"),
    umdNamedDefine: true
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, "./dist")],
      cleanStaleWebpackAssets: false
    })
  ],
  resolve: {
    extensions: [".ts", ".js"]
  },
  target: "web",
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/
  }
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    // * add some development rules here
  } else if (argv.mode === "production") {
    // * add some prod rules here
  } else {
    throw new Error("Specify env");
  }

  return config;
};
