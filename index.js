const axios = require('axios');
const cheerio = require('cheerio');
const {deepClone} = require('./utils');
const puppeteer = require('puppeteer');
const {modifySpreadsheet, initializeSpreadSheet} = require('./spreadsheet');
const definition = require('./spreadSheetDefinition.js')
const industryAverages = require('./industryAverages.json')
const {parseMarketCap} = require("./utils");
const {dcf} = require("./stockAnalysis");
const {balanceScrap} = require("./balanceSheetScrap");
const {formatIndustryUpTrend} = require("./utils");
const {formatIndustryDownTrend} = require("./utils");
const {industryScrap} = require("./indusrty");
const fiveYears = 24 * 60 * 60 * 365 * 5;
const regex = /\$stock/g;
const YAHOO_URL = 'https://finance.yahoo.com/quote/$stock';
const getStatisticValue = ($, tables, tableIndex, valueIndex, column) => {
    const rows = $(tables[tableIndex]).children();
    const row = $(rows[valueIndex]).children()
    return $(row[column || 1]).text();
}


const scrapBalacnceSheet = (balanceSheet, stockDefinition) => {
    const $ = cheerio.load(balanceSheet);

}
const scrapIncomeStatement = (income, stockDefinition) => {
    // const $ = cheerio.load(income);
    // financialsParser(stockDefinition, $, 20, 'interestExpense', 'Interest Expense');
    // financialsParser(stockDefinition, $, 7, 'preTaxIncome', 'Pretax Income');
    // financialsParser(stockDefinition, $, 8, 'taxProvision', 'Tax Provision');
}
const scrapStatistics = (statistics, stockDefinition) => {
    const statisticsData = cheerio.load(statistics);
    const statisticsTables = statisticsData('tbody');
    stockDefinition['Forward p/e'].value = getStatisticValue(statisticsData, statisticsTables, 0, 3);
    stockDefinition['peg'].value = getStatisticValue(statisticsData, statisticsTables, 0, 4);
    stockDefinition['ROE'].value = getStatisticValue(statisticsData, statisticsTables, 6, 1);
    stockDefinition['gross profit'].value = getStatisticValue(statisticsData, statisticsTables, 7, 3);
    stockDefinition['Operating Cash Flow'].value = getStatisticValue(statisticsData, statisticsTables, 9, 0);
    stockDefinition['Levered Free Cash Flow'].value = getStatisticValue(statisticsData, statisticsTables, 9, 1);
    stockDefinition['Profit Margin'].value = getStatisticValue(statisticsData, statisticsTables, 5, 0);
    stockDefinition['Operating Margin'].value = getStatisticValue(statisticsData, statisticsTables, 5, 1);
    stockDefinition['Current Ratio'].value = getStatisticValue(statisticsData, statisticsTables, 8, 4);
    stockDefinition['Payout Ratio'].value = getStatisticValue(statisticsData, statisticsTables, 3, 5);
    stockDefinition['Debt/Equity'].value = getStatisticValue(statisticsData, statisticsTables, 8, 3);
    stockDefinition['price/book'].value = getStatisticValue(statisticsData, statisticsTables, 0, 6);
    stockDefinition['price/sales'].value = getStatisticValue(statisticsData, statisticsTables, 0, 5);
    stockDefinition['market cap'].value = parseMarketCap(getStatisticValue(statisticsData, statisticsTables, 0, 0));
    stockDefinition.sharesOutstanding = {value: parseMarketCap(getStatisticValue(statisticsData, statisticsTables, 2, 2))};
    stockDefinition['Total cash'].value =  parseMarketCap(getStatisticValue(statisticsData, statisticsTables, 8, 0));
    stockDefinition['Total debt'].value =  parseMarketCap(getStatisticValue(statisticsData, statisticsTables, 8, 2));
    stockDefinition.beta.value =  getStatisticValue(statisticsData, statisticsTables, 1, 0);
    const market = statisticsData('#quote-header-info span').text().split(' - ')[0];
    stockDefinition.market = market === 'NasdaqGS' ? 'NASDAQ' : market.toUpperCase();
}

