const {stockAnalysisController} = require("./controller");
const {industryScrap} = require("./indusrty");


// POST http://localhost:8080/stock
//     Content-Type: application/json
// {
//     "stock": "amzn",
//     "profitMargin": 0.06,
//     "revenueGrowth": 1.09,
//     "requiredReturn": 0.1,
//     "shareGrowth": 1,
//     "cashflowRate": 1.1
// }

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
