module.exports = (function() {
    'use strict';
    var router = require('express').Router();
    var homeController = require('../controllers/home');

    router.get('/dbauth', homeController.dbauth);
    router.get('/dbauth/success', homeController.dbauthSuccess);
    router.get('/uploadpdf', homeController.uploadpdf);
    router.get('/metadata', homeController.metadata);

    router.get('/baby/:baby', homeController.babyindex);

    router.get('/', homeController.index);

    router.get('/cool', homeController.cool);

    return router;
})();
