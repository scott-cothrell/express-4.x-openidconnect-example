var express = require('express');
var passport = require('passport');
var Strategy = require('passport-openidconnect').Strategy;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


passport.use(new Strategy({
    clientID: 'clientID',
    clientSecret: 'Secret',

    authorizationURL: 'http://your target name here:8080/openam/oauth2/testrealm/authorize',

    tokenURL: 'http://your target name here:8080/openam/oauth2/testrealm/access_token',

    userInfoURL: 'http://your target name here:8080/openam/oauth2/testrealm/userinfo',

    callbackURL: 'http://localhost:3000/callback',
    scope: 'mail profile',
    scopeSeparator: ' '
  },
  function(token, tokenSecret, profile, jwtClaims, accessToken, refreshToken, params, cb) {
      var loc = profile;

    return cb(null, {profile, jwtClaims, accessToken, refreshToken, params} );
  }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.locals.pretty = true;

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
  function(req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  function(req, res){
    res.render('login');
  });

app.get('/login/idp',
  passport.authenticate('openidconnect'));

app.get('/callback', 
  passport.authenticate('openidconnect', { failureRedirect: '/login' }),
  function(req, res) {
    if (req.user) {
        console.log('Got a user');

    }
    res.redirect('/');
  });
var claims;
app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    console.log('User authenticated');
      claims = req.user.jwtClaims;


    res.render('profile', { user: req.user });
  });

app.listen(3000);
