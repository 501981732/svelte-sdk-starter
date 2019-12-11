module.exports = {
    "plugins": () => [
        require('postcss-flexbugs-fixes'),
        require('postcss-preset-env')({
            stage: 3
          }),
        require("postcss-px-to-viewport")({
            viewportWidth: 750,     
            viewportHeight: 1334,   
            unitPrecision: 3,       
            viewportUnit: 'vw',    
            selectorBlackList: ['.ignore', '.hairlines'], 
            minPixelValue: 1,       
            mediaQuery: false       
          })
        // Adds PostCSS Normalize as the reset css with default options,
        // so that it honors browserslist config in package.json
        // which in turn let's users customize the target behavior as per their needs.
        // require('postcss-normalize')(),
    ]
}
