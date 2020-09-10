const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


module.exports = {
    entry: './src/main.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'
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
