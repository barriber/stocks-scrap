const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const regex = /\$stock/g;
// const runHeaders = async () => {
//     const {data} = await axios(url);
//     const $ = cheerio.load(data);
//     const tables = $('tbody');
//     const result = []
//     $(tables).each((i, table) => {
//         const tableResult = []
//         $(table).children().each((i, row) => {
//             const values = $(row).children();
//             const x = $(values[0]).find('span').text();
//             tableResult.push(x);
//         })
//         result.push(tableResult)
//     })
//
//     console.log(result)
// }

const getStatisticValue = (data, tableIndex, valueIndex, column) => {
    const $ = cheerio.load(data);
    const tables = $('tbody');
    const rows = $(tables[tableIndex]).children();
    const row = $(rows[valueIndex]).children()
    return $(row[column || 1]).text();
}

const scrap = async (stock) => {
    const statisticsUrl = 'https://finance.yahoo.com/quote/$stock/key-statistics?p=$stock';
    const analysisUrl = 'https://finance.yahoo.com/quote/$stock/analysis?p=$stock';
    const [{data: statistics}, {data: analysis}] = await Promise.all(
        [axios(statisticsUrl.replace(regex, stock)), axios(analysisUrl.replace(regex, stock))])
    const result = {
        symbol: stock,
        'p/e': {
            value: getStatisticValue(statistics, 0, 2),
        },
        'Forward p/e': getStatisticValue(statistics, 0, 3),
        'peg': {
            value: getStatisticValue(statistics, 0, 4),
            description: 'The price/earnings to growth ratio (PEG ratio) is a stock\'s price-to-earnings (P/E) ratio divided by the growth rate of its earnings for a specified time period. The PEG ratio is used to determine a stock\'s value while also factoring in the company\'s expected earnings growth, and it is thought to provide a more complete picture than the more standard P/E ratio.'

        },
        'operating cash flow': {
            value: getStatisticValue(statistics, 9, 0),
            description: 'The operating cash flow ratio is a measure of how well current liabilities are covered by the cash flows generated from a company\'s operations. The ratio can help gauge a company\'s liquidity in the short term.\n' +
                'Using cash flow as opposed to net income is considered a cleaner or more accurate measure since earnings are more easily manipulated.\n'
        },
        'gross profit': {
            value: getStatisticValue(statistics, 7, 3),
            description: 'Gross profit is the profit a company makes after deducting the costs associated with making and selling its products, or the costs associated with providing its services.'
        },
        'Operating Cash Flow': {
            value: getStatisticValue(statistics, 9, 0),
            description: 'The operating cash flow ratio is a measure of how well current liabilities are covered by the cash flows generated from a company\'s operations. The ratio can help gauge a company\'s liquidity in the short term.'
        },
        'Levered Free Cash Flow': {
            value: getStatisticValue(statistics, 9, 1),
            description: 'Levered free cash flow (LFCF) is the amount of money a company has left remaining after paying all of its financial obligations. LFCF is the amount of cash a company has after paying debts, while unlevered free cash flow (UFCF) is cash before debt payments are made. Levered free cash flow is important because it is the amount of cash that a company can use to pay dividends and make investments in the business.\n'
        },
        'Profit Margin': {
            value: getStatisticValue(statistics, 5, 0),
            description: 'Profit margin is one of the commonly used profitability ratios to gauge the degree to which a company or a business activity makes money. It represents what percentage of sales has turned into profits.'
        },
        'Operating Margin': {
            value: getStatisticValue(statistics, 5, 1),
            description: 'Operating margin measures how much profit a company makes on a dollar of sales after paying for variable costs of production, such as wages and raw materials, but before paying interest or tax. It is calculated by dividing a company’s operating income by its net sales.'
        },
        'Current Ratio': {
            value: getStatisticValue(statistics, 8, 4),
            description: 'The current ratio is a liquidity ratio that measures a company\'s ability to pay short-term obligations or those due within one year. It tells investors and analysts how a company can maximize the current assets on its balance sheet to satisfy its current debt and other payables.'
        },
        'Payout Ratio': {
            value: getStatisticValue(statistics, 3, 5),
            description: 'The dividend payout ratio is the ratio of the total amount of dividends paid out to shareholders relative to the net income of the company.'
        },
        yahooAnalysis: {
            'earnings': {
                currentYear: getStatisticValue(analysis, 0, 1,3),
                nextYear: getStatisticValue(analysis, 0, 1,4),
            },
            'sales Growth': {
                currentYear: getStatisticValue(analysis, 1, 5,3),
                nextYear: getStatisticValue(analysis, 1, 5,4),
            },
            'Growth Estimates': {
                'current Year':  getStatisticValue(analysis, 5, 2,1),
                'Next Year':  getStatisticValue(analysis, 5, 3,1),
                'Next 5 Years':  getStatisticValue(analysis, 5, 4,1),
            }
        }
    }
    return result;
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
    } catch (e) {}
    // await page.screenshot({path: './screenshot.png', fullPage: true});
    if(!found) {
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
        await page.waitForSelector(className,{timeout: 5000});
        console.log('FOUND!!!')
    } catch
        (e) {
        console.log('NOT FOUND')
    }
    const content = await page.content();
    const $ = cheerio.load(content);
    return $(className).children().text();
}

const app = async (stock) => {
    const browser = await puppeteer.launch();
    const [statistics, dividend, tipRanks] = await Promise.all([scrap(stock), getDividend(stock, browser),
        tipRankAnalysis(stock, browser)]);
    const result = {
        ...statistics,
        dividend,
        // analysis: {
        //     tipRanks
        // }
    }
    await browser.close();

    console.log(result);
}
const stocks = process.argv.slice(2)
app(stocks[0])
