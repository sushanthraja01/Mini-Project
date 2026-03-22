const axios = require('axios')
const Farm = require('../models/Farm')
const Farmer = require('../models/Farmer');
const Crop = require('../models/Crop');

const addfarm = async(req,res) => {
    const {lat,lan,name,size,locname,n,p,k} = req.body || {};

    if(!lat || !lan || !name || !size || !locname){
        return res.status(200).send("Location is Required");
    }
    try {
        const f = await Farmer.findById(req.fid);
        if(!f){
            return res.status(200).send({"status":"error","mssg":"Farmer not found"})
        }
        const farm = new Farm({
            name,
            size,
            locname,
            lat,
            lan,
            locname,
            n,p,k,fn:n,fp:p,fk:k,
            farmers: f._id
        })
        const ffarm = await farm.save();
        f.farms.push(ffarm._id);
        await f.save();
        return res.status(200).send({"mssg":"Farm added Successfully"})
    } catch (error) {
        console.log("Error at Add Farm",error)
        return res.status(400).send("Internal Server Error")
    }
}




const cropPrediction = async (req, res) => {
    const { farmId, temperature, humidity, rainfall } = req.body;

    try {

        if (!farmId) {
            return res.status(400).send({
                status: "error",
                msg: "Farm ID is required"
            });
        }

        const farm = await Farm.findById(farmId);

        if (!farm) {
            return res.status(404).send({
                status: "error",
                msg: "Farm not found"
            });
        }

        if (!farm.n || !farm.p || !farm.k || !farm.ph) {
            return res.status(400).send({
                status: "error",
                msg: "Please fill N, P, K and pH values before prediction"
            });
        }

        let avgTemp, avgHumidity, avgRain;

        if (temperature && humidity && rainfall) {

            avgTemp = Number(temperature);
            avgHumidity = Number(humidity);
            avgRain = Number(rainfall);

        } 
        else {

            const lat = farm.lat;
            const lon = farm.lan;

            const API_KEY = process.env.WEATHER_API_KEY || process.env.VISUAL_KEY;

            const url =
            `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}?unitGroup=metric&include=days&key=${API_KEY}&contentType=json`;

            const weatherResponse = await axios.get(url);

            const days = weatherResponse.data?.days?.slice(0, 180);

            if (!days || days.length === 0) {
                return res.status(500).send({
                    status: "error",
                    msg: "Weather data unavailable"
                });
            }

            let temp = 0;
            let hum = 0;
            let rain = 0;

            days.forEach((d) => {
                temp += Number(d.temp) || 0;
                hum += Number(d.humidity) || 0;
                rain += Number(d.precip) || 0;
            });

            avgTemp = temp / days.length;
            avgHumidity = Math.max(hum / days.length, 40);
            avgRain = rain / 6;
        }

        const mlResponse = await axios.post(
            "http://localhost:5000/predict",
            {
                N: Number(farm.n),
                P: Number(farm.p),
                K: Number(farm.k),
                ph: Number(farm.ph),
                temperature: avgTemp,
                humidity: avgHumidity,
                rainfall: avgRain
            }
        );

        return res.status(200).send({
            status: "success",
            predictedCrop: mlResponse.data.predicted_crop,
            weatherUsed: {
                temperature: avgTemp,
                humidity: avgHumidity,
                rainfall: avgRain
            }
        });

    } catch (error) {

        console.log("Crop Prediction Error:", error.response?.data || error.message);

        return res.status(500).send({
            status: "error",
            msg: "Internal Server Error"
        });
    }
};

const updateSoilValues = async (req, res) => {

    const { farmId, n, p, k, ph } = req.body;

    try {

        const farm = await Farm.findById(farmId);

        if (!farm) {
            return res.status(404).send({
                status: "error",
                msg: "Farm not found"
            });
        }

        farm.n = n;
        farm.p = p;
        farm.k = k;
        farm.ph = ph;

        await farm.save();

        return res.status(200).send({
            status: "success",
            msg: "Soil values updated successfully",
            farm
        });

    } catch (error) {

        console.log("Error updating soil values:", error);

        return res.status(500).send({
            status: "error",
            msg: "Internal Server Error"
        });
    }
};


const getallfarmsbyid = async(req,res) => {
    try {
        const farmer = await Farmer.findById(req.fid);
        if(!farmer){
            return res.status(200).send({"Status":"error","mssg":"Token is Required"});
        }
        const farms = await Farm.find({farmers:farmer._id})
        if(farms.length===0){
            return res.status(200).send({"status":"success","mssg":"No Products","farms":farms})
        }
        return res.status(200).send({"status":"success","farms":farms})
    } catch (error) {
        console.log("error at getfarmsbyid",error);
        return res.status(400).send({"status":"error","mssg":"internal server error"})
    }
}

const getsinglefarmbyid = async (req, res) => {
    try {
        const farmId = req.params.id; 
        const farmerId = req.fid;

        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            return res.status(401).json({
                status: "error",
                message: "Please login first"
            });
        }

        
        const farm = await Farm.findOne({
            _id: farmId,
            farmers: farmerId
        })
        .populate("crops")
        .populate("farmers");


        if (!farm) {
            return res.status(403).json({
                status: "error",
                message: "Unauthorized access or farm not found"
            });
        }

        
        return res.status(200).json({
            status: "success",
            data: farm
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};


module.exports = {addfarm,cp:cropPrediction,uptval:updateSoilValues,gafbyid:getallfarmsbyid,gfbid:getsinglefarmbyid};