# `@grr/mark-of-dev`

> Advancing the globalization of \_\_DEV\_\_

This package sets the global scope's `__DEV__` to `true` for non-production runs
and `false` for production runs. It considers an execution as production, if and
only if the value of `process.env.NODE_ENV` is either `prod` or `production`,
case-insensitive. In that case, it also updates updates `process.env.NODE_ENV`
to the canonical `production` value. This package has no effect if `__DEV__` is
already defined.

Declaring the new global

```javascript
"globals": { "__DEV__": false },
```

and tolerating its underscores

```javascript
"no-underscore-dangle": ["error", { "allow": ["__DEV__"] }],
```

ensures that your tools, notably [ESLint](https://eslint.org), continue to
peacefully coexist with your code.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
