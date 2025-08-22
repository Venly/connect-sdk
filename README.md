Venly Connect SDK
===

Venly Connect is a javascript SDK specifically designed to perform common blockchain tasks. It is created as a way to perform tasks that are otherwise not possible due to security
implications (e.g: creating signatures). Venly Connect wraps all of Venly's functionalities within a JavaScript layer in order to facilitate development.

Documentation on how to use it can be found on below pages:

* Introduction: https://docs.venly.io/docs/widget-overview
* Getting started: https://docs.venly.io/docs/widget-getting-started
* All of Venly's documentation: https://docs.venly.io/

## v2 Migration Guide

### Installation (changes only for head scripts)

```javascript
<script src="/node_modules/@venly/connect/umd/index.js"></script>
```

or when importing from a CDN

```javascript
<script src="https://unpkg.com/@venly/connect/umd/index.js"></script>
```

### Imports

All types/objects are now imported directly from `@venly/connect`

```javascript
import { Wallet } from "@venly/connect";
```
