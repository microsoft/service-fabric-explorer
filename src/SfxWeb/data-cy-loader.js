console.log("test2")

module.exports = function(source) {
    var dataAttr= 'data-cy=\"([^"]*)\"';
    console.log("test")
    if(source.match(dataAttr)){
      source = source.replace(new RegExp(dataAttr, 'g'), '');
      console.log("match")
    }
    return source;
  }

