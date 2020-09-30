module.exports = {
    "symbol": {},
    "price": {
        formula: (stock) => `=GOOGLEFINANCE("${stock}")`
    },
    "market cap": {
      formula: (stock) =>   `=GOOGLEFINANCE("${stock}", "marketcap")`,
    },
    "52 week low": {
        formula: (stock) =>   `=GOOGLEFINANCE("${stock}", "low52")`,
    },
    "52 week high": {
        formula: (stock) =>   `=GOOGLEFINANCE("${stock}", "high52")`,
    },
    "day change": {
        formula: (stock) => `=GOOGLEFINANCE("${stock}","changepct") / 100`,
        format: (cell) => {
            cell.numberFormat = {type: 'PERCENT'}
        }
    },
    "p/e": {
        "formula": (stock) => `=GOOGLEFINANCE("${stock}","pe")`
    },
    "Forward p/e": {},
    "Profit Margin": {
        "description": "Profit margin is one of the commonly used profitability ratios to gauge the degree to which a company or a business activity makes money. It represents what percentage of sales has turned into profits. \n https://www.investopedia.com/terms/p/profitmargin.asp"
    },
    "gross profit": {
        "description": "Gross profit is the profit a company makes after deducting the costs associated with making and selling its products, or the costs associated with providing its services. \n https://www.investopedia.com/terms/g/grossprofit.asp"
    },
    "peg": {
        "description": "The price/earnings to growth ratio (PEG ratio) is a stock\"s price-to-earnings (P/E) ratio divided by the growth rate of its earnings for a specified time period. The PEG ratio is used to determine a stock\"s value while also factoring in the company\"s expected earnings growth, and it is thought to provide a more complete picture than the more standard P/E ratio."
    },
    "operating cash flow": {
        "description": "The operating cash flow ratio is a measure of how well current liabilities are covered by the cash flows generated from a company\"s operations. The ratio can help gauge a company\"s liquidity in the short term.\n Using cash flow as opposed to net income is considered a cleaner or more accurate measure since earnings are more easily manipulated."
    },
    "Operating Cash Flow": {
        "description": "The operating cash flow ratio is a measure of how well current liabilities are covered by the cash flows generated from a company\"s operations. The ratio can help gauge a company\"s liquidity in the short term."
    },
    "Levered Free Cash Flow": {
        "description": "Levered free cash flow (LFCF) is the amount of money a company has left remaining after paying all of its financial obligations. LFCF is the amount of cash a company has after paying debts, while unlevered free cash flow (UFCF) is cash before debt payments are made. Levered free cash flow is important because it is the amount of cash that a company can use to pay dividends and make investments in the business.\n"
    },
    "Operating Margin": {
        "description": "Operating margin measures how much profit a company makes on a dollar of sales after paying for variable costs of production, such as wages and raw materials, but before paying interest or tax. It is calculated by dividing a company’s operating income by its net sales."
    },
    "Current Ratio": {
        "description": "The current ratio is a liquidity ratio that measures a company\"s ability to pay short-term obligations or those due within one year. It tells investors and analysts how a company can maximize the current assets on its balance sheet to satisfy its current debt and other payables."
    },
    "Payout Ratio": {
        "description": "The dividend payout ratio is the ratio of the total amount of dividends paid out to shareholders relative to the net income of the company."
    },
    "dividend": {},
    "earnings current year": {},

    "earnings next year": {},
    "sales Growth current year": {},
    "sales Growth next year": {},
    "Growth Estimates current year": {},
    "Growth Estimates next year": {},
    "Growth Estimates next 5 years": {},
    "tipRanks": {}
}