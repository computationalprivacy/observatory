const path = require('path');
module.exports = {
	parser: '@typescript-eslint/parser', // Specifies the ESLint parser
	plugins: [
		'@typescript-eslint',
		'react'
		// 'prettier' commented as we don't want to run prettier through eslint because performance
	],

	env: {
		browser: true,
		jest: true
	},

	extends: [
		'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
		'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
		// 'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
		'prettier/react', // disables react-specific linting rules that conflict with prettier
		// 'plugin:prettier/recommended' // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
	],

	parserOptions: {
		project: path.resolve(__dirname, '../tsconfig.json'),
		tsconfigRootDir: __dirname,
		ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
		sourceType: 'module', // Allows for the use of imports
		ecmaFeatures: {
			jsx: true // Allows for the parsing of JSX
		}
	},

	rules: {
		// Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
		// e.g. "@typescript-eslint/explicit-function-return-type": "off",
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/no-unused-vars': 'off',

		// These rules don't add much value, are better covered by TypeScript and good definition files
		'react/no-direct-mutation-state': 'off',
		'react/no-deprecated': 'off',
		'react/no-string-refs': 'off',
		'react/require-render-return': 'off',

		'react/jsx-filename-extension': [
			'warn',
			{
				extensions: ['.jsx', '.tsx']
			}
		], // also want to use with ".tsx"
		'react/prop-types': 'off' // Is this incompatible with TS props type?
	},

	settings: {
		react: {
			version: 'detect' // Tells eslint-plugin-react to automatically detect the version of React to use
		}
	}
};
