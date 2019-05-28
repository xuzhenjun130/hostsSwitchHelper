# hostsSwitchHelper

hosts切换助手

![](https://github.com/xuzhenjun130/hostsSwitchHelper/blob/master/res/main.png?raw=true)

功能基本参考SwitchHosts，SwitchHosts 基于Electron，兼容多系统，但是文件体积比较大50M+。在最新版chrome浏览器已经无法使用remote debugging protocol 来清理DNS缓存了，于是自己动手写一个。

hosts切换助手调用系统安装的chrome浏览器创建应用程序。只能在windows下使用，但是文件体积压缩后不到1M。

前端使用element-ui，快速创建一个还算漂亮的界面。

桌面程序使用aardio开发。



build 步骤：

- 1. ui目录安装依赖后 `npm run build`
- 2. arrdio软件打开项目 -> 发布。
- 3. Publish为软件发布目录，可以看到编译生成的 `Hosts切换助手.exe` 及前端资目录 `res`



[下载地址]: https://github.com/xuzhenjun130/hostsSwitchHelper/releases



