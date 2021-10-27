const {stockAnalysisController} = require("./controller");
const {industryScrap} = require("./indusrty");

exports.stocks = async (req, res) => {
    if(req.url === '/stock') {
        await stockAnalysisController(req)
        res.status(200).send(`Success stock ${req.body.stock}`);
    } else if(req.url === '/industry') {
        await industryScrap()
        res.status(200).send('ready')
    }
}

// gcloud functions deploy 'stockScrap'