const scrapProfile = (profileData, stockDefinition) => {
    const $ = cheerio.load(profileData);
    const profile = $('.asset-profile-container p')[1];
    const profileInfo = $('span', profile);
    const sector = $(profileInfo[1]).text();
    let industry = $(profileInfo[3]).text()
    stockDefinition.sector.value = sector;
    industry = industry.replace('—', ' - ')
    stockDefinition.industry.value = industry;
    if (industryAverages[industry]) {
        stockDefinition['industry pe'].value = industryAverages[industry].pe
    }
}

const scrapAnalysis = (analysis, stockDefinition) => {
    const analysisData = cheerio.load(analysis);
    const AnalysisTables = analysisData('tbody');
    stockDefinition['earnings current year'].value = getStatisticValue(analysisData, AnalysisTables, 0, 1, 3);
    stockDefinition["earnings next year"].value = getStatisticValue(analysisData, AnalysisTables, 0, 1, 4);
    stockDefinition['sales Growth current year'].value = getStatisticValue(analysisData, AnalysisTables, 1, 5, 3);
    stockDefinition.revenueCurrentYear = {value: parseMarketCap(getStatisticValue(analysisData, AnalysisTables, 1, 1, 3))};
    stockDefinition.revenueNextYear = {value: parseMarketCap(getStatisticValue(analysisData, AnalysisTables, 1, 1, 4))};
    stockDefinition['sales Growth next year'].value = getStatisticValue(analysisData, AnalysisTables, 1, 5, 4);
    stockDefinition['Growth Estimates current year'].value = getStatisticValue(analysisData, AnalysisTables, 5, 2, 1);
    stockDefinition['Growth Estimates next year'].value = getStatisticValue(analysisData, AnalysisTables, 5, 3, 1);
    stockDefinition['Growth Estimates next 5 years'].value = getStatisticValue(analysisData, AnalysisTables, 5, 4, 1);
}
const scrapDividend = (dividend, stockDefinition) => {
    const dividendPage = cheerio.load(dividend);
    const dividendTable = dividendPage('tbody');
    const lastDividend = getStatisticValue(dividendPage, dividendTable, 0, 0);
    if (lastDividend !== '') {
        const numberOfDividends = dividendPage(dividendTable[0]).children().length;
        const firstDividend = getStatisticValue(dividendPage, dividendTable, 0, numberOfDividends - 1);
        const firstDividendFloat = parseFloat(firstDividend.split('Dividend')[0]);
        const lastDividendFloat = parseFloat(lastDividend.split('Dividend')[0]);
        const dividendGrowth = ((lastDividendFloat - firstDividendFloat) / firstDividendFloat).toFixed(2);
        stockDefinition.dividend.value = lastDividendFloat;
        stockDefinition['dividend growth (5y)'].value = parseFloat(dividendGrowth)
    }
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
    const timeNow = Math.round(new Date().getTime() / 1000);
    const fiveYearsAgo = timeNow - fiveYears;
    const parsedStock = stock.replace('.', '-');
    const mainUrl = `${YAHOO_URL}/profile?p=$stock`
    const statisticsUrl = `${YAHOO_URL}/key-statistics?p=$stock`;
    const analysisUrl = `${YAHOO_URL}/analysis?p=$stock`;
    const dividendUrl = `${YAHOO_URL}/history?period1=${fiveYearsAgo}&period2=${timeNow}&interval=div%7Csplit&filter=div&frequency=1d`
    console.log('START YAHOO FETCHING');
    const [{data: statistics}, {data: analysis}, {data: dividendData}, {data: profileData}] = await Promise.all(
        [axios(statisticsUrl.replace(regex, parsedStock)), axios(analysisUrl.replace(regex, parsedStock)),
            axios(dividendUrl.replace(regex, parsedStock)), axios(mainUrl.replace(regex, parsedStock)),
        ]);
    // scrapIncomeStatement(incomeData, stockDefinition);
    // scrapBalacnceSheet(balanceSheetData, stockDefinition);
    console.log('====END YAHOO FETCHING SUCCESS===')
    scrapStatistics(statistics, stockDefinition);
    scrapAnalysis(analysis, stockDefinition);
    scrapDividend(dividendData, stockDefinition);
    scrapProfile(profileData, stockDefinition);
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
    // const [, tipRanks] = await Promise.all([scrap(stock, stockDefinition), tipRankAnalysis(stock, browser)]);
    // stockDefinition.tipRanks.value = tipRanks;
    await scrap(stock, stockDefinition);
    try {
        const balanceSheet = await balanceScrap(stock)
        //SHARE OUTSANDING!!!
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
