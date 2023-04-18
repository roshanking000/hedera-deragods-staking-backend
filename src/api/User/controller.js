const { checkListing, getSoldList } = require('../zuseAPI');
const { getNftInfo } = require('../chainAction');

const User = require('../../models/User')
const NFTList = require('../../models/NFTList')

exports.getUserInfo = async (req_, res_) => {
    try {
        if (!req_.query.discordName || !req_.query.discriminator || !req_.query.walletId)
            return res_.send({ result: false, error: 'Invalid post data!' });

        const _discordName = req_.query.discordName
        const _discriminator = req_.query.discriminator
        const _walletId = req_.query.walletId
        const _nftData = JSON.parse(req_.query.nftData)

        const _isRegistered = await User.findOne({ discord_id: _discordName + "#" + _discriminator, wallet_id: _walletId })
        if (!_isRegistered) {
            const _newUser = new User({
                discord_id: _discordName + "#" + _discriminator,
                wallet_id: _walletId
            })
            await _newUser.save()
        }

        for (let i = 0; i < _nftData.length; i++) {
            const _stakedNft = await NFTList.findOne({
                token_id: _nftData[i].token_id,
                serial_number: _nftData[i].serial_number,
                status: "staked"
            })

            if (_stakedNft != null) {
                // check zuse listing
                const _listingStatus = await checkListing(_stakedNft.serial_number);
                if (!_listingStatus) {
                    // nft was listed in zuse
                    // unstake nft
                    await NFTList.findOneAndUpdate(
                        {
                            token_id: _stakedNft.token_id,
                            serial_number: _stakedNft.serial_number,
                            status: "staked"
                        },
                        {
                            point: parseInt((_stakedNft.point / 100) * 15, 10),
                            status: "unstaked",
                            listed: "YES"
                        }
                    )
                }
                else {
                    // get nft info from mirror node
                    const _nftInfo = await getNftInfo(_stakedNft.token_id, _stakedNft.serial_number)
                    if (_nftInfo) {
                        const _currentWalletId = _nftInfo.account_id
                        if (_stakedNft.wallet_id != _currentWalletId) {
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
                                                status: "staked"
                                            },
                                            {
                                                discord_id: "",
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
                                if (soldFlag == false) {
                                    // nft was transferred to other wallet
                                    await NFTList.findOneAndUpdate(
                                        {
                                            token_id: _stakedNft.token_id,
                                            serial_number: _stakedNft.serial_number,
                                            status: "staked"
                                        },
                                        {
                                            discord_id: "",
                                            wallet_id: "",
                                            status: "unstaked",
                                            nft_status: "transferred"
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // get staked nft list
        const _stakedNfts = await NFTList.find({
            discord_id: _discordName + "#" + _discriminator,
            wallet_id: _walletId,
            status: "staked"
        })

        return res_.send({ result: true, data: _stakedNfts, msg: "success" });
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' });
    }
}
