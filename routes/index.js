const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('login', {
        title: 'Controller login',
        layout: './layouts/main',
    });
});

/* GET dashboard page. */
router.get('/dashboard', (req, res, next) => {
    if (req.session.isAuthenticated === true) {
        res.render('dashboard', {
            title: 'Controller Dashboard',
            layout: './layouts/main',
        });
    } else {
        res.render('login', {
            title: 'Controller login',
            layout: './layouts/main',
        });
    }
});

module.exports = router;
