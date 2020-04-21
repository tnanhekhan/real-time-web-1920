const express = require('express');
const axios = require('axios').default;

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', {title: 'A Collaborative Parking Space Manager'});
});

router.get("/data/json", (req, res, next) => {
  res.send({
    hello: "wazza"
  })
});

module.exports = router;
