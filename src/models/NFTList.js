const mongoose = require('mongoose');
const NFTListSchema = new mongoose.Schema({
  token_id: { type: String, default: "" },
  serial_number: { type: String, default: "" },
  discord_id: { type: String, default: "" },
  wallet_id: { type: String, default: "" },
  point: { type: Number, default: 0 },
  never_listed: { type: String, default: "OK" },
  status: { type: String, default: "staked" }
}, { timestamps: true });

module.exports = NFTList = mongoose.model('NFTList', NFTListSchema);
