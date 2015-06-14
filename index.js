var errors = require('restberry-errors');
var GitHubStrategy = require('passport-github').Strategy;
var logger = require('restberry-logger');

var CALLBACK_PATH = '/login/github/callback';
var DEFAULT_CALLBACK_HOST = 'http://localhost';
var DEFAULT_RETURN_URL = '/';
var DEFAULT_SCHEMA = {
    email: {type: String, required: true, unique: true, lowercase: true},
    ids: {
        github: {type: String, required: true},
    },
    image: {type: String},
    name: {
        full: {type: String},
    },
    username: {type: String},
};
var DEFAULT_SCOPE = 'email';
var LOGIN_PATH = '/login/github';

function RestberryPassportGitHub() {
    this._configured = false;
    this.schema = DEFAULT_SCHEMA;
    this.callbackHost = DEFAULT_CALLBACK_HOST;
    this.clientID = undefined;
    this.clientSecret = undefined;
    this.returnURL = DEFAULT_RETURN_URL;
    this.scope = DEFAULT_SCOPE;
};

RestberryPassportGitHub.prototype.callbackURL = function() {
    var apiPath = this.restberry.waf.apiPath;
    return this.callbackHost + apiPath + CALLBACK_PATH;
};

RestberryPassportGitHub.prototype.config = function(config) {
    if (!this._configured) {
        this._configured = true;
        config = config || {};
        if (config.callbackHost)  this.callbackHost = config.callbackHost;
        if (config.returnURL)  this.returnURL = config.returnURL;
        if (config.scope)  this.scope = config.scope;
        this.clientID = config.clientID;
        this.clientSecret = config.clientSecret;
    }
    return this;
};

RestberryPassportGitHub.prototype.enable = function(next) {
    var self = this;
    if (!self.clientID || !self.clientSecret) {
        throw new Error('Need to provide clientID and clientSecret for ' +
                        'GitHub authentication');
    }
    self.passport.use(new GitHubStrategy({
        callbackURL: self.callbackURL(),
        clientID: self.clientID,
        clientSecret: self.clientSecret,
    }, function(_, _, profile, next) {
        logger.info('SESSION', 'github authenticate', profile.id);
        self.findOrCreateUser(profile._json, next);
    }));
    next(self.schema);
};

RestberryPassportGitHub.prototype.findOrCreateUser = function(profile, next) {
    var self = this;
    var User = self.restberry.auth.getUser();
    User.findOne({'ids.github': profile.id}, function(user) {
        next(undefined, user);
    }, function() {
        var user = User._create({
            email: profile.email,
            ids: {
                github: profile.id,
            },
            image: profile.avatar_url,
            name: {
                full: profile.name,
            },
            username: profile.login,
        });
        user.save(function(user) {
            next(undefined, user);
        });
    });
};

RestberryPassportGitHub.prototype.setupRoutes = function() {
    var self = this;
    var onError = self.restberry.waf.handleRes;
    var User = self.restberry.auth.getUser();
    User.routes
        .addCustomRoute({
            _controller: function() {
                return function(req, res, next) {
                    res._body = {};
                    next({});
                };
            },
            isLoginRequired: false,
            path: LOGIN_PATH,
            preAction: self.passport.authenticate('github', {
                scope: self.scope,
            }),
        })
        .addCustomRoute({
            _controller: function() {
                return function(req, res, next) {
                    logger.info('SESSION', 'github login', req.user.getId());
                    req.user.set('timestampLastLogIn', new Date());
                    req.user.save(function(user) {
                        res.redirect(self.returnURL);
                        logger.res(res, self.returnURL);
                    });
                };
            },
            isLoginRequired: false,
            path: CALLBACK_PATH,
            preAction: function(req, res, next) {
                self.passport.authenticate('github')(req, res, function(err) {
                    if (err) {
                        self.restberry.onError(errors.BadRequest, err);
                    } else {
                        next();
                    }
                });
            },
        });
};

RestberryPassportGitHub.prototype.setupUser = function(User) {
    return User;
};

module.exports = exports = new RestberryPassportGitHub;
