const { checkListing, getSoldList } = require('../zuseAPI');
const { getNftInfo } = require('../chainAction');

const NFTList = require('../../models/NFTList')

exports.stakeNewNfts = async (req_, res_) => {
    try {
        if (!req_.body.discordId || !req_.body.discordName || !req_.body.discriminator || !req_.body.walletId || !req_.body.nftInfo)
            return res_.send({ result: false, error: 'Invalid post data!' })

        const _discordId = atob(req_.body.discordId)
        const _discordName = atob(req_.body.discordName)
        const _discriminator = atob(req_.body.discriminator)
        const _walletId = atob(req_.body.walletId)
        const _nftInfo = req_.body.nftInfo

        //check user
        const _isRegistered = await User.findOne({ discord_id: _discordId, discord_name: _discordName + "#" + _discriminator, wallet_id: _walletId })
        if (!_isRegistered)
            return res_.send({ result: false, error: "Unregistered user!" })

        // check zuse listing
        const _listingStatus = await checkListing(atob(_nftInfo.serial_number));
        if (!_listingStatus)
            return res_.send({ result: false, error: "This NFT was listed in Zuse Marketplace! You can't stake this NFT!" })

        const _checkNFT = await NFTList.findOne({
            token_id: atob(_nftInfo.token_id),
            serial_number: atob(_nftInfo.serial_number),
        })
        let _stakedNft
        if (!_checkNFT) {
            _stakedNft = new NFTList({
                token_id: atob(_nftInfo.token_id),
                serial_number: atob(_nftInfo.serial_number),
                discord_id: _discordId,
                discord_name: _discordName + "#" + _discriminator,
                wallet_id: _walletId,
                status: "staked",
                stakedAt: Date.now()
            })
            await _stakedNft.save()
        }
        else {
            _stakedNft = await NFTList.findOneAndUpdate(
                {
                    token_id: atob(_nftInfo.token_id),
                    serial_number: atob(_nftInfo.serial_number),
                },
                {
                    discord_id: _discordId,
                    discord_name: _discordName + "#" + _discriminator,
                    wallet_id: _walletId,
                    status: "staked",
                    nft_status: "",
                    stakedAt: Date.now()
                },
                { new: true }
            )
        }

        setDaysTimeout(stakeTimerOut, 1, atob(_nftInfo.token_id), atob(_nftInfo.serial_number))

        return res_.send({ result: true, point: _stakedNft.point, reward: _stakedNft.reward, msg: "NFTs successfully staked!" })
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' })
    }
}

exports.unstake = async (req_, res_) => {
    try {
        if (!req_.body.discordId || !req_.body.discordName || !req_.body.discriminator || !req_.body.walletId || !req_.body.nftInfo)
            return res_.send({ result: false, error: 'Invalid post data!' })

        const _discordId = atob(req_.body.discordId)
        const _discordName = atob(req_.body.discordName)
        const _discriminator = atob(req_.body.discriminator)
        const _walletId = atob(req_.body.walletId)
        const _nftInfo = req_.body.nftInfo

        //check user
        const _isRegistered = await User.findOne({ discord_id: _discordId, discord_name: _discordName + "#" + _discriminator, wallet_id: _walletId })
        if (!_isRegistered)
            return res_.send({ result: false, error: "Unregistered user!" })

        await NFTList.findOneAndUpdate(
            {
                discord_id: _discordId,
                discord_name: _discordName + "#" + _discriminator,
                wallet_id: _walletId,
                token_id: atob(_nftInfo.token_id),
                serial_number: atob(_nftInfo.serial_number),
                status: "staked"
            },
            {
                status: "unstaked"
            }
        )

        return res_.send({ result: true, msg: "NFTs successfully unstaked!" })
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' })
    }
}

function setDaysTimeout(callback, days, tokenId_, serialNumber_) {
    // 86400 seconds in a day
    // let msInDay = 86400 * 1000;
    let msInDay = 600000;

    let dayCount = 0;
    let timer = setInterval(function () {
        dayCount++;  // a day has passed

        if (dayCount === days) {
            clearInterval(timer);
            callback(tokenId_, serialNumber_);
        }
    }, msInDay);
}

const stakeTimerOut = async (tokenId_, serialNumber_) => {
    // check existing
    console.log(tokenId_, serialNumber_)
    const _findStakedNftInfo = await NFTList.findOne(
        {
            token_id: tokenId_,
            serial_number: serialNumber_,
            status: "staked"
        }
    );
    if (_findStakedNftInfo === null) return;

    // check zuse listing
    const _listingStatus = await checkListing(serialNumber_);
    if (!_listingStatus) {
        // nft was listed in zuse
        // unstake nft
        await NFTList.findOneAndUpdate(
            {
                token_id: tokenId_,
                serial_number: serialNumber_,
                status: "staked"
            },
            {
                point: _findStakedNftInfo.point - parseInt((_findStakedNftInfo.point / 100) * 15, 10),
                listed: "YES",
                status: "unstaked"
            }
        )
    }
    else {
        // get nft info from mirror node
        const _nftInfo = await getNftInfo(tokenId_, serialNumber_)
        if (_nftInfo) {
            const _currentWalletId = _nftInfo.account_id
            if (_findStakedNftInfo.wallet_id != _currentWalletId) {
                // nft is transfered or sold in zuse
                const _soldList = await getSoldList()
                if (_soldList != false) {
                    let soldFlag = false
                    for (let i = 0; i < _soldList.length; i++) {
                        if (tokenId_ == _soldList[i].nftData.tokenId && parseInt(serialNumber_, 10) == _soldList[i].nftData.serialNo) {
                            // nft was sold in zuse
                            await NFTList.findOneAndUpdate(
                                {
                                    token_id: tokenId_,
                                    serial_number: serialNumber_,
                                    status: "staked"
                                },
                                {
                                    discord_id: "",
                                    discord_name: "",
                                    wallet_id: "",
                                    reward: _findStakedNftInfo.reward + 500,
                                    listed: "YES",
                                    nft_status: "sold",
                                    status: "unstaked"
                                }
                            )
                            soldFlag = true
                        }
                    }
                    if (soldFlag == false) {
                        // nft was transferred to other wallet
                        await NFTList.findOneAndUpdate(
                            {
                                token_id: tokenId_,
                                serial_number: serialNumber_,
                                status: "staked"
                            },
                            {
                                discord_id: "",
                                discord_name: "",
                                wallet_id: "",
                                nft_status: "transferred",
                                status: "unstaked"
                            }
                        )
                    }
                }
            }
            else {
                await NFTList.findOneAndUpdate(
                    {
                        token_id: tokenId_,
                        serial_number: serialNumber_
                    },
                    { point: _findStakedNftInfo.point + 5 }
                );
            }
        }
    }

    setDaysTimeout(stakeTimerOut, 1, tokenId_, serialNumber_);
}

const initLoanTimer = async () => {
    const findNftList = await NFTList.find({ status: "staked" });
    for (let i = 0; i < findNftList.length; i++) {
        const _count = Math.floor((Date.now() - findNftList[i].stakedAt) / 600000);
        const _remainTime = (Date.now() - findNftList[i].stakedAt) % 600000;

        await NFTList.findOneAndUpdate(
            {
                token_id: findNftList[i].token_id,
                serial_number: findNftList[i].serial_number
            },
            { point: 5 * _count }
        )

        setTimeout(stakeTimerOut, _remainTime, findNftList[i].token_id, findNftList[i].serial_number);
    }
}

initLoanTimer();
