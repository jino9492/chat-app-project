const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
   entry: './src/index.tsx',
   output: {
	  path: path.join(__dirname, '/bundle'),
	  filename: 'index_bundle.js'
   },
   devServer: {
	  port: 3000
   },
   module: {
	  rules: [
		 {
			test: /\.js?$/,
			exclude: /node_modules/,
			loader: 'babel-loader'
		 },
		 {
			test: /\\.(png|jp(e*)g|svg|gif)$/,
			use: ['file-loader'],
		 }
	  ]
   },
   plugins:[
	  new HtmlWebpackPlugin({
		 name: "index.html",
		 inject: false,
		 template: './public/index.html'
	  })
   ]
}