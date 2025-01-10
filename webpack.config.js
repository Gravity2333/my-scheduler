const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "development",
  context: path.resolve(__dirname, "./"),
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/bundle.js",
    chunkFilename: "js/[name]-[chunkhash:8].js",
    clean: true,
    // 增加 publicPath 把 src="/js/bundle.js" 使用绝对路径
    publicPath: "/",
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
        use: "babel-loader",
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
      // 解析图片
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: "asset/resource", // 使用 Webpack 5 的内置类型
        generator: {
          filename: "images/[name].[hash:8][ext]",
        },
      },
      // 解析md
      {
        test: /\.md$/,
        use: [
          "raw-loader", // 使 .md 文件内容以字符串的形式加载
        ],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./template.html",
      inject: "body",
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash].css", // 提取的 CSS 文件名
      chunkFilename: "css/[id].css",
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
};
