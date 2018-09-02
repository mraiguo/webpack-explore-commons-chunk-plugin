# webpack-explore-commons-chunk-plugin
**探索webpack1.x下commons-chunk-plugin打包问题**

使用公司的旧的脚手架打包的时候总是会有1kb的commons-[hash].js
![image](https://raw.githubusercontent.com/mraiguo/image-respository/master/201809012328.png)
经过排查发现是webpack的CommonsChunkPlugin配置导致，所以决定做一个测试，探索下这个插件到底需要怎么样的打开方式

为了能够把变化的因素变到最低，我们创建一个新项目，使用控制变量法来做测试。
![image](https://raw.githubusercontent.com/mraiguo/image-respository/master/201809020041.png)

chunk-1.js
```
require("./chunk-3");
var chunk1='this is chunk1 code';
exports.chunk1=chunk1;
```

chunk-2.js
```
require("./chunk-3");
var chunk2='this is chunk2 code';
exports.chunk2=chunk2;
```

chunk-3.js
```
var chunk3='this is chunk3 code';
exports.chunk3=chunk3;
```

main.js
```
require("./chunk-1");
require("./chunk-2");
require("./chunk-3");
```
可以看到chunk-3.js非常受欢迎，被chunk-1，2都引用了，main.js也干了。这时候我们开始打包
## 使用commonsChunkPlugin时
### 单入口，模块多次重复引用
安装官网示例，webpack配置如下
```
const webpack = require('webpack')
module.exports = {
    entry:
        {
            main:'./main.js'
        },
    output: {
        path:__dirname+'/dist',
        filename: '[name].js'
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'commons',
            filename: 'commons.js',
            minChunks: 2,
        }),
    ]
};
```
运行 webpack，打包结果如图,  
![image](https://raw.githubusercontent.com/mraiguo/image-respository/master/20180902031325.png)  
打开会发现，chunk-1，2，3的代码都被打到build.js文件里了。这和我想象的不大对路。在我的想象中，chunk3都被require超过2次了，讲道理，应该会被打包进commons.js的。
于是认真看了下官网的示例代码，
![image](https://raw.githubusercontent.com/mraiguo/image-respository/master/20180902021947.png)
按官网的说法是，它分割的是多个入口直接共享的代码。
## 多入口，模块重复引用
我们给main-1.js加行代码，引入我们非常受欢迎的chunk-3.js
```
require("./chunk-3");
```
webpack配置如下，懒得对比的，我就直接跟你说，就是加了一个入口main1,使用main-1.js做入口
```
const webpack = require('webpack')
module.exports = {
    entry:
        {
            main:'./main.js',
            main1:'./main-1.js'
        },
    output: {
        path:__dirname+'/dist',
        filename: 'build.js'
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'commons',
            filename: 'commons.js',
            minChunks: 2,
        }),
    ]
};
```
这个时候按照官网的说法，chunk-3.js被两个入口文件引用了，那么chunk-3.js会被打包到commons.js才对，试下。
```
...上面省略
/******/ ({

/***/ 2:
/***/ function(module, exports) {

	var chunk3='this is chunk3 code';
	exports.chunk3=chunk3;

/***/ }

/******/ });
```
果然，，受欢迎的chunk-3.js被打包进来了。
总结：
> commonsCHunkPlugin插件抽取公共代码是针对对入库来进行的，单入口的时候强行指定没有效果，还会生成1kb左右的冗余文件，可以去除。

---

## dllPlugin

既然commonsChunkPlugin不能满足我们提取单入口页面公共代码的需求，那么看下其他的。
结合官网和其他文章，大概了解了这儿plugin作用；就是：  
> 当我们一个项目引入了多个较大的包以后，这些包本身并不会运行，我们也不会修改这些包的代码，但是每当我们修改了业务代码之后，这些包也会被重新打包。极大的浪费了时间，这时我们就需要使用这个工具预先把静态资源提前打包，以后修改源文件再打包时就不会打包这些静态资源文件了。
为了验证，加了一个webpack.dll.conf.js
```
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
```
webpack.config.js
```
plugins: [
    ...省略
    new webpack.DllReferencePlugin({
        context: path.join(__dirname), // 同那个dll配置的路径保持一致
        manifest: require('./manifest.json') // manifest的缓存信息
    })
]
```
运行`webpack -p --progress --config webpack.dll.conf.js` 和 `webpack`得到:  
![image](https://raw.githubusercontent.com/mraiguo/image-respository/master/20180902211020.png)  
和想的一样，把不常修改的包打包到dll.vender.js里面了

---
 todo: 探索单文件打包抽取公共代码 
