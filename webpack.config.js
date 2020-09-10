const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


module.exports = {
    mode: 'development',
    entry: './src/main.ts',
    devtool: 'inline-source-map',
    module: {
        optimization: {
            minimize: false
        },
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    ExtractTextPlugin,
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                            minimize: false,
                            outputStyle: 'expanded'
                        }
                    }
                ],
            },
            {
                test: /\.(svg|ttf)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]'
                }
            },
        ],
    },
    resolve: {
        modules: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'styles'),
            path.resolve(__dirname, 'assets'),
            'node_modules'
        ],
        extensions: ['.ts', '.js', '.scss']
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'index.css',
        }),
    ],
}
