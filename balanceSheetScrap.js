const { getYahooApi } = require('./utils');

const balanceScrap = async (stock) => {
    const requestInstance = getYahooApi();
    const {data} = await requestInstance.get('get-balance-sheet', {params: {symbol: stock, region: 'US'}});
    const {
        timeSeries,
        balanceSheetHistory: {balanceSheetStatements},
        incomeStatementHistory: {incomeStatementHistory},
        cashflowStatementHistory: {cashflowStatements}
    } = data;
    const longTermDebt = timeSeries.annualLongTermDebt.map(({reportedValue}) => reportedValue.raw);
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
