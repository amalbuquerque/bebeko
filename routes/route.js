module.exports = (function() {
    'use strict';
    var router = require('express').Router();
    var cool = require('cool-ascii-faces');

    router.get('/brua', function(req, res) {
        res.json({'foo':'bar'});
    });

    router.get('/', function(request, response) {
      response.render('pages/index');
    });

    router.get('/cool', function(request, response) {
        var result = '';
        var times = process.env.TIMES || 5;
        for (var i = 0; i < times; i++) {
            result += cool() + "<br />";
        }
        response.send(result);
    });

    return router;
})();
