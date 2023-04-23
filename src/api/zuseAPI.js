const axios = require('axios');

// const DERAGODS_NFT_ID = "0.0.1099951";
const DERAGODS_NFT_ID = "0.0.1122159";

exports.getFloorPrice = async () => {
    try {
        var config = {
            method: 'get',
            url: `https://hedera-nft-backend.herokuapp.com/api/collectioninfo/${DERAGODS_NFT_ID}`,
            headers: {
                'origin': 'https://zuse.market'
            }
        };

        let floorPrice = 0

        await axios(config)
            .then(function (res) {
                if (res.data !== null)
                    floorPrice = res.data.collectionStats.floor
            })
            .catch(function (error) {
                console.log(error);
                return floorPrice;
            });
        
        const DEFAULT_HBAR_PRICE = 0.065

        const _hbarResult = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd');
        if (_hbarResult.result == false)
            return (floorPrice*DEFAULT_HBAR_PRICE).toFixed(3)
        else {
            if (_hbarResult)
                return parseFloat(floorPrice*_hbarResult.data["hedera-hashgraph"].usd).toFixed(3)
            else
                return (floorPrice*DEFAULT_HBAR_PRICE).toFixed(3)
        }
    } catch (error) {
        return false;
    }
}

exports.getListingData = async () => {
    try {
        var config = {
            method: 'get',
            url: `https://hedera-nft-backend.herokuapp.com/collection/${DERAGODS_NFT_ID}`,
            headers: {
                'origin': 'https://zuse.market'
            }
        };

        let _listingData

        await axios(config)
            .then(function (res) {
                _listingData = res.data
            })
            .catch(function (error) {
                console.log(error);
                return false;
            });
        return _listingData
    } catch (error) {
        return false;
    }
}

exports.checkListing = async (serialNumber_) => {
    try {
        var config = {
            method: 'get',
            url: `https://hedera-nft-backend.herokuapp.com/collection/${DERAGODS_NFT_ID}`,
            headers: {
                'origin': 'https://zuse.market'
            }
        };

        let _res = true;

        await axios(config)
            .then(function (res) {
                for (let i = 0; i < res.data.length; i++) {
                    if (res.data[i].nftData.serialNo === parseInt(serialNumber_, 10)) {
                        _res = false;
                    }
                }
            })
            .catch(function (error) {
                console.log(error);
                return false;
            });
        return _res
    } catch (error) {
        return false;
    }
}

exports.getSoldList = async () => {
    try {
        var config = {
            method: 'get',
            url: `https://hedera-nft-backend.herokuapp.com/collectionactivity/${DERAGODS_NFT_ID}`,
            headers: {
                'origin': 'https://zuse.market'
            }
        };

        let _soldList = []
        await axios(config)
            .then(function (res) {
                for (let i = 0; i < res.data.length; i++) {
                    if (res.data[i].buyerAcc != undefined && Date.now() - new Date(res.data[i].updatedAt) < 86400000)
                        _soldList.push(res.data[i])
                }
            })
            .catch(function (error) {
                console.log(error);
                return false;
            });

        return _soldList
    } catch (error) {
        return false;
    }
}
