Restberry-Passport-GitHub
=========================

[![](https://img.shields.io/npm/v/restberry-passport-github.svg)](https://www.npmjs.com/package/restberry-passport-github) [![](https://img.shields.io/npm/dm/restberry-passport-github.svg)](https://www.npmjs.com/package/restberry-passport-github)

Restberry Passport wrapper for passport-github.

## Install

```
npm install restberry-passport-github
```

## Usage

```
var restberryPassport = require('restberry-passport');

var auth = restberryPassport.config(function(auth) {
    ...
})
.use('github', {
    clientID: ...,
    clientSecret: ...,
    callbackHost: ...,
    returnURL: ...,
    scope: ...,
});

restberry.use(auth);
```

Two new routes have been created to the User:
- GET /login/github
- GET /login/github/callback

## Run the tests

The tests require you to have the node test app running on port 6000 and
the the index.html test file accessable at port 6001 on your localhost.
There is an nginx-conf file that is setup for this in the test directory.
Then simply run:

```
npm test
```
