module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier"
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "ecmaFeatures": {
			"jsx": true // Allows for the parsing of JSX
		}
    },
    "plugins": [
        "react",
        "@typescript-eslint"
    ],
    "rules": {
        '@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
        'react/no-direct-mutation-state': 'off',
		'react/no-deprecated': 'off',
		'react/no-string-refs': 'off',
		'react/require-render-return': 'off',
		'react/no-unescaped-entities': 'off',
        'react/prop-types': 'off'
    },
    "settings": {
        "react": {
          "version": "detect"
        }
    }
}
