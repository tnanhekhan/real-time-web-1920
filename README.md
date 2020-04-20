#A Collaborative Parking Space Manager

This is an web app where you can manage the available parking spaces within the municipality of Amsterdam with other people.

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
![Data flow diagram](docs/dataflow-diagram.png "Data flow diagram")

## Message Types
- `chat message` a normal chat message that could contain a link to a website or not.
- `video` Sends an embedded Youtube Video to the chat
