const express = require('express');
const axios = require('axios').default;

const router = express.Router();
https://api.data.amsterdam.nl/parkeervakken/geosearch/?lat=52.3458067&lon=4.9030355&item=parkeervak

    /* GET home page. */
    router.get('/', (req, res, next) => {
      res.render('index', {title: 'A Collaborative Parking Space Manager'});
    });

router.get("/geo", (req, res, next) => {
  const endpoint = "https://api.data.amsterdam.nl";
  if (req.query.lat || req.query.lng) {
    axios.get(`${endpoint}/parkeervakken/geosearch/?lat=${req.query.lat}&lon=${req.query.lng}&item=parkeervak`)
        .then(response => {
          const infoUrl = response.data[0]["_links"].self.href;
          const multiPolygon = response.data[0].geometrie.coordinates[0][0];

          axios.get(endpoint + infoUrl)
              .then(response => {
                res.json({
                  title: response.data["_display"],
                  subtitle: response.data.buurtcode
                });
              });

        });

  } else {
    res.send(404)
  }
});

module.exports = router;
