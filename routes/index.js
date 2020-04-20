const express = require('express');
const axios = require('axios').default;

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'A Collaborative Parking Space Manager' });
});

module.exports = router;
