require('dotenv').config()

const mongoose = require("mongoose");
const uri = process.env["MONG_URI"];
const parkingSpaceSchema = new mongoose.Schema({
    id: Number,
    coordinates: Array,
    details: String,
    name: String,
    isClaimed: Boolean
});
const ParkingSpaceModel = mongoose.model('ClaimedParkingSpace', parkingSpaceSchema);

mongoose.connection.on('close', () => {
    mongoose.connection.removeAllListeners();
});

function disconnect() {
    mongoose.disconnect();
}

exports.ParkingSpaceSchema = parkingSpaceSchema;
exports.ParkingSpaceModel = ParkingSpaceModel;
exports.uri = uri;
exports.client = mongoose;
exports.db = mongoose.connection;
exports.disconnect = disconnect;
