const express = require('express');
const router = express.Router();
const stake = require("./controller");

router.get('/get_stake_info', stake.getStakeInfo);

router.post('/stake_new_nfts', stake.stakeNewNfts);
router.post('/unstake', stake.unstake);

module.exports = router;
