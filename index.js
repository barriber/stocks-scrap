const axios = require('axios');
const cheerio = require('cheerio');
const {deepClone} = require('./utils');
const puppeteer = require('puppeteer');
const {modifySpreadsheet, initializeSpreadSheet} = require('./spreadsheet');
const definition = require('./spreadSheetDefinition.js')
const {industryScrap} = require("./indusrty");
const fiveYears = 24 * 60 * 60 * 365 * 5;
const regex = /\$stock/g;

const getStatisticValue = ($, tables, tableIndex, valueIndex, column) => {
    const rows = $(tables[tableIndex]).children();
    const row = $(rows[valueIndex]).children()
    return $(row[column || 1]).text();
}

const scrapStatistics = (statistics, stockDefinition) => {
    const statisticsData = cheerio.load(statistics);
    const statisticsTables = statisticsData('tbody');
    stockDefinition['Forward p/e'].value = getStatisticValue(statisticsData, statisticsTables, 0, 3);
    stockDefinition['peg'].value = getStatisticValue(statisticsData, statisticsTables, 0, 4);
    stockDefinition['Return on Equity'].value = getStatisticValue(statisticsData, statisticsTables, 6, 1);
    stockDefinition['gross profit'].value = getStatisticValue(statisticsData, statisticsTables, 7, 3);
    stockDefinition['Operating Cash Flow'].value = getStatisticValue(statisticsData, statisticsTables, 9, 0);
    stockDefinition['Levered Free Cash Flow'].value = getStatisticValue(statisticsData, statisticsTables, 9, 1);
    stockDefinition['Profit Margin'].value = getStatisticValue(statisticsData, statisticsTables, 5, 0);
    stockDefinition['Operating Margin'].value = getStatisticValue(statisticsData, statisticsTables, 5, 1);
    stockDefinition['Current Ratio'].value = getStatisticValue(statisticsData, statisticsTables, 8, 4);
    stockDefinition['Payout Ratio'].value = getStatisticValue(statisticsData, statisticsTables, 3, 5);
    stockDefinition['Debt/Equity'].value = getStatisticValue(statisticsData, statisticsTables, 8, 3);
}

const scrapProfile = (profileData, stockDefinition) => {
    const $ = cheerio.load(profileData);
    const profile = $('.asset-profile-container p')[1];
    const profileInfo = $('span',profile);
    const sector = $(profileInfo[1]).text();
    let industry = $(profileInfo[3]).text()
    stockDefinition.sector.value = sector;
    if(industry === 'Software—Application') {
        industry = 'Software-Application'
    }

    stockDefinition.industry.value = industry;

}

const scrapAnalysis = (analysis, stockDefinition) => {
    const analysisData = cheerio.load(analysis);
    const AnalysisTables = analysisData('tbody');
    stockDefinition['earnings current year'].value = getStatisticValue(analysisData, AnalysisTables, 0, 1, 3);
    stockDefinition["earnings next year"].value = getStatisticValue(analysisData, AnalysisTables, 0, 1, 4);
    stockDefinition['sales Growth current year'].value = getStatisticValue(analysisData, AnalysisTables, 1, 5, 3);
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
const scrap = async (stock, stockDefinition) => {
    const timeNow = Math.round(new Date().getTime() / 1000);
    const fiveYearsAgo = timeNow - fiveYears;
    const mainUrl = 'https://finance.yahoo.com/quote/$stock/profile?p=$stock'
    const statisticsUrl = 'https://finance.yahoo.com/quote/$stock/key-statistics?p=$stock';
    const analysisUrl = 'https://finance.yahoo.com/quote/$stock/analysis?p=$stock';
    const dividendUrl = `https://finance.yahoo.com/quote/$stock/history?period1=${fiveYearsAgo}&period2=${timeNow}&interval=div%7Csplit&filter=div&frequency=1d`
    const [{data: statistics}, {data: analysis}, {data: dividendData}, {data: profileData}] = await Promise.all(
        [axios(statisticsUrl.replace(regex, stock)), axios(analysisUrl.replace(regex, stock)),
            axios(dividendUrl.replace(regex, stock)), axios(mainUrl.replace(regex, stock))])

    scrapStatistics(statistics, stockDefinition);
    scrapAnalysis(analysis, stockDefinition);
    scrapDividend(dividendData, stockDefinition);
    scrapProfile(profileData, stockDefinition);
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
    await scrap(stock, stockDefinition)
    return stockDefinition;
}

exports.stocks = async (req, res) => {
    console.time('stocks');
    const {stocks, spreadsheetId = '1AGra0hkxIFC5BMdeMDoGJBf4XmbNc0AfLXHQJH-LHVw'} = req.query;
    const browser = await puppeteer.launch()
    const stocksDataPromise = stocks.split(',').map(stock => getStockData(stock, browser));
    const [sheetInit, ...stocksData] = await Promise.all([initializeSpreadSheet(spreadsheetId), ...stocksDataPromise])
    await browser.close();
    await modifySpreadsheet(stocksData, sheetInit);
    console.timeEnd('stocks');
    res.status(200).send('Done');
    return;
}

// gcloud functions deploy 'stockScrap'