const mongoose = require('mongoose');

const cropschema = mongoose.Schema({
    pn: Number,
    pp: Number,
    pk: Number,

    name: {
        type: String,
        required: true
    },

    nn: Number,
    np: Number,
    nk: Number,

    recordedAt: {
        type: Date,
        default: Date.now
    }
});

const Crop = mongoose.model("Crop", cropschema);
module.exports = Crop;