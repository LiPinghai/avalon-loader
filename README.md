# avalon-loader

> webpack loader for [avalonJs](https://github.com/RubyLouvre/avalon), base on [regular-loader](https://github.com/regularjs/regular-loader)

## Thanks

- [regular-loader](https://github.com/regularjs/regular-loader)
- [vue-loader](https://github.com/vuejs/vue-loader)

## Installation

```bash
$ npm i avalon-loader
```

## Usage

webpack.config.js

```js
var ExtractTextPlugin = require( 'extract-text-webpack-plugin' );

module.exports = {
	// ...
	entry: './index.js',
	module: {
		loaders: [
			{
				test: /\.avn$/,
				loader: 'avalon'
			}
		]
	},
	avalon: {
		loaders: {
			css: ExtractTextPlugin.extract( 'css' ),
      js: 'babel-loader?' + JSON.stringify( {
        presets: [
          [ "es2015", { loose: true } ]
        ],
        plugins: [ "transform-runtime" ],
        comments: false
      } )
		}
	},
	plugins: [
		// ...
		new ExtractTextPlugin( 'app.css' )
	]
};
```

index.html
```html
<body>
  <div id="app" ms-controller="app">
    {{name}}
    <ms-test></ms-test>
  </div>
</body>
```

index.js

```js
import avalon from 'avalon2'
avalon.define( {
  $id: "app",
  name: "司徒正美"
} )

import  './test.avn'
```

test.avn

```html
<style lang="css">
.test{
  background: #f00;
}
</style>
<template>
  <div>
     here is component!
     {{data}}
     <ms-inner>
        <div slot="content">content of inner</div>
     </ms-inner>
  </div>
</template>
<script>
import './inner.avn';
export default {
  name: 'ms-test',
  defaults:{
    data: "this is data"
  }
}
</script>
```

inner.avn
```html
<template>
  <div class="inner" ms-click="@onClick">
    {{data}}
    <slot name="content" />
  </div>
</template>
<script>
export default {
  name: 'ms-inner',
  defaults:{
    data:'inner data',
    onClick(){
      console.log('onclick')
    }
  }
}
</script>
```

Try it out!


