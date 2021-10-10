const industryAverage = require('./industryAverages.json');
const {formatIndustryUpTrend} = require("./utils");
const {formatIndustryDownTrend} = require("./utils");

module.exports = {
    symbol: {
        formula: (stock) => `=HYPERLINK("https://finance.yahoo.com/quote/${stock}/", "${stock}")`
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
        format: (cell) => {
            cell.numberFormat = {type: 'NUMBER'};
        },
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
        "formula": (stock) => `=GOOGLEFINANCE("${stock}","pe")`,
        "valueNote": (industry) => {
            return `Industry average is ${industryAverage[industry] && industryAverage[industry].pe} `
        },
        title: "p/e"
    },
    forwardPriceToEarnings: {
        title: "Forward p/e"
    },
    peg: {
        description: "The price/earnings to growth ratio (PEG ratio) is a stock\"s price-to-earnings (P/E) ratio divided by the growth rate of its earnings for a specified time period. The PEG ratio is used to determine a stock\"s value while also factoring in the company\"s expected earnings growth, and it is thought to provide a more complete picture than the more standard P/E ratio."
    },
    profitMargins: {
        description: "Profit margin is one of the commonly used profitability ratios to gauge the degree to which a company or a business activity makes money. It represents what percentage of sales has turned into profits. \n https://www.investopedia.com/terms/p/profitmargin.asp",
    },
    roe: {
        description: 'Return on equity (ROE) is a measure of financial performance calculated by dividing net income by shareholders\' equity. Because shareholders\' equity is equal to a company’s assets minus its debt, ROE is considered the return on net assets. ROE is considered a measure of how effectively management is using a company’s assets to create profits.\n' +
            'ROE=EPS/BookValue\n' +
            'Average is 14% below 7% is bad \n https://www.investopedia.com/terms/r/returnonequity.asp',
        valueNote: (industry) => {
            return industryAverage[industry] && `Industry average is ${industryAverage[industry].roe} `
        },
        format: (cell, fieldValue, industry) => {
            formatIndustryUpTrend(cell, fieldValue, industryAverage[industry] && industryAverage[industry].roe)
        },
        title: 'ROE',
    },
    grossProfit: {
        description: "Gross profit is the profit a company makes after deducting the costs associated with making and selling its products, or the costs associated with providing its services. \n https://www.investopedia.com/terms/g/grossprofit.asp"
    },
    operatingCashflow: {
        description: "The operating cash flow ratio is a measure of how well current liabilities are covered by the cash flows generated from a company\"s operations. The ratio can help gauge a company\"s liquidity in the short term."
    },
    debtToEquity: {
        title: "Debt/Equity",
        description: "The debt-to-equity (D/E) ratio is calculated by dividing a company’s total liabilities by its shareholder equity.",
        "valueNote": (industry) => {
            return `Industry average is ${industryAverage[industry] && industryAverage[industry]['debt/equity']}`
        },
        format: (cell, fieldValue, industry) => {
            formatIndustryDownTrend(cell, fieldValue, industryAverage[industry] && industryAverage[industry]['debt/equity']);
        }
    },
    operatingMargins: {
        description: "Operating margin measures how much profit a company makes on a dollar of sales after paying for variable costs of production, such as wages and raw materials, but before paying interest or tax. It is calculated by dividing a company’s operating income by its net sales."
    },
    currentRatio: {
        description: "The current ratio is a liquidity ratio that measures a company\"s ability to pay short-term obligations or those due within one year. It tells investors and analysts how a company can maximize the current assets on its balance sheet to satisfy its current debt and other payables.\n assets/debt (UP)",
    },
    dividend: {},
    payoutRatio: {
        description: "The dividend payout ratio is the ratio of the total amount of dividends paid out to shareholders relative to the net income of the company."
    },
    nextYearSalesGrowth: {
        title: 'sales Growth next year'
    },
    nextYearGrowth: {
        title: 'Growth Estimates next year',
    },
    nextFiveYearsGrowth: {
        title: 'Growth Estimates next 5 years'
    },
    competitors: {},
    beta: {},
    totalCash: {},
    totalDebt: {},
}
