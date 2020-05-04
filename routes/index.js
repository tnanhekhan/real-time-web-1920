const express = require('express');
const axios = require('axios').default;

const router = express.Router();
router.get('/', (req, res, next) => {
    res.render('index', {title: 'A Collaborative Parking Space Manager'});
});

router.get("/geo", (req, res, next) => {
    const endpoint = "https://api.data.amsterdam.nl";
    if (req.query.lat || req.query.lng) {
        axios.get(`${endpoint}/parkeervakken/geosearch/?lat=${req.query.lat}&lon=${req.query.lng}&item=parkeervak`)
            .then(geosearch => {
                const infoUrl = geosearch.data[0]["_links"].self.href;
                const multiPolygon = geosearch.data[0].geometrie.coordinates;

                axios.get(endpoint + infoUrl)
                    .then(response => {
                        axios.get(`https://api.data.amsterdam.nl/panorama/thumbnail/?lat=${req.query.lat}&lon=${req.query.lng}`)
                            .then(thumbnail => {
                                res.json({
                                    isParkingSpace: true,
                                    name: `${response.data.straatnaam}`,
                                    id: response.data.id,
                                    details: `Type: ${response.data.type} Parking Space, Buurtcode: ${response.data.buurtcode}`,
                                    multiPolygon: multiPolygon,
                                    thumb: thumbnail.data.url
                                });
                            });
                    });
            }).catch(reason => {
            res.json({
                isParkingSpace: false
            })
        });
    } else {
        res.send(404)
    }
});

module.exports = router;
