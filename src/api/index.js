const express = require('express')
const router = express.Router()

const Stake = require("./Stake")
const User = require("./User")

router.use("/stake", Stake)
router.use("/user", User)

module.exports = router
