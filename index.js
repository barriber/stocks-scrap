const axios = require('axios');
const _ = require('lodash');
const cheerio = require('cheerio');
const {deepClone} = require('./utils');
const puppeteer = require('puppeteer');
const {modifySpreadsheet, initializeSpreadSheet} = require('./spreadsheet');
const definition = require('./spreadSheetDefinition.js')
const YahooApi = require("./yahooApi");
const {dcf} = require("./stockAnalysis");
const {formatIndustryUpTrend} = require("./utils");
const {formatIndustryDownTrend} = require("./utils");
const {industryScrap} = require("./indusrty");
const regex = /\$stock/g;

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

const getStockData = async (stock, ) => {
    const api = new YahooApi()
    const stockDefinition = deepClone(definition);
    const stockScraping = await Promise.all([api.getStockSummary(stock), api.getStockAnalysis(stock), api.getStockFinance(stock)]);
    const stockData = stockScraping.reduce((acc, next) => {
        return {...acc, ...next}
    }, {})

    stockData.competitors = await scrapCompetitors(stock, stockData.exchangeName);
    Object.entries(stockDefinition).forEach(([key, value]) => {
        if(stockData[key]) {
            stockDefinition[key].value = stockData[key];
        }
    });


    try {
        dcf(stockData)
    } catch (e) {
        console.log('Stock analysis Failed')
        console.log('Error', e);
    }
    return stockDefinition;
}

exports.stocks = async (req, res) => {
    console.time('stocks');

    const {stocks, spreadsheetId = '16ck3M8DDlrUCGJZ5kOY9VSVQ-YiIXSCXzo2CVT97G4Y'} = req.query;
    const browser = await puppeteer.launch()
    // const browser = await puppeteer.launch({headless: false})
    console.log('stocks', stocks)
    const stocksDataPromise = stocks.split(',').map(stock => getStockData(stock, browser));
    const [sheetInit, ...stocksData] = await Promise.all([initializeSpreadSheet(spreadsheetId), ...stocksDataPromise])
    await browser.close();
    await modifySpreadsheet(stocksData, sheetInit);
    console.timeEnd('stocks');
    res.status(200).send('Done');
    return;
}

// exports.industry = async (req, res) => {
//     await industryScrap()
//     res.status(200).send('ready')
// }

// gcloud functions deploy 'stockScrap'
