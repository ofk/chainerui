/* eslint-disable global-require  */

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const NODE_ENV = process.env.NODE_ENV || 'development';
const API_ROOT = process.env.API_ROOT || 'http://localhost:5000';
const nodeModulePath = path.resolve(__dirname, 'node_modules');

const versionPyPath = path.resolve(path.dirname(__dirname), 'chainerui', '_version.py');
const versionPy = fs.readFileSync(versionPyPath, 'utf8');
const versionMatches = /^__version__\s*=\s*'([^']*)'$/m.exec(versionPy);

if (!versionMatches) {
  throw new Error('version number was not found');
}

const version = versionMatches[1];

module.exports = {
  entry: {
    chainerui: [
      'core-js/es',
      'whatwg-fetch',
      'bootstrap/dist/css/bootstrap.css',
      '@fortawesome/fontawesome-free/css/all.css',
      'react-table/react-table.css',
      './src/index.jsx',
    ],
  },
  output: {
    path: path.resolve(path.dirname(__dirname), 'chainerui', 'static', 'dist'),
    filename: '[name].js',
  },
  mode: NODE_ENV,
  module: {
    rules: [
      {
        enforce: 'pre',
        exclude: nodeModulePath,
        test: /\.[jt]sx?$/,
        use: 'eslint-loader',
      },
      {
        exclude: nodeModulePath,
        test: /\.[jt]sx?$/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              parser: 'postcss-scss',
              plugins: [require('autoprefixer')()],
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|otf|ttf|woff2?)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
          },
        },
      },
      {
        test: /\.tmpl$/,
        use: 'raw-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  optimization: {
    splitChunks: {
      chunks: 'initial',
      name: 'vendor',
    },
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  plugins: [
    new CleanWebpackPlugin(['chainerui/static/dist'], {
      root: path.join(__dirname, '..'),
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      'process.env.VERSION': JSON.stringify(version),
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
    }),
    new HtmlWebpackPlugin({
      title: 'ChainerUI',
      template: 'template.ejs',
      favicon: 'src/favicon.ico',
      minify:
        NODE_ENV === 'production'
          ? {
              collapseBooleanAttributes: true,
              collapseInlineTagWhitespace: true,
              collapseWhitespace: true,
              minifyCSS: true,
              minifyJS: true,
              removeComments: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              sortAttributes: true,
              sortClassName: true,
              useShortDoctype: true,
            }
          : null,
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: 'vendor.css',
    }),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  devServer: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: API_ROOT,
      },
    },
  },
};
