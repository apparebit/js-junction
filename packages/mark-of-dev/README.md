# `@grr/mark-of-dev`

> Advancing the globalization of \_\_DEV\_\_

This package sets `__DEV__` to `true` in the global scope for non-production
runs, while leaving that scope unmodified for production runs. This package
considers an execution as production, if the value of `process.env.NODE_ENV`' is
either `prod` or `production`, case-insensitive. In that case, this package
updates `process.env.NODE_ENV` with the canonical `production` value.

Declaring the new global

    "globals": { "__DEV__": false },

and tolerating its underscores

    "no-underscore-dangle": ["error", { "allow": ["__DEV__"] }],

ensures that your tools, notably [ESLint](https://eslint.org), continue to
peacefully coexist with your code.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
