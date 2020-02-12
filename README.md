*Psst — looking for a shareable component template? Go here --> [sveltejs/component-template](https://github.com/sveltejs/component-template)*

---

> 此项目旨在提供开箱即用的快速搭建SDK或者web components的种子项目。

## useage

```
git clone ...
npm install 
使用rollup开发打包
npm run rollup:dev 
npm run rollup:build
使用webpack开发打包
npm run dev
npm run build
```

## 文档

```
dist/jsdoc/svelte-sdk-starter/1.0.0/index.html

```
## 引入SDK
```
<script src="dist/build/bundle.js"></script>
```

## XXSDK

```
@param path {String} 
@return  a client-side component
window.XXSDK({
    callback: () => {}
});

```

## screenshots

![image](https://pic1.58cdn.com.cn/nowater/cxnomark/n_v2e9b739b0fa1e41cba0b3bccb8e01a282.gif)

### css预处理器
  
    - node-sass sass
  
### css后处理器
  
    - fix all of flexbug's issues postcss-flexbugs-fixes
    - css未来语法features && autoprefixer spostcss-preset-env 
    - vw布局 postcss-px-to-viewport
    - postcss.config.js
  
### 浏览器版本
  
    - .browserslistrc
  
### rollup svelte打通cssworkflow
  
    - svelte-preprocess
### 开发环境启动本地服务解决跨域问题等(rollup生态有点小)
  
    - rollup-plugin-dev
### eslint 
  
    - rollup-plugin-eslint 
    - .eslintrc.js
    - eslint-plugin-react
    - babel-eslint
  

  
### 代码检测工具流
  
    - prettier 
    - prettier-plugin-svelte 
    - husky
    - lint-staged
    - editconfig
  
### babel polyfill

    - babel,polyfill 
    - babel-eslint      
    - @babel/core 
    - @babel/plugin-transform-runtime 
    - @babel/preset-env @babel/runtime 
    - .babel.config.js

### 文档

    - jsdoc 由于市面上暂无svelte的解析插件（可变通改为.vue文件再使用jsdoc-vue），目前只是解析readme js

### 由于rollup打包后文件有些问题，改为webpack配置
