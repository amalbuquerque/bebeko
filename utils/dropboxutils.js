var app = require('express');
var url = require('url');
var crypto = require('crypto');

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
