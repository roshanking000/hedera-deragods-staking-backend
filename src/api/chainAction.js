const axios = require('axios');

const MIRROR_NET_URL = "https://mainnet-public.mirrornode.hedera.com";

exports.getNftInfo = async (tokenId_, serialNumber_) => {
    try {
        const _res = await axios.get(MIRROR_NET_URL + `/api/v1/tokens/${tokenId_}/nfts/${serialNumber_}`)
        if (_res)
            return _res.data
        return null
    } catch (error) {
        return null
    }
}
