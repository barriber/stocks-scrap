const {stockAnalysisController} = require("./controller");
const {industryScrap} = require("./indusrty");

exports.stocks = async (req, res) => {
    if(req.url === '/stock') {
        console.log(`starting scrapping ${req.body.stock}`)
        await stockAnalysisController(req)
        res.status(200).send(`Success stock ${req.body.stock}`);
        return;
    } else if(req.url === '/industry') {
        await industryScrap()
        res.status(200).send('ready')
        return;
    }

    console.log('URL NOT FOUND');
    res.status(404)
}

// gcloud functions deploy 'stockScrap'
