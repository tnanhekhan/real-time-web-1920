# A Collaborative Parking Space Manager

This is an web app where you can manage the available parking spaces within the municipality of Amsterdam with other parking space users.

[![Build Status](https://travis-ci.com/tnanhekhan/real-time-web-1920.svg?branch=staging)](https://travis-ci.com/tnanhekhan/real-time-web-1920)
[![Heroku App Status](https://heroku-shields.herokuapp.com/live-tangle)](https://live-tangle.herokuapp.com)

## Installation
Clone this repo with your favourite GIT CLI or GUI.  
CD to the root of the project folder.  
Run ` npm install ` to install this project and its necessary dependencies.  

## Usage
Run `npm dev` and go to `localhost:3002` to see the dev version running with nodemon.  
Run `npm start` and go to `localhost:3002` to see the dev version running.

## Live Version
Here is a link to the live version on Heroku: https://live-tangle.herokuapp.com/

## Data Flow Diagram
![Data flow diagram](docs/dataflow.png "Data flow diagram")

## Socket Message Types
- `chat message` a normal chat message.
- `set parking space ` Sets the availability of a parking space
- `update parking space ` Updates the availability of a parking space on the map

## Api
The API of the municipality of Amsterdam is Public Access and does not need a key.

The municipality has an API for Parking Space GeoData based on Latitude and Longitude: https://api.data.amsterdam.nl/parkeervakken/geosearch/

For the data on the map, the municipality of Amsterdam has WMS available based on OGC: https://api.data.amsterdam.nl/api/

