module.exports = (function() {
    'use strict';
    var router = require('express').Router();
    var homeController = require('../controllers/home');

    router.get('/brua', homeController.brua);
    router.get('/brua/success', homeController.bruaSuccess);

    router.get('/', homeController.index);

    router.get('/cool', homeController.cool);

    return router;
})();
