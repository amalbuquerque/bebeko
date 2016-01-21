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


var simpleCallback = function(res) {
    return function(err, httpResponse, bodymsg) {
        if (err || ( bodymsg && /error/.test(bodymsg) )) {
            var errorToLog = err || bodymsg;
            console.error('ERROR!: ', errorToLog);
            res.send('Dropbox responded with error!!!');
        }
        else {
            console.log(bodymsg);
            res.send('Dropbox responded with success.');
        }
    };
};

module.exports.fileUpload = function(res, token, localpath, serverpath) {
    var options = { 'url' : 'https://content.dropboxapi.com/1/files_put/auto/' + serverpath,
         'headers': {
            'Authorization' : 'Bearer ' + token
        }};
    var callbackAfterPut = simpleCallback(res);
    var putRequest = request.put(options, callbackAfterPut);

    fs.createReadStream(localpath).pipe(putRequest);
};

module.exports.metadata = function(res, token, path) {
    var options = { 'url' : 'https://api.dropboxapi.com/1/metadata/auto/' + path,
         'headers': {
            'Authorization' : 'Bearer ' + token
        }};

    var callbackAfterGet = simpleCallback(res);

    var getRequest = request.get(options, callbackAfterGet);
}
