const mongoose = require('mongoose');
const NFTListSchema = new mongoose.Schema({
  token_id: { type: String, default: "" },
  serial_number: { type: String, default: "" },
  discord_id: { type: String, default: "" },
  discord_name: { type: String, default: "" },
  wallet_id: { type: String, default: "" },
  point: { type: Number, default: 0 },
  reward: { type: Number, default: 0 },
  listed: { type: String, default: "NO" },
  status: { type: String, default: "staked" },
  nft_status: { type: String, default: "" },
  stakedAt: { type: Date }
}, { timestamps: true });

module.exports = NFTList = mongoose.model('NFTList', NFTListSchema);
