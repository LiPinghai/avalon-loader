module.exports = function( content ) {
  this.cacheable();

  var compiled = content.html.replace(/\n/g,'');

  return {
    compiled: compiled,
    data: content.data,
    root: content.root
  };
}