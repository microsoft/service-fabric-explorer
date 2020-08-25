var path =  require('path');
console.log(__dirname)
module.exports = {
  module: {
    rules: [{
      test: /\.html$/i,
      use: [
          {
              loader: path.resolve('data-cy-loader.js')
          }
      ]
    }]
  },
}