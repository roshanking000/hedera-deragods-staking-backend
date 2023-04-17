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

        await axios(config)
            .then(function (res) {
                for (let i = 0;i < res.data.length;i++) {
                    if (res.data[i].nftData.serialNo === parseInt(serialNumber_, 10))
                        return false
                }
                return true
            })
            .catch(function (error) {
                console.log(error);
                return false;
            });
        return true;
    } catch (error) {
        return false;
    }
}