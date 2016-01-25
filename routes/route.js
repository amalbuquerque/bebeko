module.exports = (function() {
    'use strict';
    var router = require('express').Router();
    var homeController = require('../controllers/home');

    // /dbauth?baby=xpto
    router.get('/dbauth', homeController.dbauth);
    router.get('/dbauth/success', homeController.dbauthSuccess);

    router.get('/upload/:baby/:media', homeController.upload);
    router.get('/media/:baby/:media', homeController.media);
    router.get('/metadata/:baby', homeController.metadata);

    router.get('/baby/:baby', homeController.babyIndex);
    router.get('/baby/:baby/:day', homeController.babyDay);

    router.get('/', homeController.index);

    router.get('/cool', homeController.cool);

    return router;
})();
