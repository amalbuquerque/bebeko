var app = require('express');
var url = require('url');
var crypto = require('crypto');
var request = require('request');
var fs = require('fs');

module.exports.generateRedirectURI = function(req) {
    return url.format({
        protocol: req.protocol,
        host: req.headers.host,
        pathname: req.originalUrl + '/success'
    });
};

module.exports.generateCSRFToken = function() {
    return crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
};

module.exports.fileUpload = function(res, token, localpath, serverpath) {
    var callbackAfterPut = function(err, httpResponse, bodymsg) {
        if (err || ( bodymsg && /error/.test(bodymsg) )) {
            var errorToLog = err || bodymsg;
            console.error('ERROR!: ', errorToLog);
            res.send('Sent with error!!!');
        }
        else {
            console.log(bodymsg);
            res.send('Sent successfully.');
        }
    };

    var options = { 'url' : 'https://content.dropboxapi.com/1/files_put/auto/' + serverpath,
         'headers': {
            'Authorization' : 'Bearer ' + token
        }};
    var putRequest = request.put(options, callbackAfterPut);

    fs.createReadStream(localpath).pipe(putRequest);
};

