const mongoose = require('mongoose')

const cropschema = mongoose.Schema({
    pn:{
        type:Number
    },
    pp:{
        type:Number
    },
    pk:{
        type:Number
    },
    name:{
        type:String,
        required:true
    },
    nn:{
        type:Number
    },
    np:{
        type:Number
    },
    nk:{
        type:Number
    }
})

const Crop = mongoose.model("Crop",cropschema);
module.exports = Crop