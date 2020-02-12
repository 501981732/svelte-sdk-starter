const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {
    scss,
    postcss
} = require('svelte-preprocess')
const mode = process.env.NODE_ENV || 'development'
const isProd = mode === 'production';

const postcssConfig = require('./postcss.config.js').plugins()
// const babelConfig = 

const assetsPath = function (_path) {
    const assetsSubDirectory = isProd ?
        './build' :
        './build'

    return path.posix.join(assetsSubDirectory, _path)
}

const loaders = {
    babel: {
        loader: 'babel-loader',
        // options: {

        // }
    },
    svelte: {
        loader: 'svelte-loader',
        options: {
            emitCss: true,
            hotReload: !isProd,
            preprocess: [
                postcss({
                    plugins: postcssConfig
                }),
                scss()
            ]
        }
    },
    styles: [
        // css in js
        // isProd ? MiniCssExtractPlugin.loader : 'style-loader',
        'style-loader',
        'css-loader',
        {
            loader: 'postcss-loader',
            options: {
                plugins: postcssConfig
            }
        },
        'sass-loader'
    ]
}

const plugins = [
    new CleanWebpackPlugin(),
    // new MiniCssExtractPlugin({
    //     filename: 'build/bundle.css'
    // }),
    new HtmlWebpackPlugin({
        title: 'Svelte Webpack',
        template: 'public/index.html',
    })
]

const rules = [{
        test: /\.svelte$/,
        use: [loaders.babel, loaders.svelte]
    },
    {
        test: /\.(js|mjs)$/,
        use: [loaders.babel]
    },
    {
        test: /\.css$/,
        use: [
            ...loaders.styles.filter(Boolean)
        ]
    },
    {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
            limit: 10000,
            name: assetsPath('img/[name].[hash:7].[ext]'),
        }
    }
]

module.exports = {
    mode,
    entry: {
        bundle: './src/main.js'
    },
    output: {
        path: __dirname + '/dist',
        filename: 'build/bundle.js'
    },
    module: {
        rules
    },
    plugins,
    devtool: isProd ? false : 'source-map',
    resolve: {
        alias: {
            svelte: path.resolve('node_modules', 'svelte')
        },
        extensions: ['.mjs', '.js', '.svelte'],
        mainFields: ['svelte', 'browser', 'module', 'main']
    },
    devServer: {
        // hot: true,
        host: process.env.HOST || 'test.58.com',
        contentBase: path.join(__dirname, "dist"),
        // compress: true,
        port: 8080,
        proxy: {
            "/rank": {
                "target": "http://chroperation.58.com/",
                "secure": false,
                "changeOrigin": true
            }
        }
    }
}
