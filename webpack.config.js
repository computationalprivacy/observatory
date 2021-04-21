const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');


const devMode = process.env.NODE_ENV !== 'production';
const swSrc = path.join(__dirname, 'src', 'service-worker')


module.exports = {
	mode: devMode ? 'development' : 'production',
	entry: {
		app: path.join(__dirname, 'src', 'index.tsx')
	},

	target: 'web',
	resolve: {
		extensions: ['.ts', '.tsx', '.js']
	},

	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				exclude: '/node_modules/',
				options: {
					// disable type checker - we will use it in fork plugin
					transpileOnly: true
				}
			},
			{
				test: /\.css$/i,
				use: [
					devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
					'css-loader'
				],
			},


			{
				test: /\.less$/,
				use: [{
				  loader: 'style-loader',
				}, {
				  loader: 'css-loader', // translates CSS into CommonJS
				}, {
				  loader: 'less-loader', // compiles Less to CSS
			     options: {
			       lessOptions: { // If you are using less-loader@5 please spread the lessOptions to options directly
			// +         modifyVars: {
			// +           'primary-color': '#1DA57A',
			// +           'link-color': '#1DA57A',
			// +           'border-radius-base': '2px',
			// +         },
			         javascriptEnabled: true,
			       },
			     },
			}]
			},

			{
				test: /\.worker\.js$/,
				use: { loader: 'worker-loader' },
			},
		],
	},

	output: {
		filename: '[name].bundle.js',
		publicPath: './',
		path: path.resolve(__dirname, 'dist')
	},

	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(__dirname, 'src', 'index.html')
		}),
		new HtmlWebpackPlugin({
			filename: '200.html',
			template: path.join(__dirname, 'src', 'index.html')
		}),
		new MiniCssExtractPlugin({
			filename: devMode ? '[name].css' : '[name].[hash].css'
		}),
		new CopyPlugin({
			patterns:[
				{ from: 'static' }
			]
		}),
		new ForkTsCheckerWebpackPlugin({
			eslint: {
				files: './src/**/*.{ts,tsx,js,jsx}' // required - same as command `eslint ./src/**/*.{ts,tsx,js,jsx} --ext .ts,.tsx,.js,.jsx`
			}
		}),
		new WorkboxWebpackPlugin.InjectManifest({
			swSrc,
			dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
			exclude: [/\.map$/, /asset-manifest\.json$/, /LICENSE/],
			// Bump up the default maximum size (2mb) that's precached,
			// to make lazy-loading failure scenarios less likely.
			// See https://github.com/cra-template/pwa/issues/13#issuecomment-722667270
			maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
		  })
	],

	devServer: {
		compress: true,
		port: 8080,
		historyApiFallback: true
	},

	optimization: {
		usedExports: true,
		splitChunks: {
			chunks: 'all'
		},
		minimizer: [new TerserPlugin({}), new OptimizeCSSAssetsPlugin({})]
	}
};

if (devMode) {
	module.exports.devtool = "source-map";
	module.exports.module.rules.push({
		enforce: 'pre',
		test: /\.js$/,
		loader: 'source-map-loader'
	});
}
