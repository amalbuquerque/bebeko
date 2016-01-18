var dbUtils = require('../utils/dropboxutils');
var url = require('url');

exports.index = function(req, res){
    res.render('pages/index');
};

exports.cool = function(request, response) {
    var cool = require('cool-ascii-faces');

    var result = '';
    var times = process.env.TIMES || 5;
    for (var i = 0; i < times; i++) {
        result += cool() + "<br />";
    }
    response.send(result);
};

exports.brua = function(req, res) {
    var dbKey = process.env.DB_APP_KEY || '';
    var dbSecret = process.env.DB_APP_SECRET || '';
    if (dbKey === '' || dbSecret === '' ){
        return console.error('Dropbox Key or Secret not defined...');
    }

    // 2016/01/18 12:35:57, AA: According to
    // https://www.built.io/blog/2014/08/file-uploading-in-dropbox-using-node-js/
    var csrfToken = dbUtils.generateCSRFToken();
    var redirectUrl = dbUtils.generateRedirectURI(req);
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
            redirect_uri: dbUtils.generateRedirectURI(req)
        }
    }));
};

exports.bruaSuccess = function(req, res) {
    console.log('SUCCESS Callback called from redirect from DB');

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

    request.post('https://api.dropbox.com/1/oauth2/token', {
        form: {
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: dbUtils.generateRedirectURI(req)
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
        req.session.token=data.access_token;
        request.post('https://api.dropbox.com/1/account/info', {
            headers: { Authorization: 'Bearer ' + token }
        }, function (error, response, body) {
            res.send('Logged in successfully as ' + JSON.parse(body).display_name + '.');
        });

    });
};
