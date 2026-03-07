const express = require('express')
const {reg,log} = require('../controller/FarmerController')
const router = express.Router();


router.get("/login",log);
router.post("/register",reg);

module.exports = router