"use strict"

const path = require("path")
const webpack = require("webpack")
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")

const resolve = dir => path.join(__dirname, ".", dir)

const isProd = process.env.NODE_ENV === "production"

module.exports = {
  entry: {
    main: "./src/index.js",
  },
  output: {
    path: resolve("lib"), // 输出目录
    filename: "react-quill-image-uploader.min.js", // 输出文件
    libraryTarget: "umd", // 采用通用模块定义
    library: "ReactQuillImageUploader", // 库名称
    libraryExport: "default", // 兼容 ES6(ES2015) 的模块系统、CommonJS 和 AMD 模块规范
  },
  devtool: "#source-map",
  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: "eslint-loader",
        enforce: "pre",
        include: [resolve("src"), resolve("test")],
        options: {
          formatter: require("eslint-friendly-formatter"),
        },
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /(node_modules)/,
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
          {
            loader: "less-loader",
            options: {
              modules: true,
              strictMath: true,
              noIeCompat: true,
            },
          },
        ],
      },
    ],
  },
  externals: {
    react: {
      root: "React",
      commonjs2: "react",
      commonjs: "react",
      amd: "react",
    },
    "react-dom": {
      root: "ReactDOM",
      commonjs2: "react-dom",
      commonjs: "react-dom",
      amd: "react-dom",
    },
  },
  plugins: isProd
    ? [
        new UglifyJsPlugin({
          parallel: true,
          uglifyOptions: {
            compress: {
              warnings: false,
            },
            mangle: true,
          },
          sourceMap: true,
        }),
      ]
    : [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
      ],
}
