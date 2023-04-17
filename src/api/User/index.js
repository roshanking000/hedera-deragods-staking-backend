const express = require('express');
const router = express.Router();
const stake = require("./controller");

router.get('/user_info', stake.getUserInfo);

module.exports = router;
