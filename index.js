const axios = require('axios');
const cheerio = require('cheerio');
const {deepClone} = require('./utils');
const puppeteer = require('puppeteer');
const {modifySpreadsheet, initializeSpreadSheet} = require('./spreadsheet');
const definition = require('./spreadSheetDefinition.js')
const {getAnalysis} = require("./analysisScrap");
const {stockScrap} = require("./stockScrap");
const {dcf} = require("./stockAnalysis");
const {balanceScrap} = require("./balanceSheetScrap");
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

const scrapCompetitors = async (stockDefinition, stock) => {
    const competitorsUrl = `https://www.marketbeat.com/stocks/${stockDefinition.market}/${stock}/competitors-and-alternatives/`
    const {data: competitorData} = await axios(competitorsUrl)
    const $ = cheerio.load(competitorData);
    const competitors = $('.ticker-area').slice(0, 5);
    const stocks = []
    competitors.each((i, competitor) => {
        const stock = $(competitor).text();
        stocks.push(stock)
    })

    stockDefinition.competitors.value = stocks.join(', ')
}
const scrap = async (stock, stockDefinition) => {
    const parsedStock = stock.replace('.', '-');

    console.log('====END YAHOO FETCHING SUCCESS===')
    // await zacksScrap(parsedStock, stockDefinition);
    await scrapCompetitors(stockDefinition, parsedStock);
    stockDefinition.symbol.value = stock;
}

const tipRankAnalysis = async (stock, browser) => {
    const tipRanks = 'https://www.tipranks.com/stocks/$stock/forecast'
    const page = await browser.newPage();
    await page.goto(tipRanks.replace(regex, stock));
    const className = '.client-components-stock-research-analysts-price-target-style__actualMoney';
    try {
        await page.waitForSelector(className, {timeout: 5000});
    } catch (e) {
        return null;
    }
    const content = await page.content();
    const $ = cheerio.load(content);
    return $(className).children().text();
}

const getStockData = async (stock, browser) => {
    const stockDefinition = deepClone(definition);
    const stockScraping = await Promise.all([stockScrap(stock), getAnalysis(stock), balanceScrap(stock)]);
    const stockData = stockScraping.reduce((acc, next) => {
        return {...acc, ...next}
    }, {})
    await scrap(stock, stockDefinition);
    try {
        dcf(stockDefinition, balanceSheet)
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
