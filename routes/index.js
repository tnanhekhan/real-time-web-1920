const express = require('express');

const router = express.Router();
router.get('/', (req, res, next) => {
    res.render('index', {title: 'A Collaborative Parking Space Manager'});
});

module.exports = router;
