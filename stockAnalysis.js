const _ = require('lodash');
const {average} = require("./utils");
const EXPECTED_RETURN_OF_MARKET = 0.1;
const PERPETUAL_GROWTH = 0.025;

//TODO add customRevenu growth
const getRevenuePredication = (stockData) => {
    const customRevenueGrowth = stockData.custom.revenueGrowth
    const revenueArr = [...stockData.revenueHistory];
    if (customRevenueGrowth) {
        _.range(4).forEach(() => {
            revenueArr.push(_.last(revenueArr) * (customRevenueGrowth));
        });
    } else {
        revenueArr.push(stockData.revenueEstimateCurrentYear);
        revenueArr.push(stockData.revenueEstimateNextYear);
        const revenueGrowthArr = []
        for (let i = 0; i < revenueArr.length - 1; i++) {
            revenueGrowthArr.push((revenueArr[i + 1] - revenueArr[i]) / revenueArr[i]);
        }

        const sumRevenueGrowth = revenueGrowthArr.reduce((a, b) => a + b, 0)
        const average = sumRevenueGrowth / (revenueArr.length - 1);
        revenueArr.push(revenueArr[revenueArr.length - 1] * (1 + average));
        revenueArr.push(revenueArr[revenueArr.length - 1] * (1 + average));
    }

    return revenueArr;
}

// Weighted Average Cost of Capital
const getWacc = (stockData) => {
    // https://www.youtube.com/watch?v=fd_emLLzJnk&t=944s
    const interestExpense = Math.abs(stockData.interestExpense);
    const debtRate = interestExpense / stockData.totalDebt;
    const effectiveTaxRate = 1 - (interestExpense / stockData.preTaxIncome);
    const costOfDebt = effectiveTaxRate * debtRate;
    const costOfEquity = stockData.treasuryBondRate + stockData.beta * (EXPECTED_RETURN_OF_MARKET - stockData.treasuryBondRate)
    const marketCap = stockData.marketCap
    const total = marketCap + stockData.totalDebt;
    const debtPercent = stockData.totalDebt / total;
    const capPercent = marketCap / total

    return (debtPercent * costOfDebt) + (capPercent * costOfEquity);
}

const getIncomeMargin = (netIncomeHistory, projectedRevenue, customProfitMargin) => {
    if (customProfitMargin) {
        return customProfitMargin;
    }
    const netIncomeMargins = netIncomeHistory.map((income, index) => income / projectedRevenue[index]);
    const avg = average(netIncomeMargins);
    const minIncomeMargin = Math.min(...netIncomeMargins); //TODO custom netIncomeMar
    return avg / minIncomeMargin > 1.4 ? avg : minIncomeMargin;
}

const getProjectedIncomeAndCashFlow = (stockData, cashFlowRate, projectedRevenue) => {
    const incomeMargin = getIncomeMargin(stockData.netIncomeHistory, projectedRevenue, stockData.custom.profitMargin);
    const projectedIncome = [...stockData.netIncomeHistory];
    const revenueForCalculation = projectedRevenue.slice(projectedIncome.length)
    const projectedCashFlow = [...stockData.freeCashFlowHistory];
    revenueForCalculation.forEach(revenue => {
        const incomeProjected = revenue * incomeMargin;
        projectedCashFlow.push(incomeProjected * cashFlowRate)
    })

    return {projectedCashFlow}
}

const getCashFlowRate = (cashFlowByIncome) => {
    //TODO Add custom
    const min = Math.min(...cashFlowByIncome);
    const avg = average(cashFlowByIncome);
    return min < 1 ? avg : min;
}
const dcf = (stockData) => {
    const requiredReturn = stockData.custom.expectedGrowth || getWacc(stockData);
    const cashFlowByIncome = stockData.netIncomeHistory.map((income, index) => stockData.freeCashFlowHistory[index] / income);
    const cashFlowRate = stockData.custom.cashFlowRate || getCashFlowRate(cashFlowByIncome);
    const projectedRevenue = getRevenuePredication(stockData);

    const {projectedCashFlow} = getProjectedIncomeAndCashFlow(stockData, cashFlowRate, projectedRevenue);

    const terminalValue = (_.last(projectedCashFlow) * (1 + PERPETUAL_GROWTH)) / (requiredReturn - PERPETUAL_GROWTH);
    const predictionCashFlow = projectedCashFlow.slice(stockData.freeCashFlowHistory.length);

    const presentValueCashFlow = predictionCashFlow.map((val, index) => {
        const discountFactor = Math.pow((1 + requiredReturn), index + 1)
        return val / discountFactor
    });
    const totalDebt = stockData.totalDebt;
    const totalCash = stockData.totalCash;
    const todayTerminalValue = (terminalValue / Math.pow((1 + requiredReturn), predictionCashFlow.length)) - (totalDebt > totalCash ? totalDebt - totalCash : 0)
    presentValueCashFlow.push(todayTerminalValue);
    const todayValue = _.sum(presentValueCashFlow);
    const result = todayValue / stockData.sharesOutstanding;
    console.log('result', result)
    return result;
}
module.exports = {
    dcf,
}
