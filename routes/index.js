const express = require('express');
const axios = require('axios').default;

const router = express.Router();
// https://api.data.amsterdam.nl/parkeervakken/geosearch/?lat=52.3458067&lon=4.9030355&item=parkeervak
// THUMBNAIL: https://api.data.amsterdam.nl/panorama/thumbnail/?lat=52.35596673808201&lon=4.897276997761417&width=438&radius=180

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
              const multiPolygon = response.data[0].geometrie.coordinates;

              axios.get(endpoint + infoUrl)
                  .then(response => {
                      res.json({
                          isParkingSpace: true,
                          type: `${response.data.type} Parking Space`,
                          id: response.data.id,
                          details: `Street: ${response.data.straatnaam}, Buurtcode: ${response.data.buurtcode}`,
                          multiPolygon: multiPolygon
                      });
                  });
          }).catch(reason => {
          res.json({
              isParkingSpace: false,
              title: "Parking Space",
              subtitle: "Not Found",
              details: "Please try again",
              multiPolygon: null
          })
      });
  } else {
    res.send(404)
  }
});

module.exports = router;
