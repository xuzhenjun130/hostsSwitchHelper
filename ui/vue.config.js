const path = require('path');

module.exports = {
  // 选项...
  outputDir: '../res',
  indexPath: path.resolve('../res/index.aardio'),
  publicPath: '/res/',
  productionSourceMap: false // 不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建
};
