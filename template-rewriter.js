var loaderUtils = require( 'loader-utils' );
var parse5 = require( 'parse5' );

function addScopedId( node, id ) {
		// element only
	if ( node.nodeName.indexOf( '#' ) === -1 ) {
		node.attrs = node.attrs || [];
		node.attrs.push( {
			name: id,
			value: ''
		} );
	}

	if ( node.childNodes && node.childNodes.length ) {
		node.childNodes.forEach( function ( node ) {
			addScopedId( node, id );
		} );
	}

	return node;
}

module.exports = function ( content ) {
	this.cacheable();

	var query = loaderUtils.parseQuery( this.query );
	var id = query.id;
	var scoped = query.scoped;

	var tree = parse5.parseFragment( content.html );

	if ( scoped ) {
		tree.childNodes[ 0 ] = addScopedId( tree.childNodes[ 0 ], id );
	}

	var nodeStr = parse5.serialize( tree );

	var root = content.root;
	var data = content.data;

	// use `module.exports` to export
	var result = nodeStr.replace( /"(xxxHTMLLINKxxx[0-9\.]+xxx)"/g, function ( total, match ) {
		if ( !data[ match ] ) {
			return total;
		}
		return 'require(\'' + loaderUtils.urlToRequest( data[ match ], root ) + '\')';
	} );

	result = 'module.exports = `' + result + '`';

	return result;
};
