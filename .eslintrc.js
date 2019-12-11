module.exports = {
    root: true,
    "extends": [
      "eslint:recommended"
     ],
    "plugins": [
       "react"
     ],
    "parser": "babel-eslint",
    "parserOptions": {
       "ecmaVersion": 7,
       "sourceType": "module",
       "ecmaFeatures": {
         "jsx": true
       }
     },
    "env": {
       "es6": true,
       "browser": true,
       "node": true,
       "commonjs": true
     },
    "settings": {
       "import/ignore": [
         "node_modules"
       ]
     },
    "rules": {
      "no-console": 0,
      "semi": [0, "never"],
      "no-irregular-whitespace": 0,
      "no-unused-vars": [1, {"vars": "all", "args": "after-used"}],
      "no-unused-labels":1,
      "no-cond-assign": 2,
      "no-loop-func":1,
      "no-dupe-keys": 1,
      "no-const-assign": 2,
      "no-duplicate-case": 2,
      "no-dupe-args": 2,
      "no-dupe-class-members":2,
      "no-func-assign": 2,
      "no-invalid-this": 0,
      "no-this-before-super": 2,
      "no-redeclare": 2,
      "no-spaced-func": 2,
      "no-use-before-define": 1,
      "no-undef": 1,
      "react/no-did-update-set-state": 1,
      "react/jsx-no-duplicate-props": 2,
      "react/react-in-jsx-scope": 2,
      "react/no-unknown-property": 2,
      "react/no-danger": 0,
      "react/jsx-no-undef": 1,
      "react/no-deprecated": 1,
      "comma-dangle": 1,
      "no-unreachable": 1,
      "prefer-template":0,
      "no-mixed-spaces-and-tabs": 0,
      "prefer-rest-params":0,
      "no-return-await":0,
      "prefer-template":0,
      "no-debugger": process.env.NODE_ENV === 'production' ? 2 : 0,
     }
   }
  