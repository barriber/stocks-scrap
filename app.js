const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const modifySpreadsheet = require('./spreadsheet');
const definition = require('./spreadSheetDefinition.js')

const regex = /\$stock/g;

const getStatisticValue = (data, tableIndex, valueIndex, column) => {
    const $ = cheerio.load(data);
    const tables = $('tbody');
    const rows = $(tables[tableIndex]).children();
    const row = $(rows[valueIndex]).children()
    return $(row[column || 1]).text();
}

const scrap = async (stock, stockDefinition) => {
    const statisticsUrl = 'https://finance.yahoo.com/quote/$stock/key-statistics?p=$stock';
    const analysisUrl = 'https://finance.yahoo.com/quote/$stock/analysis?p=$stock';
    const [{data: statistics}, {data: analysis}] = await Promise.all(
        [axios(statisticsUrl.replace(regex, stock)), axios(analysisUrl.replace(regex, stock))])
    stockDefinition.symbol.value = stock;
    stockDefinition['Forward p/e'].value = getStatisticValue(statistics, 0, 3);
    stockDefinition['peg'].value = getStatisticValue(statistics, 0, 4);
    stockDefinition['operating cash flow'].value = getStatisticValue(statistics, 9, 0);
    stockDefinition['gross profit'].value = getStatisticValue(statistics, 7, 3);
    stockDefinition['Operating Cash Flow'].value = getStatisticValue(statistics, 9, 0);
    stockDefinition['Levered Free Cash Flow'].value = getStatisticValue(statistics, 9, 1);
    stockDefinition['Profit Margin'].value = getStatisticValue(statistics, 5, 0);
    stockDefinition['Operating Margin'].value = getStatisticValue(statistics, 5, 1);
    stockDefinition['Current Ratio'].value = getStatisticValue(statistics, 8, 4);
    stockDefinition['Payout Ratio'].value = getStatisticValue(statistics, 3, 5);
    stockDefinition['earnings current year'].value = getStatisticValue(analysis, 0, 1, 3);
    stockDefinition["earnings next year"].value = getStatisticValue(analysis, 0, 1, 4);
    stockDefinition['sales Growth current year'].value = getStatisticValue(analysis, 1, 5, 3);
    stockDefinition['sales Growth next year'].value = getStatisticValue(analysis, 1, 5, 4);
    stockDefinition['Growth Estimates current year'].value = getStatisticValue(analysis, 5, 2, 1);
    stockDefinition['Growth Estimates next year'].value = getStatisticValue(analysis, 5, 3, 1);
    stockDefinition['Growth Estimates next 5 years'].value = getStatisticValue(analysis, 5, 4, 1);
}

const getDividend = async (stock, browser) => {
    const tipRanks = 'https://www.tipranks.com/stocks/$stock/dividends';
    const page = await browser.newPage();
    await page.goto(tipRanks.replace(regex, stock));
    let found = false;
    try {
        await page.waitForFunction(
            'document.querySelector("body").innerText.includes("Dividend Amount")', {timeout: 5000});
        found = true;
    } catch (e) {
    }
    // await page.screenshot({path: './screenshot.png', fullPage: true});
    if (!found) {
        return null;
    }
    const content = await page.content();
    const $ = cheerio.load(content);
    const values = $('.client-components-StockTabTemplate-InfoBox-InfoBox__bodySingleBoxInfo');
    return $(values[1]).children().text();
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
    const stockDefinition = {...definition}
    const [, dividend, tipRanks] = await Promise.all([scrap(stock, stockDefinition), getDividend(stock, browser),
        tipRankAnalysis(stock, browser)]);
    stockDefinition.dividend.value = dividend;
    stockDefinition.tipRanks.value = tipRanks;
    return stockDefinition;
}
const app = async (stocks) => {
    console.time('stock')
    const browser = await puppeteer.launch();
    const stocksDataPromise = stocks.map(stock => getStockData(stock, browser));
    const stocksData = await Promise.all(stocksDataPromise)
    await browser.close();
    console.timeEnd('stock')
    await modifySpreadsheet(stocksData[0]);
}
const stocks = process.argv.slice(2);

app(stocks);
