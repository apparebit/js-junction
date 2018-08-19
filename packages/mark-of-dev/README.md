# `mark-of-dev`

> 👩‍💻  Advancing the globalization of \_\_DEV\_\_

When __mark-of-dev__ is first loaded into a process, it sets the so-called _mark
of dev_ or `global.__DEV__` to `true` for non-production runs and `false` for
production runs. This package considers a run as production if and only if the
value of `process.env.NODE_ENV` is a case-insensitive match for either `prod` or
`production`. In case of a match, this package also updates
`process.env.NODE_ENV` to the canonical `production` string, just as written.

__mark-of-dev__  is conservative in that it does not make any changes when
`__DEV__` has already been defined and in that it prevents future changes when
it defines `__DEV__` as a non-configurable, non-enumerable, and non-writable
property. It is liberal in that it works independent of how it is loaded. Both
CommonJS and ES6 are just fine. For once, that is possible because this
package's only module is executed for side effect only and thus has neither
imports nor exports.

Since __mark-of-dev__ always sets `__DEV__`, code may test for development runs
by mentioning the mark of dev by itself

```js
if (__DEV__) { ... }
```

or by making the scope explicit

```js
if (global.__DEV__) { ... }
```

Personally, I prefer the former, since it is more concise and easier to locally
override. In either case, you are well-advised to declare the new global

```javascript
"globals": { "__DEV__": false },
```

and be tolerant of its underscores

```javascript
"no-underscore-dangle": ["error", { "allow": ["__DEV__"] }],
```

so that tools such as [ESLint](https://eslint.org) continue to peacefully
coexist with your code.

🕊️   ✌️    ☮️


## Copyright and License

© 2018 [Robert Grimm](https://apparebit.com), released under the [MIT
license](LICENSE).
