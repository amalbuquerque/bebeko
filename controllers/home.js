var url = require('url');
var request = require('request');
var fs = require('fs');
var util = require('util');

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
    // /baby/xpto redirect to /dbauth/xpto
    // if there is no slideshow.name === 'xpto'
    var slideshowName = req.query.baby;

    var dbKey = process.env.DB_APP_KEY || '';
    var dbSecret = process.env.DB_APP_SECRET || '';

    if (dbKey === '' || dbSecret === '' ){
        var msg = 'Dropbox Key or Secret not defined...';
        console.error(msg);
        return res.send(msg);
    }

    if (!slideshowName) {
        var msg = 'No baby name passed via URL...';
        console.error(msg);
        return res.send(msg);
    }

    // 2016/01/18 12:35:57, AA: According to
    // https://www.built.io/blog/2014/08/file-uploading-in-dropbox-using-node-js/
    var csrfToken = dbUtils.generateCSRFToken();
    // Concatenate '@req.params.baby' set by /baby/:baby
    // when redirected to /dbauth/:baby
    csrfToken += ('@' + slideshowName);

    var redirectUrl = dbUtils.generateRedirectURI(req);
    cache.put(REDIRECT_URL_KEY, redirectUrl);

    console.log('REDIRECT TO: ', redirectUrl);
    console.log('CSRF: ', csrfToken);

    // set the CSRF server-side
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

    // compare the query.state which came from DB callback
    // with the CSRF stored server-side (cookies)
    if (req.query.state !== req.cookies.csrf) {
        return res.status(401).send(
            'CSRF token mismatch, possible cross-site request forgery attempt.');
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
        // TODO: saving the token in session is not needed now
        req.session.token = data.access_token;

        request.post('https://api.dropbox.com/1/account/info', {
            headers: { Authorization: 'Bearer ' + token }
        }, function (error, response, body) {
            console.log('Logged in successfully as ' + JSON.parse(body).display_name + '.');

            var afterCreateSlideshow = function(ss) {
                console.log('Created (or updated) the slideshow!!! ', ss);
                res.redirect(util.format('/baby/%s', ss.name));
            };

            // slideshowName came in the last part of the CSRF sent by DB (req.query.state)
            // (split by @, slideshowName === splitResult[1])
            var slideshowName = req.query.state.split('@')[1];
            // and save the slideshow with the Bearer token on MongoDB
            createOrUpdateSlideshow(slideshowName, token, afterCreateSlideshow);
        });
    });
};

var createOrUpdateSlideshow = function(slideshowName, token, successCallback) {
    models.Slideshow.findOne({ 'name' : slideshowName })
        .select().exec(function(err, slideshowObj) {
            if (err) return console.error(err);

            console.log('Obtained slideshow:', slideshowObj);

            if(slideshowObj){
                console.log('slideshow exists, will update token');
                slideshowObj.token = token;

                // TODO: obtain metadata of the root folder
                // to fill .hash (and to fetch the contents of the folder
                slideshowObj.hash = 'dumbHash';

                // to afterwards obtain for each photo its 'streamable' link).
                // .expirydate should be updated with the expiry date
                // of the first obtained streamable link

                slideshowObj.photos = [ { 'key' : 'brua', 'url' : 'www.sapo.pt' } ];
            } else {
                slideshowObj = new models.Slideshow(
                    { 'name': slideshowName, 'token': token,
                        'hash': 'newDumbHash',
                        'photos': [ { 'key' : 'newww', 'url' : 'www.expresso.pt' } ]
                    });
            }
            slideshowObj.save(function(err, obj) {
                if (err) return console.error(err);
                console.log('Slideshow saved OK');

                return successCallback(obj);
            });
        });
};

    /* TODO: Next step is to use a preliminar step (with app.param) to obtain the slideshow
     * from the DB
     * using app.param(:baby)
     * If specified slideshow exists,
     *      obtain the token from MongoDB and put the token on req.token
     *      next()
     * Else redirect to /dbauth
     */

exports.babyIndex = function(req, res) {
    var slideshowName = req.params.baby;
    console.log('This is the requested slideshow: ', slideshowName);

    models.Slideshow.findOne({ 'name' : slideshowName })
        .select().exec(function(err, slideshowObj) {
            if (err) return console.error(err);

            console.log('Obtained slideshow:', slideshowObj);

            if(slideshowObj){
                req.session.slideshow = slideshowObj;
                var urlToRedirect =
                    util.format('/baby/%s/last', slideshowObj.name);
                console.log('Will redirect to ', urlToRedirect);
                res.redirect(urlToRedirect);
            } else {
                res.redirect('/dbauth?baby=' + slideshowName);
            }
    });
}

exports.babyDay = function(req, res) {
    var slideshowName = req.params.baby;
    var day = req.params.day;
    console.log('BABYDAY: This is the requested slideshow: ', slideshowName);
    console.log('BABYDAY: This is the requested day: ', day);

    if (!req.session.slideshow) {
        return res.redirect('/baby/' + slideshowName);
    } else {
        var slideshow = req.session.slideshow;
        // TODO: With this response, on the client side I should be able to show the photos
        res.send('FOUNDDDD a slideshow, it was on session ' + JSON.stringify(slideshow, null, 2));
    }
}


exports.upload = function(req, res) {
    var media = req.params.media;
    var slideshow = req.session.slideshow;

    if (!slideshow || !media ||
        // if slideshow in session does not correspond to :baby
        slideshow.name !== req.params.baby) {
        return res.redirect('/baby/' + req.params.baby);
    }

    // var serverpath = media; //file to be save at what path in server
    // var localpath =  global.appRoot + media; //path of the file which is to be uploaded

    console.log('I will send the following file: ', media);
    if (req.query.error) {
        return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
    }

    return dbUtils.fileUpload(res, slideshow.token, media, media);
};

exports.metadata = function(req, res) {
    var serverpath = '.';
    var slideshow = req.session.slideshow;

    if (!slideshow ||
        // if slideshow in session does not correspond to :baby
        slideshow.name !== req.params.baby) {
        return res.redirect('/baby/' + req.params.baby);
    }

    console.log('I will ask for the following path: ', serverpath);
    if (req.query.error) {
        return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
    }

    return dbUtils.metadata(res, slideshow.token, serverpath);
};

exports.media = function(req, res) {
    var media = req.params.media;
    var slideshow = req.session.slideshow;

    if (!slideshow || !media ||
        // if slideshow in session does not correspond to :baby
        slideshow.name !== req.params.baby) {
        return res.redirect('/baby/' + req.params.baby);
    }

    console.log('I will ask for the following path: ./', media);
    if (req.query.error) {
        return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
    }

    return dbUtils.media(res, slideshow.token, media);
};
