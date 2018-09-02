const webpack = require('webpack')
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
module.exports = {
    entry:
        {
            main:'./main.js',
            // main1:'./main-1.js',
            // vendor: ['jquery']
        },
    output: {
        path:path.join(__dirname+'/dist'),
        filename: '[name].js'
    },
    plugins: [
        new CleanWebpackPlugin(['dist']), // 清除dist文件夹下文件
        new webpack.DllReferencePlugin({
            context: path.join(__dirname), // 同那个dll配置的路径保持一致
            manifest: require('./manifest.json') // manifest的缓存信息
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'commons',
            filename: 'commons.js',
            minChunks: 2,
        }),
    ]
};