module.exports = function( content ) {
  this.cacheable();

  var compiled = content.html;

  return {
    compiled: compiled,
    data: content.data,
    root: content.root
  };
}