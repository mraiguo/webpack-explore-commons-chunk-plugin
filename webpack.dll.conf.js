const path = require('path')
const webpack = require('webpack')
module.exports = {
    entry: {
        vendor: ['react', 'react-dom', 'jquery']
    },
    output: {
        path: path.join(__dirname +'/dist'),
        filename: 'dll.[name].js',
        library: '[name]',
    },
    plugins: [
        new webpack.DllPlugin({
            path:  path.join(__dirname +'/manifest.json'),
            name: '[name]',
            context: path.join(__dirname),
        }),
    ],
}