const { checkListing, getSoldList } = require('../zuseAPI');
const { getNftInfo } = require('../chainAction');

const User = require('../../models/User')
const NFTList = require('../../models/NFTList')

exports.getUserInfo = async (req_, res_) => {
    try {
        if (!req_.query.discordName || !req_.query.discriminator || !req_.query.discordId || !req_.query.walletId)
            return res_.send({ result: false, error: 'Invalid post data!' });

        const _discordName = req_.query.discordName
        const _discriminator = req_.query.discriminator
        const _discordId = req_.query.discordId
        const _walletId = req_.query.walletId
        const _nftData = JSON.parse(req_.query.nftData)

        const _isRegistered = await User.findOne({ discord_id: _discordId, discord_name: _discordName + "#" + _discriminator, wallet_id: _walletId })
        if (!_isRegistered) {
            const _newUser = new User({
                discord_id: _discordId,
                discord_name: _discordName + "#" + _discriminator,
                wallet_id: _walletId
            })
            await _newUser.save()
        }

        for (let i = 0; i < _nftData.length; i++) {
            let _newFlag = false
            let _stakedNft = await NFTList.findOne({
                token_id: _nftData[i].token_id,
                serial_number: _nftData[i].serial_number,
            })

            if (_stakedNft == null) {
                _stakedNft = new NFTList({
                    token_id: _nftData[i].token_id,
                    serial_number: _nftData[i].serial_number,
                    discord_id: _discordId,
                    discord_name: _discordName + "#" + _discriminator,
                    wallet_id: _walletId,
                    status: "unstaked"
                })
                await _stakedNft.save()
                _newFlag = true
            }

            // check zuse listing
            const _listingStatus = await checkListing(_stakedNft.serial_number);
            if (!_listingStatus) {
                // nft was listed in zuse
                // unstake nft
                await NFTList.findOneAndUpdate(
                    {
                        token_id: _stakedNft.token_id,
                        serial_number: _stakedNft.serial_number,
                    },
                    {
                        point: _stakedNft.point - parseInt((_stakedNft.point / 100) * 15, 10),
                        status: "unstaked",
                        listed: "YES"
                    }
                )
            }
            else {
                // nft is transfered or sold in zuse
                const _soldList = await getSoldList()
                if (_soldList != false) {
                    let soldFlag = false
                    for (let j = 0; j < _soldList.length; j++) {
                        if (_stakedNft.token_id == _soldList[j].nftData.tokenId && parseInt(_stakedNft.serial_number, 10) == _soldList[j].nftData.serialNo) {
                            // nft was sold in zuse
                            await NFTList.findOneAndUpdate(
                                {
                                    token_id: _stakedNft.token_id,
                                    serial_number: _stakedNft.serial_number,
                                },
                                {
                                    discord_id: "",
                                    discord_name: "",
                                    wallet_id: "",
                                    status: "unstaked",
                                    reward: _stakedNft.reward + 500,
                                    listed: "YES",
                                    nft_status: "sold"
                                }
                            )
                            soldFlag = true
                        }
                    }
                    if (soldFlag == false && _newFlag == true) {
                        // nft was transferred to other wallet
                        await NFTList.findOneAndUpdate(
                            {
                                token_id: _stakedNft.token_id,
                                serial_number: _stakedNft.serial_number,
                            },
                            {
                                discord_id: "",
                                discord_name: "",
                                wallet_id: "",
                                status: "unstaked",
                                nft_status: "transferred"
                            }
                        )
                    }
                }
            }
        }

        // get staked nft list
        const _stakedNfts = await NFTList.find({
            discord_id: _discordId,
            discord_name: _discordName + "#" + _discriminator,
            wallet_id: _walletId,
            status: "staked"
        })

        return res_.send({ result: true, data: _stakedNfts, msg: "success" });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}
