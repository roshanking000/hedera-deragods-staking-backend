const User = require('../../models/User')
const NFTList = require('../../models/NFTList')

exports.getUserInfo = async (req_, res_) => {
    try {
        console.log(req_.query.discordName, req_.query.discriminator, req_.query.walletId)
        if (!req_.query.discordName || !req_.query.discriminator || !req_.query.walletId)
            return res_.send({ result: false, error: 'Invalid post data!' });

        const _discordName = req_.query.discordName
        const _discriminator = req_.query.discriminator
        const _walletId = req_.query.walletId

        const _isRegistered = await User.findOne({ discord_id: _discordName + "#" + _discriminator, wallet_id: _walletId })
        if (!_isRegistered) {
            const _newUser = new User({
                discord_id: _discordName + "#" + _discriminator,
                wallet_id: _walletId
            })
            await _newUser.save()
        }

        // get staked nft list
        const _stakedNftList = await NFTList.find({
            discord_id: _discordName + "#" + _discriminator,
            wallet_id: _walletId,
            status: "staked"
        })
        return res_.send({ result: true, data: _stakedNftList, msg: "success" });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}
