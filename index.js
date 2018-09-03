var loaderUtils = require( 'loader-utils' );
var parse = require( './parser' );
var assign = require( 'object-assign' );
var hash = require( 'hash-sum' );
var es6Promise = require( 'es6-promise' );
var path = require( 'path' );

es6Promise.polyfill();

module.exports = function ( content ) {
	this.cacheable();

	var loaderContext = this;
	var options = this.options.avalon || {};
	var filePath = this.resourcePath;
	var fileName = path.basename( filePath );
	var moduleId = 'avn_' + hash( filePath );
	var rewriterInjectRE = /\b(css(-loader)?(\?[^!]+)?)(?:!|$)/;
	var selectorPath = require.resolve( './selector' );
  // use modified html-loader
	var htmlLoaderPath = require.resolve( './html-loader' );
	var defaultLoaders = {
		html: htmlLoaderPath,
		css: 'style-loader!css-loader',
		js: 'babel-loader?presets[]=es2015&plugins[]=transform-runtime&comments=false'
	};
	var defaultLang = {
		template: 'html',
		style: 'css',
		script: 'js'
	};
	var rewriters = {
		style: require.resolve( './style-rewriter' ),
		template: require.resolve( './template-rewriter.js' )
	};

	if ( this.sourceMap && !this.minimize ) {
		defaultLoaders.css = 'style-loader!css-loader?sourceMap';
	}

	var loaders = assign( {}, defaultLoaders, options.loaders );

	function getSelectorString( type, index ) {
		return selectorPath +
      '?type=' + type +
      '&index=' + index + '!';
	}

	function ensureBang( loader ) {
		if ( loader.charAt( loader.length - 1 ) !== '!' ) {
			return loader + '!';
		}
		return loader;
	}

	function getRewriter( type, scoped ) {
		var meta = '?id=' + moduleId;
		switch ( type ) {
		case 'template':
			return rewriters.template + ( scoped ? meta + '&scoped=true!' : '!' );
		case 'style':
			return rewriters.style + ( scoped ? meta + '&scoped=true!' : '!' );
		default:
			return '';
		}
	}

	function getLoaderString( type, part, scoped ) {
		var lang = part.lang || defaultLang[ type ];
		var loader = loaders[ lang ];
		var rewriter = getRewriter( type, scoped );
		if ( loader !== undefined ) {
			if ( type === 'style' && rewriterInjectRE.test( loader ) ) {
        // ensure rewriter is executed before css-loader
				loader = loader.replace( rewriterInjectRE, function ( m, $1 ) {
					return ensureBang( $1 ) + rewriter;
				} );
			} else if ( type === 'template' ) {
        // can not change loaders for template
				loader = rewriter + ensureBang( defaultLoaders.html );
			} else {
				loader = ensureBang( loader ) + rewriter;
			}

			return ensureBang( loader );
		}
      // unknown lang, infer the loader to be used
		switch ( type ) {
		case 'template':
			return rewriter + defaultLoaders.html + '!';
		case 'style':
			return defaultLoaders.css + '!' + rewriter + lang + '!';
		case 'script':
			return lang + '!';
		default:
			return '';
		}
	}

	function getRequireString( type, part, index, scoped ) {
		return loaderUtils.stringifyRequest( loaderContext,
      // disable all configuration loaders
      '!!' +
      // get loader string for pre-processors
      getLoaderString( type, part, scoped ) +
      // select the corresponding part from the rgl file
      getSelectorString( type, index || 0 ) +
      // the url to the actual rgl file
      filePath
    );
	}

	function getRequire( type, part, index, scoped ) {
		return 'require(' + getRequireString( type, part, index, scoped ) + ')\n';
	}

	var parts = parse( content, fileName, this.sourceMap );

	var output = 'var __avalon_script__, __avalon_template__;\n';

	var hasScopedStyle = false;

  // require style
	parts.style.forEach( function ( style, i ) {
		if ( style.scoped ) {
			hasScopedStyle = true;
		}
		output += getRequire( 'style', style, i, style.scoped );
	} );

  // require script
	var script;
	if ( parts.script.length ) {
		script = parts.script[ 0 ];
		output += '__avalon_script__ = ' + getRequire( 'script', script, 0 );
	}

  // require template
	var template;
	if ( parts.template.length ) {
    // only the first element
		template = parts.template[ 0 ];
		output += '__avalon_template__ = ' + getRequire( 'template', template, 0, hasScopedStyle );
	}

  // find Avalon
	output += 'var avalon = require( "avalon2" );\n\n';

	output += 'module.exports = avalon.component(__avalon_script__.default.name, { ' +
    'template: __avalon_template__,' +
    'defaults: __avalon_script__.default.defaults})\n';

  // done
	return output;
};
