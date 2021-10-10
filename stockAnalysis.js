const EXPECTED_RETURN_OF_MARKET = 0.1;
const TREASURY_BOND_10Y = 0.01105;
const PERPETUAL_GROWTH = 0.025;

const getRevenuePredication = (income, stockDefinition) => {
    const revenueArr = [...income.revenue, stockDefinition.revenueCurrentYear.value, stockDefinition.revenueNextYear.value].filter(val => !isNaN(val));

    let sumRevenueGrowth = 0
    for (i = 0; i < revenueArr.length - 1; i++) {
        sumRevenueGrowth += ((revenueArr[i + 1] - revenueArr[i]) / revenueArr[i]);
    }

    const average = sumRevenueGrowth / revenueArr.length - 1;
    revenueArr.push(revenueArr[revenueArr.length - 1] * (1 + average));
    revenueArr.push(revenueArr[revenueArr.length - 1] * (1 + average));

    return revenueArr;
}

// Weighted Average Cost of Capital
const getWacc = (income, balance, stockDefinition) => {
    // https://www.youtube.com/watch?v=fd_emLLzJnk&t=944s
    const interestExpense = income.interestExpense || 0
    const effectiveTaxRate = 1 - (interestExpense / income.preTaxIncome);
    const debtRate = interestExpense / balance.totalDebt;
    const costOfDebt = effectiveTaxRate * debtRate;
    const beta = parseFloat(stockDefinition.beta.value);
    const costOfEquity = TREASURY_BOND_10Y + beta * (EXPECTED_RETURN_OF_MARKET - TREASURY_BOND_10Y)
    const marketCap = stockDefinition['market cap'].value
    const total = marketCap + balance.totalDebt;
    const debtPercent = balance.totalDebt / total;
    const capPercent = marketCap / total
    return (debtPercent * costOfDebt) + (capPercent * costOfEquity);
}

const getProjectedIncomeAndCashFlow = (income, cashFlow, cashFlowRate, minIncomeMargin) => {
    const projectedIncome = [...income];
    const projectedCashFlow = [...cashFlow];
    for (i = 0; i < 4; i++) {
        const incomeProjected = projectedIncome[projectedIncome.length - 1] * (1 + minIncomeMargin)
        projectedIncome.push(incomeProjected);
        projectedCashFlow.push(incomeProjected * cashFlowRate)
    }

    return {projectedIncome, projectedCashFlow}
}
const dcf = (stockDefinition, income, balance, cashFlow) => {
    const requiredReturn = getWacc(income, balance, stockDefinition)
    const cashFlowByIncome = income.netIncome.map((income, index) => cashFlow.freeCashFlow[index] / income).filter(x=> !isNaN(x));
    const cashFlowRate = Math.min(...cashFlowByIncome);
    const revenue = getRevenuePredication(income, stockDefinition);
    const netIncomeMargins = income.netIncome.filter(x=> !isNaN(x)).map((income, index) => income / revenue[index]);
    const minIncomeMargin = Math.min(...netIncomeMargins);
    const {projectedIncome, projectedCashFlow} = getProjectedIncomeAndCashFlow(income.netIncome, cashFlow.freeCashFlow, cashFlowRate, minIncomeMargin)
    const terminalValue = ((projectedCashFlow[projectedCashFlow.length - 1]) * (1 + PERPETUAL_GROWTH)) / (requiredReturn - PERPETUAL_GROWTH);
    const predictionCashFlow = projectedCashFlow.slice(1).slice(-4);
    const presentValueCashFlow = predictionCashFlow.map((val, index) => {
        const discountFactor = Math.pow((1 + requiredReturn), index + 1)
        return val / discountFactor
    });
    const totalDebt = stockDefinition['Total debt'].value;
    const totalCash = stockDefinition['Total cash'].value;
    const todayTerminalValue = (terminalValue / Math.pow((1 + requiredReturn), 4)) - (totalDebt > totalCash ? totalDebt - totalCash : 0)
    presentValueCashFlow.push(todayTerminalValue);
    const todayValue = presentValueCashFlow.reduce((a, b) => {
        return a + b;
    }, 0); //sum
    const result = todayValue / stockDefinition.sharesOutstanding.value;

    console.log('result', result)

}
module.exports = {
    dcf,
}
