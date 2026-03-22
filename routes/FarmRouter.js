const express = require('express')
const verify = require('../middleware/jwtverification')
const {addfarm,cp,uptval,gafbyid,gfbid} = require('../controller/FarmController')
const router = express.Router();

router.post('/addfarm',verify,addfarm);
router.get('/getallfarmsbyid',verify,gafbyid)
router.get('/getsinglefarm/:id',verify,gfbid)
router.get('/cp',cp);
router.patch('/updatefarm',uptval)

module.exports = router;