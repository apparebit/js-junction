module.exports = {
  "root": true,
  "parserOptions": {
    "ecmaVersion": 8,
    "sourceType": "module",
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
    },
  },
  "env": {
    "es6": true,
    "node": true,
  },
  "extends": "eslint:recommended",
  "rules": {
    "accessor-pairs": "error",
    "array-bracket-newline": ["error", {
      "multiline": true,
    }],
    "array-bracket-spacing": ["error", "never"],
    "array-callback-return": "error",
    "arrow-body-style": ["error", "as-needed"],
    "arrow-parens": ["error", "as-needed"],
    "arrow-spacing": "error",
    "block-scoped-var": "error",
    "block-spacing": "error",
    "brace-style": ["error", "1tbs", {
      "allowSingleLine": true,
    }],
    "callback-return": "error",
    "camelcase": "error",
    "capitalized-comments": "off",
    "comma-dangle": ["error", {
      "arrays": "only-multiline",
      "objects": "only-multiline",
      "imports": "only-multiline",
      "exports": "only-multiline",
      "functions": "ignore",
    }],
    "comma-spacing": "error",
    "comma-style": "error",
    "complexity": "off",
    "computed-property-spacing": ["error", "never"],
    "consistent-return": "error",
    "consistent-this": "off",
    "curly": ["error", "multi-line", "consistent"],
    "default-case": "error",
    "dot-location": ["error", "property"],
    "dot-notation": "error",
    "eol-last": "error",
    "eqeqeq": ["error", "smart"],
    "for-direction": "error",
    "func-call-spacing": "error",
    "func-name-matching": "error",
    "func-names": ["error", "as-needed"],
    "func-style": "off",
    "generator-star-spacing": ["error", "after"],
    "getter-return": "error",
    "global-require": "error",
    "guard-for-in": "error",
    "handle-callback-err": "error",
    "id-blacklist": "off",
    "id-length": "off",
    "id-match": "off",
    "indent": ["error", 2, {
      "SwitchCase": 1,
    }],
    "init-declarations": "off",
    "jsx-quotes": "off",
    "key-spacing": ["error", {
      "singleLine": {
        "beforeColon": false,
        "afterColon": true,
      }
    }],
    "keyword-spacing": ["error", {
      "before": true,
      "after": true,
      "overrides": {
        "catch": { "after": false },
        "for": { "after": false },
        "function": { "after": false },
        "if": { "after": false },
        "switch": { "after": false },
        "void": { "after": false  },
        "while": { "after": false },
      }
    }],
    "line-comment-position": "off",
    "linebreak-style": ["error", "unix"],
    "lines-around-comment": "off",
    "lines-around-directive": "off",
    "max-depth": "off",
    "max-len": ["error", {
      "code": 100,
      "comments": 80,
      "tabWidth": 2,
      "ignoreUrls": true,
      "ignorePattern": "\\s*// ([-]+|[=]+)",
    }],
    "max-lines": "off",
    "max-nested-callbacks": "off",
    "max-params": ["error", 10],
    "max-statements": "off",
    "max-statements-per-line": ["error", {
      "max": 3,
    }],
    "multiline-ternary": ["error", "always-multiline"],
    "new-cap": ["error", {
      "newIsCap": true,
      "capIsNew": false,
    }],
    "new-parens": "error",
    "newline-after-var": "off",
    "newline-before-return": "off",
    "newline-per-chained-call": ["error", {
      "ignoreChainWithDepth": 5,
    }],
    "no-alert": "error",
    "no-array-constructor": "error",
    "no-await-in-loop": "error",
    "no-bitwise": "off",
    "no-buffer-constructor": "error",
    "no-caller": "error",
    "no-catch-shadow": "error",
    "no-confusing-arrow": "error",
    "no-console": "off",
    "no-constant-condition": ["error", {
      "checkLoops": false
    }],
    "no-continue": "off",
    "no-div-regex": "error",
    "no-duplicate-imports": "error",
    "no-else-return": "off",
    "no-empty-function": "off",
    "no-eq-null": "off",
    "no-eval": "error",
    "no-extend-native": "error",
    "no-extra-bind": "error",
    "no-extra-label": "error",
    "no-extra-parens": "off",
    "no-floating-decimal": "error",
    "no-global-assign": "error",
    "no-implicit-coercion": ["error", {
      "boolean": false,
    }],
    "no-implicit-globals": "error",
    "no-implied-eval": "error",
    "no-inline-comments": "off",
    "no-iterator": "error",
    "no-label-var": "error",
    "no-labels": ["error", {
      "allowLoop": true,
    }],
    "no-lone-blocks": "error",
    "no-lonely-if": "error",
    "no-loop-func": "error",
    "no-magic-numbers": "off",
    "no-mixed-operators": "off",
    "no-mixed-requires": "error",
    "no-multi-assign": "off",
    "no-multi-spaces": "off",
    "no-multi-str": "error",
    "no-multiple-empty-lines": ["error", {
      "max": 2,
      "maxBOF": 0,
    }],
    "no-negated-condition": "off",
    "no-nested-ternary": "off",
    "no-new": "error",
    "no-new-func": "error",
    "no-new-object": "error",
    "no-new-require": "error",
    "no-new-wrappers": "error",
    "no-octal-escape": "error",
    "no-param-reassign": "off",
    "no-path-concat": "error",
    "no-plusplus": "off",
    "no-process-env": "off",
    "no-process-exit": "error",
    "no-proto": "error",
    "no-prototype-builtins": "error",
    "no-restricted-globals": "off",
    "no-restricted-imports": "off",
    "no-restricted-modules": "off",
    "no-restricted-properties": "off",
    "no-restricted-syntax": ["error", "WithStatement"],
    "no-return-assign": "error",
    "no-return-await": "error",
    "no-script-url": "error",
    "no-self-compare": "error",
    "no-sequences": "error",
    "no-shadow": "off",
    "no-shadow-restricted-names": "error",
    "no-sync": "error",
    "no-tabs": "error",
    "no-template-curly-in-string": "error",
    "no-ternary": "off",
    "no-throw-literal": "error",
    "no-trailing-spaces": "error",
    "no-undef-init": "error",
    "no-undefined": "off",
    "no-underscore-dangle": "error",
    "no-unmodified-loop-condition": "error",
    "no-unneeded-ternary": "error",
    "no-unsafe-negation": "error",
    "no-unused-expressions": "error",
    "no-unused-vars": ["error", {
      "argsIgnorePattern": "^_+$",
      "varsIgnorePattern": "^_+$",
    }],
    "no-use-before-define": "error",
    "no-useless-call": "error",
    "no-useless-computed-key": "error",
    "no-useless-concat": "error",
    "no-useless-constructor": "error",
    "no-useless-escape": "error",
    "no-useless-rename": "error",
    "no-useless-return": "error",
    "no-var": "error",
    "no-void": "off",
    "no-warning-comments": "off",
    "no-whitespace-before-property": "error",
    "no-with": "error",
    "nonblock-statement-body-position": ["error", "beside"],
    "object-curly-newline": ["error", {
      "consistent": true,
    }],
    "object-property-newline": ["error", {
      "allowMultiplePropertiesPerLine": true,
    }],
    "object-shorthand": "error",
    "one-var": "off",
    "one-var-declaration-per-line": ["error", "initializations"],
    "operator-assignment": "off",
    "operator-linebreak": ["error", "before", {
        "overrides": { "=": "after" },
    }],
    "padding-line-between-statements": [
      "error",
      { "blankLine": "always", "prev": "directive", "next": "*" },
      { "blankLine": "any",    "prev": "directive", "next": "directive" },
      { "blankLine": "always", "prev": "*",         "next": "import" },
      { "blankLine": "any",    "prev": "import",    "next": "import" },
   ],
    "prefer-arrow-callback": ["error", {
      "allowNamedFunctions": true,
    }],
    "prefer-const": "error",
    "prefer-destructuring": "error",
    "prefer-numeric-literals": "error",
    "prefer-promise-reject-errors": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "prefer-template": "error",
    "quote-props": ["error", "consistent-as-needed"],
    "quotes": ["error", "single", {
      "avoidEscape": true,
      "allowTemplateLiterals": true,
    }],
    "radix": "error",
    "require-await": "error",
    "require-jsdoc": "off",
    "require-yield": "error",
    "rest-spread-spacing": "error",
    "semi": ["error", "always"],
    "semi-spacing": ["error", {
      "before": false,
      "after": true,
    }],
    "semi-style": ["error", "last"],
    "sort-imports": "off",
    "sort-keys": "off",
    "sort-vars": "off",
    "space-before-blocks": "error",
    "space-before-function-paren": ["error", "never"],
    "space-in-parens": "off",
    "space-infix-ops": ["error", {
      "int32Hint": false,
    }],
    "space-unary-ops": ["error", {
      "words": true,
      "nonwords": false,
      "overrides": {
        "void": false,
      },
    }],
    "spaced-comment": "off",
    "strict": ["error", "global"],
    "switch-colon-spacing": ["error", {
      "before": false,
      "after": true,
    }],
    "symbol-description": "error",
    "template-curly-spacing": ["error", "never"],
    "template-tag-spacing": ["error", "never"],
    "unicode-bom": "error",
    "valid-jsdoc": "off",
    "vars-on-top": "off",
    "wrap-iife": ["error", "inside", {
      "functionPrototypeMethods": true,
    }],
    "wrap-regex": "off",
    "yield-star-spacing": ["error", "after"],
    "yoda": ["error", "never", {
      "onlyEquality": true,
    }],
  }
};
