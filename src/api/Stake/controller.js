const { checkListing } = require('../zuseAPI');

const NFTList = require('../../models/NFTList')

exports.stakeNewNfts = async (req_, res_) => {
    try {
        if (!req_.body.discordName || !req_.body.discriminator || !req_.body.walletId || !req_.body.nftInfo)
            return res_.send({ result: false, error: 'Invalid post data!' })

        const _discordName = atob(req_.body.discordName)
        const _discriminator = atob(req_.body.discriminator)
        const _walletId = atob(req_.body.walletId)
        const _nftInfo = req_.body.nftInfo

        //check user
        const _isRegistered = await User.findOne({ discord_id: _discordName + "#" + _discriminator, wallet_id: _walletId })
        if (!_isRegistered)
            return res_.send({ result: false, error: "Unregistered user!" })

        // check zuse listing
        const _listingStatus = await checkListing(atob(_nftInfo.serial_number));
        if (!_listingStatus)
            return res_.send({ result: true, msg: "This NFT was listed in Zuse Marketplace! You can't stake this NFT!" })

        const _checkNFT = await NFTList.findOne({
            token_id: atob(_nftInfo.token_id),
            serial_number: atob(_nftInfo.serial_number),
            status: "unstaked"
        })
        if (!_checkNFT) {
            const _newStakedNft = new NFTList({
                token_id: atob(_nftInfo.token_id),
                serial_number: atob(_nftInfo.serial_number),
                discord_id: _discordName + "#" + _discriminator,
                wallet_id: _walletId
            })
            await _newStakedNft.save()
        }
        else {
            await NFTList.findOneAndUpdate(
                {
                    token_id: atob(_nftInfo.token_id),
                    serial_number: atob(_nftInfo.serial_number),
                    status: "unstaked"
                },
                {
                    discord_id: _discordName + "#" + _discriminator,
                    wallet_id: _walletId,
                    status: "staked"
                }
            )
        }

        setDaysTimeout(stakeTimerOut, 1, _discordName + "#" + _discriminator, _walletId)

        return res_.send({ result: true, msg: "NFTs successfully staked!" })
    } catch (error) {
        return res_.send({ result: false, error: 'Error detected in server progress!' })
    }
}

exports.unstake = async (req_, res_) => {
    try {
        if (!req_.body.discordName || !req_.body.discriminator || !req_.body.walletId || !req_.body.nftInfo)
            return res_.send({ result: false, error: 'Invalid post data!' })

        const _discordName = atob(req_.body.discordName)
        const _discriminator = atob(req_.body.discriminator)
        const _walletId = atob(req_.body.walletId)
        const _nftInfo = req_.body.nftInfo

        //check user
        const _isRegistered = await User.findOne({ discord_id: _discordName + "#" + _discriminator, wallet_id: _walletId })
        if (!_isRegistered)
            return res_.send({ result: false, error: "Unregistered user!" })

        await NFTList.findOneAndUpdate(
            {
                discord_id: _discordName + "#" + _discriminator,
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

function setDaysTimeout(callback, days, discordId_, walletId_) {
    // 86400 seconds in a day
    let msInDay = 86400 * 1000;
    // let msInDay = 20 * 1000;

    let dayCount = 0;
    let timer = setInterval(function () {
        dayCount++;  // a day has passed

        if (dayCount === days) {
            clearInterval(timer);
            callback(discordId_, walletId_);
        }
    }, msInDay);
}

const stakeTimerOut = async (discordId_, walletId_) => {
    // check existing
    const _findStakedNftInfo = await NFTList.findOne(
        {
            discord_id: discordId_,
            wallet_id: walletId_
        }
    );
    if (_findStakedNftInfo === null) return;

    await NFTList.findOneAndUpdate(
        {
            discord_id: discordId_,
            wallet_id: walletId_
        },
        { point: _findStakedNftInfo.point + 5 }
    );
    setDaysTimeout(stakeTimerOut, 1, discordId_, walletId_);
}
