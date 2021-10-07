const axios = require('axios');

const requestInstance = axios.create({
    baseURL: 'https://yh-finance.p.rapidapi.com',
    headers: {
        'x-rapidapi-host': 'yh-finance.p.rapidapi.com',
        'x-rapidapi-key': '33212a2cedmsh5d14793715e5faep16ae3cjsn6f5fb8154a78'
    }
});

const balanceScrap = async (stock, browser) => {
    const {data} = await requestInstance.get('stock/v2/get-balance-sheet', {params: {symbol: stock, region: 'US'}});
    const {
        timeSeries,
        balanceSheetHistory: {balanceSheetStatements},
        incomeStatementHistory: {incomeStatementHistory},
        cashflowStatementHistory: {cashflowStatements}
    } = data;
    const longTermDebt = timeSeries.annualLongTermDebt.map(({reportedValue}) => reportedValue.raw);
    const currentDebt = timeSeries.annualCurrentDebt.map(({reportedValue}) => reportedValue.raw);
    const totalAssets = balanceSheetStatements[0].totalAssets.raw;
    const interestExpense = incomeStatementHistory[0].interestExpense.raw;
    const preTaxIncome = incomeStatementHistory[0].incomeBeforeTax.raw;
    const taxProvision = incomeStatementHistory[0].incomeTaxExpense.raw;
    const netIncomeHistory = incomeStatementHistory.map(({netIncome}) => netIncome.raw).reverse();
    const netIncome = netIncomeHistory[netIncomeHistory.length - 1];
    const revenueHistory = incomeStatementHistory.map(({totalRevenue}) => totalRevenue.raw).reverse();
    const revenue = revenueHistory[revenueHistory.length - 1];
    const freeCashFlow = cashflowStatements.map(({totalCashFromOperatingActivities, capitalExpenditures}) => {
        return totalCashFromOperatingActivities.raw + capitalExpenditures.raw
    }).reverse();

    return {
        totalDebt: longTermDebt[longTermDebt.length - 1] + currentDebt[currentDebt.length - 1],
        longTermDebt,
        totalAssets,
        revenueHistory,
        netIncomeHistory,
        netIncome,
        taxProvision,
        interestExpense,
        preTaxIncome,
        revenue,
        freeCashFlow
    }
}

module.exports = {
    balanceScrap,
}
