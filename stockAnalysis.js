const _ = require('lodash');
const {average} = require("./utils");
const EXPECTED_RETURN_OF_MARKET = 0.1;
const PERPETUAL_GROWTH = 0.025;

//TODO add customRevenu growth
const getRevenuePredication = (stockData, customInput) => {
    const customAverageGrowth = 1.09;
    const revenueArr = [...stockData.revenueHistory];
    if(!customAverageGrowth) {
        revenueArr.push(stockData.revenueEstimateCurrentYear);
        revenueArr.push(stockData.revenueEstimateNextYear);
    }
    const revenueGrowthArr = []
    for (let i = 0; i < revenueArr.length - 1; i++) {
        revenueGrowthArr.push((revenueArr[i + 1] - revenueArr[i]) / revenueArr[i]);
    }

    const sumRevenueGrowth = revenueGrowthArr.reduce((a, b) => a + b, 0)
    const average = sumRevenueGrowth / (revenueArr.length - 1);
    if(customAverageGrowth) {
        _.range(4).forEach(() => {
            revenueArr.push(revenueArr[revenueArr.length - 1] * (customAverageGrowth));
        })
    } else {
        revenueArr.push(revenueArr[revenueArr.length - 1] * (1 + average));
        revenueArr.push(revenueArr[revenueArr.length - 1] * (1 + average));
    }

    console.log('==REVENUE PROJECTED==', revenueArr)
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

const getIncomeMargin = (netIncomeHistory, projectedRevenue) => {
    const netIncomeMargins = netIncomeHistory.map((income, index) => income / projectedRevenue[index]);
    console.log('==netIncomeMargins===', netIncomeMargins)
    const avg = average(netIncomeMargins);
    const minIncomeMargin = Math.min(...netIncomeMargins); //TODO custom netIncomeMar
    return avg/minIncomeMargin > 1.4 ? avg : minIncomeMargin;
}
const getProjectedIncomeAndCashFlow = (stockData, cashFlowRate, projectedRevenue, custom) => {
    const incomeMargin = 0.23 || getIncomeMargin(stockData.netIncomeHistory, projectedRevenue);
    const projectedIncome = [...stockData.netIncomeHistory];
    const revenueForCalculation = projectedRevenue.slice(projectedIncome.length)
    const projectedCashFlow = [...stockData.freeCashFlowHistory];
    revenueForCalculation.forEach(revenue => {
        // if(custom.cashFlowGrowth) {
        //     projectedCashFlow.push(_.last(projectedCashFlow) * cashFlowRate)
        // } else {
            const incomeProjected = revenue * incomeMargin;
            projectedCashFlow.push(incomeProjected * cashFlowRate)
        // }
    })

    console.log('====PROJECTED CASHFLOW===', projectedCashFlow)
    return { projectedCashFlow }
}

const getCashFlowRate = (cashFlowByIncome, custom) => {
    //TODO Add custom
    const min = Math.min(...cashFlowByIncome);
    const avg = average(cashFlowByIncome);
    return min < 1 ? avg : min;
}
const dcf = (stockData, custom) => {
    const requiredReturn = 0.08 || getWacc(stockData);
    console.log('===REQUIRED RETURN===', requiredReturn)
    const cashFlowByIncome = stockData.netIncomeHistory.map((income, index) => stockData.freeCashFlowHistory[index] / income);
    const cashFlowRate = 1.24 || getCashFlowRate(cashFlowByIncome);
    const projectedRevenue = getRevenuePredication(stockData);

    const { projectedCashFlow } = getProjectedIncomeAndCashFlow(stockData, cashFlowRate, projectedRevenue, custom);

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

}
module.exports = {
    dcf,
}
