module.exports = {
  mode: "production",
  entry: {
    index: "./src/index.ts",
  },
  output: {
    filename: "univ-fs-webfs.js",
    path: __dirname + "/dist",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      stream: false,
      fs: false,
      os: false,
      path: false,
      url: false,
    },
  },
};
