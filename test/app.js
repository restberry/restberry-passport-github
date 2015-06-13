var cookieParser = require('cookie-parser');
var restberry = require('restberry');
var restberryPassport = require('restberry-passport');
var restberryPassportGitHub = require('restberry-passport-github');
var session = require('express-session');

var CLIENT_ID = 'f5080bcfde3e1c43ffcd';
var CLIENT_SECRET = 'b42090d5643e0dc9154b0c209169ca052da4d8ff';

var auth = restberryPassport
    .config(function(auth) {
        var app = restberry.waf.app;
        app.use(auth.passport.initialize());
        app.use(auth.passport.session());
    })
    .use(restberryPassportGitHub, {
        clientID: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
    });

restberry
    .config({
        apiPath: '/api/v1',
        port: 6000,
        verbose: true,
    })
    .use('express', function(waf) {
        var app = waf.app;
        app.use(cookieParser());
        app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: 'restberry',
        }));
    })
    .use(auth)
    .listen('RESTBERRY');

restberry.model('User')
    .loginRequired()
    .routes
        .addReadManyRoute({
            actions: {
                me: function(req, res, next) {
                    var User = restberry.auth.getUser();
                    req.user.options().addExpand(User.singularName());
                    req.user.toJSON(next);
                },
            },
        });
