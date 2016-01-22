var url = require('url');
var request = require('request');
var fs = require('fs');

// appRoot set on index.js
var dbUtils = require(appRoot + '/utils/dropboxutils');
var models = require(appRoot + '/models/Slideshow');
var cache = require(appRoot + '/utils/cache');

var REDIRECT_URL_KEY = 'REDIRECT_URL';

exports.index = function(req, res){
    res.render('pages/index');
};

exports.cool = function(req, res) {
    var cool = require('cool-ascii-faces');

    var result = '';
    var times = process.env.TIMES || 5;
    for (var i = 0; i < times; i++) {
        result += cool() + "<br />";
    }
    res.send(result);
};

exports.dbauth = function(req, res) {
    var dbKey = process.env.DB_APP_KEY || '';
    var dbSecret = process.env.DB_APP_SECRET || '';
    if (dbKey === '' || dbSecret === '' ){
        return console.error('Dropbox Key or Secret not defined...');
    }

    // 2016/01/18 12:35:57, AA: According to
    // https://www.built.io/blog/2014/08/file-uploading-in-dropbox-using-node-js/
    var csrfToken = dbUtils.generateCSRFToken();
    // TODO: concatenate @ req.baby set by /baby/:baby
    // To obtain the baby in the Dropbox's reply
    // if (req.baby) csrfToken += req.baby;
    var redirectUrl = dbUtils.generateRedirectURI(req);
    cache.put(REDIRECT_URL_KEY, redirectUrl);

    console.log('REDIRECT TO: ', redirectUrl);
    console.log('CSRF: ', csrfToken);

    res.cookie('csrf', csrfToken);
    res.redirect(url.format({
        protocol: 'https',
        hostname: 'www.dropbox.com',
        pathname: '1/oauth2/authorize',
        query: {
            client_id: dbKey, //App key of dropbox api
            response_type: 'code',
            state: csrfToken,
            redirect_uri: redirectUrl
        }
    }));
};

exports.dbauthSuccess = function(req, res) {
    console.log('SUCCESS Callback called via redirect from Dropbox');

    var dbKey = process.env.DB_APP_KEY || '';
    var dbSecret = process.env.DB_APP_SECRET || '';
    if (dbKey === '' || dbSecret === '' ){
        return console.error('Dropbox Key or Secret not defined...');
    }

    if (req.query.error) {
        return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
    }

    if (req.query.state !== req.cookies.csrf) {
        return res.status(401).send(
            'CSRF token mismatch, possible cross-site request forgery attempt.'
        );
    }

    // 2016/01/18 22:20:50, AA: It has to use the same redirect created previously
    var redirectUri = cache.get(REDIRECT_URL_KEY);

    // obtaining the Bearer token
    request.post('https://api.dropbox.com/1/oauth2/token', {
        form: {
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        },
        auth: {
            user: dbKey,
            pass: dbSecret
        }
    }, function (error, response, body) {
        var data = JSON.parse(body);
        if (data.error) {
            return res.send('ERROR: ' + data.error);
        }

        var token = data.access_token;
        req.session.token = data.access_token;

        request.post('https://api.dropbox.com/1/account/info', {
            headers: { Authorization: 'Bearer ' + token }
        }, function (error, response, body) {
            res.send('Logged in successfully as ' + JSON.parse(body).display_name + '.');

            // TODO: get the baby from the req.query.state (split by @, :baby === last_part)
            //       and save the slideshow with the Bearer token on MongoDB
            //       (name = :baby, token = :token)
        });

    });
};

exports.babyindex = function(req, res) {
    var slideshow = req.params.baby;
    console.log('This is the requested slideshow: ', slideshow);
    console.log('This are the params: ', req.params);

    /*
     * using app.param(:baby)
     * If specified slideshow exists,
     *      obtain the token from MongoDB and put the token on req.token
     *      next()
     * Else redirect to /dbauth
     */

    models.Slideshow.find(function(err, slideshows) {
        if (err) return console.error(err);
        console.log(slideshows);
        res.send('Found some slideshows: ' + slideshows.length)
    });
}

exports.upload = function(req, res) {
    var media = req.params.media;

    var serverpath = media; //file to be save at what path in server
    var localpath =  global.appRoot + media; //path of the file which is to be uploaded

    console.log('I will send the following file: ', localpath);
    if (req.query.error) {
        return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
    }

    return dbUtils.fileUpload(res, req.session.token, media, media);
};

exports.metadata = function(req, res) {
    var serverpath = '.';

    console.log('I will ask for the following path: ', serverpath);
    if (req.query.error) {
        return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
    }

    return dbUtils.metadata(res, req.session.token, serverpath);
};

exports.media = function(req, res) {
    var media = req.params.media;

    console.log('I will ask for the following path: ./', media);
    if (req.query.error) {
        return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
    }

    return dbUtils.media(res, req.session.token, media);
};
