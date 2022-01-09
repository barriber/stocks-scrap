const _ = require('lodash');
const industryAverage = require('./industryAverages.json');
const {dcf} = require("./stockAnalysis");
const {pairsDifference, formatIndustryUpTrend, formatIndustryDownTrend, formatPercent, goodBad, average, decimalFormat, bigNumberFormat} = require("./utils");

const historyNote = (historyArray, type) => {
    const growthDiff = pairsDifference(historyArray);
    return `Growth diff:\n${growthDiff.map(v => `${_.round(v * 100, 2)}%`).join(', ')}\n` +
            `${type} history:\n${historyArray.map(num => num.toLocaleString()).join('\n')}`;
}
module.exports = {
    symbol: {
        formula: (stock) => {
            return `=HYPERLINK("https://finance.yahoo.com/quote/${stock}/", "${stock.toUpperCase()}")`;
        }
    },
    sector: {},
    industry: {},
    dayChange: {
        formula: (stock) => `=GOOGLEFINANCE("${stock}","changepct") / 100`,
        format: (cell) => {
            cell.numberFormat = {type: 'PERCENT'};
        },
    },
    price: {
        formula: (stock) => `=GOOGLEFINANCE("${stock}")`,
    },
    targetPrice: {},
    targetDiff: {},
    marketCap: {
        formula: (stock) => `=GOOGLEFINANCE("${stock}", "marketcap")`,
        format: bigNumberFormat,
    },
    yearLow: {
        formula: (stock) => `=GOOGLEFINANCE("${stock}", "low52")`,
        title: "52 week low"
    },
    yearHigh: {
        formula: (stock) => `=GOOGLEFINANCE("${stock}", "high52")`,
        title: "52 week high"

    },
    priceToEarnings: {
        formula: (stock) => `=GOOGLEFINANCE("${stock}","pe")`,
        valueNote: ({industry}) => {
            return `Industry average is ${industryAverage[industry] && industryAverage[industry].pe} `
        },
        title: "p/e"
    },
    forwardPE: {
        title: "Forward p/e",
        format: decimalFormat,
    },
    peg: {
        description: "The price/earnings to growth ratio (PEG ratio) is a stock\"s price-to-earnings (P/E) ratio divided by the growth rate of its earnings for a specified time period. The PEG ratio is used to determine a stock\"s value while also factoring in the company\"s expected earnings growth, and it is thought to provide a more complete picture than the more standard P/E ratio."
    },
    profitMargin: {
        description: "Profit margin is one of the commonly used profitability ratios to gauge the degree to which a company or a business activity makes money. It represents what percentage of sales has turned into profits. \n https://www.investopedia.com/terms/p/profitmargin.asp",
        format: formatPercent,
    },
    roe: {
        description: 'Return on equity (ROE) is a measure of financial performance calculated by dividing net income by shareholders\' equity. Because shareholders\' equity is equal to a company’s assets minus its debt, ROE is considered the return on net assets. ROE is considered a measure of how effectively management is using a company’s assets to create profits.\n' +
            'ROE=EPS/BookValue\n' +
            'Average is 14% below 7% is bad \n https://www.investopedia.com/terms/r/returnonequity.asp',
        valueNote: ({industry}) => {
            return industryAverage[industry] && `Industry average is ${industryAverage[industry].roe} `
        },
        format: (cell, fieldValue, industry) => {
            formatIndustryUpTrend(cell, fieldValue, industryAverage[industry] && industryAverage[industry].roe)
        },
        title: 'ROE',
    },
    grossProfit: {
        description: "Gross profit is the profit a company makes after deducting the costs associated with making and selling its products, or the costs associated with providing its services. \n https://www.investopedia.com/terms/g/grossprofit.asp",
        format: bigNumberFormat
    },
    debtToEquity: {
        title: "Debt/Equity",
        description: "The debt-to-equity (D/E) ratio is calculated by dividing a company’s total liabilities by its shareholder equity.",
        valueNote: ({industry}) => {
            return `Industry average is ${industryAverage[industry] && industryAverage[industry]['debt/equity']}`
        },
        format: (cell, fieldValue, industry) => {
            formatIndustryDownTrend(cell, fieldValue, industryAverage[industry] && industryAverage[industry]['debt/equity']);
        }
    },
    operatingMargin: {
        description: "Operating margin measures how much profit a company makes on a dollar of sales after paying for variable costs of production, such as wages and raw materials, but before paying interest or tax. It is calculated by dividing a company’s operating income by its net sales.",
        format: formatPercent,
    },
    currentRatio: {
        description: "The current ratio is a liquidity ratio that measures a company\"s ability to pay short-term obligations or those due within one year. It tells investors and analysts how a company can maximize the current assets on its balance sheet to satisfy its current debt and other payables.\n assets/debt (UP)",
    },
    payoutRatio: {
        description: "The dividend payout ratio is the ratio of the total amount of dividends paid out to shareholders relative to the net income of the company.",
        format: formatPercent,
    },
    nextYearSalesGrowth: {
        title: 'sales Growth next year'
    },
    nextYearGrowth: {
        title: 'Growth Estimates next year',
        format: formatPercent,
    },
    nextFiveYearsGrowth: {
        title: 'Growth Estimates next 5 years',
        format: formatPercent,
    },
    competitors: {},
    totalCash: {
        format: bigNumberFormat
    },
    totalDebt: {
        format: bigNumberFormat
    },
    lastModified: {
        format: (cell) => {
            cell.value = new Date().toLocaleDateString();
        }
    },
    divYield: {
        formula: (symbol, stock) => {
            return `=${stock.dividend || 0}/GOOGLEFINANCE("${symbol}")`;
        },
        format: formatPercent,
    },
    dcf: {
        valueNote: ({custom}) => {
            return Object.entries(custom).map(([key, value]) => `${key}: ${value}`).join('\n');
        },
        format: (cell, fieldValue, stockData) => {
            cell.value = dcf(stockData)
        }
    },
    pillarOne: {
        description: 'Pillar no` 1: Market cap divided by 5 year average of earning less to be less then 22.5',
       format: (cell, fieldValue, stockData) => {
            const avgIncome = average(stockData.netIncomeHistory);
            if(avgIncome < 0) {
                cell.value = false;
                const latest = stockData.marketCap / _.last(stockData.netIncomeHistory);
                cell.note = `Negative Income ${avgIncome} \n`;
                goodBad(cell, false ) ;
                return
            }

           const capByIncome = stockData.marketCap / average(stockData.netIncomeHistory)
           const result = capByIncome < 22.5 ;
           cell.note = `Expected: 22.5\nMCP/INCOME=${Math.round(capByIncome)}\n`+
               `Latest: ${stockData.marketCap / _.last(stockData.netIncomeHistory)}`
           cell.value = result;
           goodBad(cell, result )
        },
        title: 'MCP by PE average',
    },
    pillarThree: {
        description: 'Pillar no`3: Revenue Growth',
        format: (cell, fieldValue, { revenueHistory }) => {
            const revenueAverage = average(revenueHistory);
            const result = revenueHistory[0] < revenueAverage && revenueHistory[revenueHistory.length - 1] > revenueAverage;
            cell.value = result;
            cell.note = historyNote(revenueHistory, 'Revenue')
            goodBad(cell, result);
        },
        title: 'Revenue Growth'
    },
    pillarFour: {
        description: 'Pillar no`4: Income Growth',
        format: (cell, fieldValue, {netIncomeHistory}) => {
            const incomeAverage = average(netIncomeHistory);
            const result = netIncomeHistory[0] < incomeAverage && netIncomeHistory[netIncomeHistory.length - 1] > incomeAverage;
            cell.value = result;
            cell.note = historyNote(netIncomeHistory, 'Income')
            goodBad(cell, result);
        },
        title: 'Income Growth'
    },
    pillarFive: {
        description: 'Pillar no`5: Share Outstanding',
        format: (cell, fieldValue, { commonStockSharesOutstandingHistory: sharesHistory }) => {
            const sharesAvg = average(sharesHistory);
            const result = !(sharesHistory[0] < sharesAvg && _.last(sharesHistory) > sharesAvg);
            cell.value = result;
            cell.note = historyNote(sharesHistory, 'Income')
            goodBad(cell, result);
        },
        title: 'Share Growth'
    },
    pillarSix: {
        description: 'Pillar no`6: Five times free cashFlow bigger then long term Debt',
        format: (cell, fieldValue, {freeCashFlowHistory, longTermDebt}) => {
            const freeCashAvg = average(freeCashFlowHistory);
            const result = (freeCashAvg * 5) > _.last(longTermDebt);
            cell.value = result;
            cell.note = `Long term debt:\n${longTermDebt.map(num => num.toLocaleString()).join('\n')}`
                + `\nExpectedRatio: 5\nRatio: ${Math.round(_.last(longTermDebt) / freeCashAvg )}\n` +
                `Latest ratio: ${Math.round( _.last(longTermDebt) / _.last(freeCashFlowHistory))}`
            goodBad(cell, result);
        },
        title: 'Long debt by FCF'
    },
    pillarSeven: {
        format: (cell, fieldValue, {freeCashFlowHistory}) => {
            const freeCashFlowAvg = average(freeCashFlowHistory);
            const result = freeCashFlowHistory[freeCashFlowHistory.length - 1] > freeCashFlowAvg;
            cell.value = result;
            cell.note = historyNote(freeCashFlowHistory, 'Free cash flow')
            goodBad(cell, result);
        },
        title: 'FCF growth'
    },
    pillarEight: {
        description: 'Pillar no`8: Free cash flow by 20 should be more than market cap',
        format: (cell, fieldValue, {freeCashFlowHistory, marketCap}) => {
            const freeCashFlowAvg = average(freeCashFlowHistory);
            const result = freeCashFlowAvg * 20 > marketCap;
            cell.value = result;
            cell.note = `Average FCF: ${freeCashFlowAvg.toLocaleString()}\nLatest FCF: ${_.last(freeCashFlowHistory).toLocaleString()}`
                +`\nExpected: 20\nRatio is ${Math.round(marketCap / freeCashFlowAvg)}\n`
                +`Latest Ratio: ${Math.round(marketCap / _.last(freeCashFlowHistory))}`
            goodBad(cell, result);
        },
        title: 'FCF by MCP'
    },
    pillarNine: {
        description: 'Pillar no`9: Total dividend should be less then FCF',
        format: (cell, fieldValue, {dividend, freeCashFlowHistory, sharesOutstanding}) => {
            if(!dividend) {
                cell.value = 'N/A';
                return
            }

            const freeCashFlowAvg = average(freeCashFlowHistory);
            const totalDividendPaid = dividend * sharesOutstanding;
            cell.value = totalDividendPaid < freeCashFlowAvg;
            goodBad(cell, totalDividendPaid < freeCashFlowAvg);
        },
        title: 'Dividend by FCF'
    },

}
