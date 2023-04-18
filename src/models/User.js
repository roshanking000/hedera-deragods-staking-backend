const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    discord_id: { type: String, default: "" },
    discord_name: { type: String, default: "" },
    wallet_id: { type: String, default: "" },
}, { timestamps: true });

module.exports = User = mongoose.model('User', UserSchema);
