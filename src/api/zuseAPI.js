const axios = require('axios');

const DERAGODS_NFT_ID = "0.0.1122159";

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
                console.log("success")
                for (let i = 0; i < res.data.length; i++) {
                    if (res.data[i].nftData.serialNo === parseInt(serialNumber_, 10)) {
                        console.log(res.data[i])
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
