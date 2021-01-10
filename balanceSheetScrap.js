const cheerio = require('cheerio');
const {parseStringNumber} = require("./utils");

const incomeURL = 'https://finance.yahoo.com/quote/$stock/financials?p=$stock'
const balanceURL = 'https://finance.yahoo.com/quote/$stock/balance-sheet?p=$stock'
const cashFlowURL = 'https://finance.yahoo.com/quote/$stock/cash-flow?p=$stock'

const financialsParser = ($, text, columnIndex = 1) => {
    const category = $('span').filter(function () {
        return $(this).text().trim() === text;
    });
    const row = category[0].parent.parent.parent;
    const interestExpenseRow = $(row).children();
    const value = $(interestExpenseRow[columnIndex]).text();
    return parseStringNumber(value);
}
const clickExpandAll = async (page) => {
    await page.waitFor(2000);
    const linkHandlers = await page.$x("//span[contains(text(), 'Expand All')]");
    await page.waitFor(2000);
    await linkHandlers[0].click();
}
const incomeScrap = async (stock, browser) => {
    console.time('income')
    console.log('ENTER')

    const page = await browser.newPage();
    await page.goto(incomeURL.replace(/\$stock/g, stock));

    await clickExpandAll(page);
    const content = await page.content();
    const $ = cheerio.load(content);
    const interestExpense = financialsParser($, 'Interest Expense');
    const preTaxIncome = financialsParser($, 'Pretax Income');
    const taxProvision = financialsParser($, 'Tax Provision');
    const netIncomeText = 'Normalized Income';
    const totalRevenue = 'Total Revenue'
    const netIncome = [financialsParser($, netIncomeText, 5), financialsParser($, netIncomeText, 4),
        financialsParser($, netIncomeText, 3), financialsParser($, netIncomeText, 2)]
    const revenue = [financialsParser($, totalRevenue, 5), financialsParser($, totalRevenue, 4),
        financialsParser($, totalRevenue, 3), financialsParser($, totalRevenue, 2)];
    console.timeEnd('income')

    return {
        interestExpense,
        preTaxIncome,
        taxProvision,
        netIncome,
        revenue
    }
}

const balanceScrap = async (stock, browser) => {
    console.time('balance')
    const page = await browser.newPage();
    await page.goto(balanceURL.replace(/\$stock/g, stock));
    await page.waitFor(2000);
    const xx = await page.$x("//span[contains(text(), 'Quarterly')]");
    await xx[0].click();
    await page.waitFor(2000);
    await clickExpandAll(page);
    const content = await page.content();
    const $ = cheerio.load(content);
    const totalDebt = financialsParser($, 'Total Debt');
    const shareOutstanding = financialsParser($, 'Share Issued');
    console.timeEnd('balance')

    return {
        totalDebt,
        shareOutstanding
    }
}

const cashFlowScrap = async (stock, browser) => {
    const page = await browser.newPage();
    await page.goto(cashFlowURL.replace(/\$stock/g, stock));
    const content = await page.content();
    const $ = cheerio.load(content);
    const flowText = 'Free Cash Flow';
    const freeCashFlow = [financialsParser($, flowText, 5), financialsParser($, flowText, 4),
        financialsParser($, flowText, 3), financialsParser($, flowText, 2)]
    return {
        freeCashFlow
    }
}


module.exports = {
    cashFlowScrap,
    incomeScrap,
    balanceScrap,
}
