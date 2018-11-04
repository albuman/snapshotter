const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');
const bodyTemplate = fs.readFileSync('app/index.html');

module.exports = {
    entry: path.resolve('app', 'app.js'),
    output: {
        path: path.resolve('app', 'dist'),
        filename: 'bundle.js'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            inject: false,
            template: require('html-webpack-template'),
            scripts: [
                'lib/angular/angular.js',
                'lib/angular-route/angular-route.js',
            ],
            headHtmlSnippet: `<script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.js"></script>`,
            bodyHtmlSnippet: `<div ng-app="myApp">${bodyTemplate}</div>`
        })
    ],
    module: {
        rules: [
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    devtool: "eval-source-map",
    devServer: {
        host: 'localhost',
        port: 8080,
        contentBase: [
            path.resolve('app'),
        ],
        hot: true,
        overlay: true
    }
};
