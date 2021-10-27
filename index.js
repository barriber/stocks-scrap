const axios = require('axios');
const _ = require('lodash');
const cheerio = require('cheerio');
const {modifySpreadsheet, initializeSpreadSheet} = require('./spreadsheet');
const YahooApi = require("./yahooApi");
const {formatIndustryUpTrend} = require("./utils");
const {formatIndustryDownTrend} = require("./utils");
const {industryScrap} = require("./indusrty");
const regex = /\$stock/g;

const test = {
    "exchangeName": "NASDAQ",
    "forwardPE": 12.321266,
    "beta": 0.592063,
    "peg": 1.12,
    "roe": 0.22193001,
    "roa": 0.092650004,
    "profitMargin": 0.23906,
    "operatingMargin": 0.29331,
    "operatingCashFlow": 32362999808,
    "currentRatio": 1.988,
    "payoutRatio": 0.30110002,
    "debtToEquity": 41.556,
    "marketCap": 220944220160,
    "sharesOutstanding": 4056999936,
    "totalCash": 24856999936,
    "totalDebt": 35408998400,
    "grossProfit": 43612000000,
    "industry": "Semiconductors",
    "sector": "Technology",
    "industryPE": 27.8,
    "dividend": 1.39,
    "currentYearGrowth": -0.096,
    "currentYearSalesGrowth": -0.096,
    "nextYearGrowth": -0.077,
    "nextYearSalesGrowth": -0.077,
    "nextFiveYearsGrowth": 0.1,
    "revenueEstimateCurrentYear": 73601100000,
    "revenueEstimateNextYear": 73119400000,
    "medianRecommendedPricePrice": 60,
    "recommendationRating": 2.8,
    "longTermDebt": [
        25037000000,
        25098000000,
        25308000000,
        33897000000
    ],
    "totalAssets": 153091000000,
    "revenueHistory": [
        62761000000,
        70848000000,
        71965000000,
        77867000000
    ],
    "netIncomeHistory": [
        9601000000,
        21053000000,
        21048000000,
        20899000000
    ],
    "netIncome": 20899000000,
    "taxProvision": 4179000000,
    "interestExpense": -629000000,
    "preTaxIncome": 25078000000,
    "revenue": 77867000000,
    "freeCashFlowHistory": [
        10332000000,
        14251000000,
        16932000000,
        20931000000
    ],
    "treasuryBondRate": 0.01576,
    "competitors": "NVDA, AVGO, TXN, MU, ADI"
}

const zacksTableParser = ($, tableId) => {
    const tableRows = $(`#${tableId} tr`);
    const rows = [];
    tableRows.each((index, row) => {
        if (index > 0) {
            const rowObj = {}
            const columns = $(row).children();
            rowObj.title = $(columns[0]).text();
            rowObj.company = $(columns[1]).text();
            rowObj.industry = $(columns[2]).text();

            rows.push(rowObj)
        }
    })
    return rows;
}

const zacksScrap = async (stock, stockDefinition) => {
    const zacksIndustryUrl = `https://www.zacks.com/stock/research/$stock/industry-comparison`;
    let zacksData
    try {
        zacksData = await axios(zacksIndustryUrl.replace(regex, stock))
        console.log('================', zacksData)
    } catch (e) {
        console.log('ZACKS FAILED')
        console.log('xxxxx', JSON.stringify(e))
    }

    console.log('ZACKS FETCH SUCCESSS')
    const $ = cheerio.load(zacksData.data);
    const zacksRecomendations = zacksTableParser($, 'recommendations_estimates')
    const growthRatesTable = zacksTableParser($, 'growth_rates')
    const financialsTable = zacksTableParser($, 'financials')

    if (zacksRecomendations.length > 0) {
        stockDefinition['Zacks recommendation'] = {
            value: zacksRecomendations[0].company,
            valueNote: () => `Industry Zacks recommendation: ${zacksRecomendations[0].industry}`
        }

        stockDefinition["Growth Estimates next 5 years"].valueNote = () => `Zacks estimate: ${growthRatesTable[3].company}
    \nIndustry Zacks estimates: ${growthRatesTable[3].industry}`
        stockDefinition["Growth Estimates next year"].valueNote = () => `Zacks estimate: ${growthRatesTable[1].company}
    \nIndustry Zacks estimates: ${growthRatesTable[1].industry}`
        stockDefinition["Profit Margin"].valueNote = () => `Industry average ${financialsTable[4].industry}`
        stockDefinition["Profit Margin"].format = (cell, fieldValue) => {
            formatIndustryUpTrend(cell, fieldValue, financialsTable[4].industry);
        }
        stockDefinition["price/book"].valueNote = () => `industry ${financialsTable[1].industry}`
        stockDefinition["price/book"].format = (cell, fieldValue) => {
            formatIndustryDownTrend(cell, fieldValue, financialsTable[1].industry);
        }
    }
}

const scrapCompetitors = async (stock, market) => {
    const parsedStock = stock.replace('.', '-');
    const competitorsUrl = `https://www.marketbeat.com/stocks/${market}/${parsedStock}/competitors-and-alternatives/`
    const {data: competitorData} = await axios(competitorsUrl)
    const $ = cheerio.load(competitorData);
    const competitors = $('.ticker-area').slice(0, 5);
    const stocks = []
    competitors.each((i, competitor) => {
        const stock = $(competitor).text();
        stocks.push(stock)
    })

    return stocks.join(', ')
}

const getStockData = async (stock, custom) => {
    try {
        // const api = new YahooApi()
        // const [tenYearsBond, ...stockScraping] = await Promise.all([api.getStockSummary('^TNX'),
        //     api.getStockSummary(stock), api.getStockAnalysis(stock), api.getStockFinance(stock)]);
        // const stockData = stockScraping.reduce((acc, next) => {
        //     return {...acc, ...next}
        // }, {})
        //
        // stockData.treasuryBondRate = tenYearsBond.price / 100
        // stockData.competitors = await scrapCompetitors(stock, stockData.exchangeName);
        const stockData = test;
        stockData.symbol = stock;
        stockData.custom = custom;

        return stockData;
    } catch (e) {
        console.log('Stock analysis Failed')
        console.log('Error', e);
    }
}
// requiredReturn RevenueGrow
exports.stocks = async (req, res) => {
    const {stock, spreadsheetId = '16ck3M8DDlrUCGJZ5kOY9VSVQ-YiIXSCXzo2CVT97G4Y', ...custom} = req.body
    const [sheetInit, ...stocksData] = await Promise.all([initializeSpreadSheet(spreadsheetId), getStockData(stock, custom)])
    await modifySpreadsheet(stocksData[0], sheetInit);
    res.status(200).send(`Success stock ${stock}`);
    return;
}

// exports.industry = async (req, res) => {
//     await industryScrap()
//     res.status(200).send('ready')
// }

// gcloud functions deploy 'stockScrap'
