const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

function generateConfig(outputs) {
  return outputs.map((output) => ({
    mode: process.env.NODE_ENV,
    context: path.resolve(__dirname, "./"),
    entry:
      process.env.NODE_ENV === "development"
        ? "./src/index.tsx"
        : "./src/libs/scheduler.ts",
    output: output,
    experiments: {
      outputModule: true, // 启用 ES Module 输出支持
    },
    resolveLoader: {
      extensions: [".tsx", ".js", ".ts", ".jsx", ".jsx", ".less"],
      modules: ["./src/loaders", "node_modules"],
    },
    performance: {
      maxAssetSize: 5000000000, // 设置为 500 KiB，或者你希望的任何值
      maxEntrypointSize: 5000000000, // 设置入口点的大小限制
    },
    resolve: {
      extensions: [".tsx", ".js", ".ts", ".jsx", ".jsx", ".less"],
      mainFiles: ["index"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@config": path.resolve(__dirname, "./config"),
      },
    },
    module: {
      rules: [
        {
          test: /\.(t|j)sx?$/,
          use:
            process.env.NODE_ENV === "development"
              ? "babel-loader"
              : "ts-loader",
        },
        {
          test: /\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                modules: true,
              },
            },
            "less-loader",
          ],
        },
        // CSS 文件处理规则
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                importLoaders: 1, // 保证 css-loader 在遇到 `url()` 时先处理 LESS
                url: true, // 使 css-loader 处理 url() 中的资源
                modules: true,
              },
            },
          ],
        },
      ],
    },

    plugins:
      process.env.NODE_ENV === "development"
        ? [
            new HtmlWebpackPlugin({
              template: "./template.html",
              inject: "body",
            }),
            new MiniCssExtractPlugin({
              filename: "css/[name].[contenthash].css", // 提取的 CSS 文件名
              chunkFilename: "css/[id].css",
            }),
          ]
        : [
            new CopyPlugin({
              patterns: [
                {
                  from: path.resolve(__dirname, "./package.prod.json"),
                  to: "./package.json",
                },
                {
                  from: path.resolve(__dirname, "./README.md"),
                  to: "",
                },
              ],
            }),
          ],
    devServer: {
      port: 3110,
      host: "127.0.0.1",
      hot: false,
      historyApiFallback: true, // 开启 historyApiFallback
      open: true,
      proxy: [
        {
          context: ["/api"], // 匹配多个路径
          target: "http://127.0.0.1:8888",
          changeOrigin: true,
        },
      ],
    },
  }));
}

module.exports = generateConfig(
  process.env.NODE_ENV === "development"
    ? {
        path: path.resolve(__dirname, "dist"),
        filename: "js/bundle.js",
        chunkFilename: "js/[name]-[chunkhash:8].js",
        clean: true,
        publicPath: "/",
      }
    : [
        {
          path: path.resolve(__dirname, "dist"),
          filename: "scheduler.mjs",
          library: {
            type: "module", // 指定导出类型为 ES Module
          },
          module: true, // 启用 ES Module 规范
          environment: {
            module: true, // 告诉 Webpack 不要转译 import/export
          },
        },
        {
          path: path.resolve(__dirname, "dist"),
          filename: "scheduler.cjs",
          clean: true,
          libraryTarget: "commonjs",
        },
      ],
);
