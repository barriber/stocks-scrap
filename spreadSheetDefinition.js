const industryAverage = require('./industryAverages.json');
const {formatIndustryUpTrend} = require("./utils");
const {formatIndustryDownTrend} = require("./utils");

module.exports = {
    "symbol": {
        formula: (stock) => `=HYPERLINK("https://finance.yahoo.com/quote/${stock}/", "${stock}")`
    },
    "sector": {},
    industry: {},
    "price": {
        formula: (stock) => `=GOOGLEFINANCE("${stock}")`
    },
    "market cap": {
        formula: (stock) => `=GOOGLEFINANCE("${stock}", "marketcap")`,
    },
    "52 week low": {
        formula: (stock) => `=GOOGLEFINANCE("${stock}", "low52")`,
    },
    "52 week high": {
        formula: (stock) => `=GOOGLEFINANCE("${stock}", "high52")`,
    },
    "day change": {
        formula: (stock) => `=GOOGLEFINANCE("${stock}","changepct") / 100`,
        format: (cell) => {
            cell.numberFormat = {type: 'PERCENT'}
        }
    },
    "p/e": {
        "formula": (stock) => `=GOOGLEFINANCE("${stock}","pe")`,
        "valueNote": (industry) => {
            return `Industry average is ${industryAverage[industry] && industryAverage[industry].pe} `
        },
    },
    "Forward p/e": {},
    "Profit Margin": {
        "description": "Profit margin is one of the commonly used profitability ratios to gauge the degree to which a company or a business activity makes money. It represents what percentage of sales has turned into profits. \n https://www.investopedia.com/terms/p/profitmargin.asp"
    },
    "Return on Equity": {
        description: 'Return on equity (ROE) is a measure of financial performance calculated by dividing net income by shareholders\' equity. Because shareholders\' equity is equal to a company’s assets minus its debt, ROE is considered the return on net assets. ROE is considered a measure of how effectively management is using a company’s assets to create profits.' +
            '\n average is 14% below 10% is bad \n https://www.investopedia.com/terms/r/returnonequity.asp',
        valueNote: (industry) => {
            return `Industry average is ${industryAverage[industry].roe} `
        },
        format: (cell, fieldValue, industry) => {
            formatIndustryUpTrend(cell, fieldValue, industryAverage[industry].roe)
        }
    },
    "gross profit": {
        "description": "Gross profit is the profit a company makes after deducting the costs associated with making and selling its products, or the costs associated with providing its services. \n https://www.investopedia.com/terms/g/grossprofit.asp"
    },
    // "Free Cash Flow Yield (missing)":{
    //   description: "Free cash flow yield is a financial solvency ratio that compares the free cash flow per share a company is expected to earn against its market value per share. The ratio is calculated by taking the free cash flow per share divided by the current share price. \n https://www.investopedia.com/terms/f/freecashflowyield.asp (above 5)"
    // },
    "peg": {
        "description": "The price/earnings to growth ratio (PEG ratio) is a stock\"s price-to-earnings (P/E) ratio divided by the growth rate of its earnings for a specified time period. The PEG ratio is used to determine a stock\"s value while also factoring in the company\"s expected earnings growth, and it is thought to provide a more complete picture than the more standard P/E ratio."
    },
    "Operating Cash Flow": {
        "description": "The operating cash flow ratio is a measure of how well current liabilities are covered by the cash flows generated from a company\"s operations. The ratio can help gauge a company\"s liquidity in the short term."
    },
    "Debt/Equity": {
        description: "The debt-to-equity (D/E) ratio is calculated by dividing a company’s total liabilities by its shareholder equity.",
        "valueNote": (industry) => {
            return `Industry average is ${industryAverage[industry] && industryAverage[industry]['debt/equity']}`
        },
        format: (cell, fieldValue, industry) => {
            formatIndustryDownTrend(cell, fieldValue, industryAverage[industry]['debt/equity']);
        }
    },
    "Levered Free Cash Flow": {
        "description": "Levered free cash flow (LFCF) is the amount of money a company has left remaining after paying all of its financial obligations. LFCF is the amount of cash a company has after paying debts, while unlevered free cash flow (UFCF) is cash before debt payments are made. Levered free cash flow is important because it is the amount of cash that a company can use to pay dividends and make investments in the business.\n "
    },
    "Operating Margin": {
        "description": "Operating margin measures how much profit a company makes on a dollar of sales after paying for variable costs of production, such as wages and raw materials, but before paying interest or tax. It is calculated by dividing a company’s operating income by its net sales."
    },
    "Current Ratio": {
        "description": "The current ratio is a liquidity ratio that measures a company\"s ability to pay short-term obligations or those due within one year. It tells investors and analysts how a company can maximize the current assets on its balance sheet to satisfy its current debt and other payables."
    },
    "dividend": {},
    "dividend growth (5y)": {

    },
    "Payout Ratio": {
        "description": "The dividend payout ratio is the ratio of the total amount of dividends paid out to shareholders relative to the net income of the company."
    },
    "earnings current year": {},
    "price/book": {},
    "price/sales": {},
    "earnings next year": {},
    "sales Growth current year": {},
    "sales Growth next year": {},
    "Growth Estimates current year": {},
    "Growth Estimates next year": {},
    "Growth Estimates next 5 years": {},
    "tipRanks": {},
    'industry pe': {},
    'Zacks recommendation': {
        description: '(1=Buy, 5=Sell)'
    }
}