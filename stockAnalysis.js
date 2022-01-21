const _ = require('lodash');
const {average, pairsDifference} = require("./utils");
const EXPECTED_RETURN_OF_MARKET = 0.1;
const PERPETUAL_GROWTH = 0.025;

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
        const revenueGrowthArr = pairsDifference(revenueArr)
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

const getProjectedCashFlow = (stockData, cashFlowRate, projectedRevenue) => {
    const incomeMargin = getIncomeMargin(stockData.netIncomeHistory, projectedRevenue, stockData.custom.profitMargin);
    const projectedIncome = [...stockData.netIncomeHistory];
    const revenueForCalculation = projectedRevenue.slice(projectedIncome.length)
    const projectedCashFlow = [...stockData.freeCashFlowHistory];
    if(stockData.custom.cashFlowGrowth) {
        _.range(4).forEach(() => {
            projectedCashFlow.push(_.last(projectedCashFlow) * (stockData.custom.cashFlowGrowth));
        });
    } else {
        revenueForCalculation.forEach(revenue => {
            const incomeProjected = revenue * incomeMargin;
            projectedCashFlow.push(incomeProjected * cashFlowRate)
        })
    }

    return projectedCashFlow
}

const getPredictedShareOutStanding = ({ custom, sharesOutstanding }, predictionCashFlow, ) => {
    if(!custom.shareGrowth || custom.shareGrowth === 1) {
        return sharesOutstanding;
    }

    const predictedShareOutStanding = predictionCashFlow.reduce((acc) => {
        return acc * custom.shareGrowth;
    }, sharesOutstanding);

    console.log('predictedShareOutStanding', predictedShareOutStanding)
    return predictedShareOutStanding;

}
const getCashFlowRate = ({ netIncomeHistory, freeCashFlowHistory }) => {
    const cashFlowByIncome = netIncomeHistory.map((income, index) => {
        return freeCashFlowHistory[index] / income
    });

    if(netIncomeHistory.length !== freeCashFlowHistory.length) {
        console.warn('Income and Free cash flow has different history size')
    }
    const min = Math.min(...cashFlowByIncome);
    const avg = average(cashFlowByIncome);
    if(min < 1 && avg < 1) {
        return _.last(cashFlowByIncome);
    }
    return min < 1 ? avg : min;
}
const dcf = (stockData) => {
    const requiredReturn = stockData.custom.requiredReturn || getWacc(stockData);
    const cashFlowRate = stockData.custom.cashFlowRate || getCashFlowRate(stockData);
    const projectedRevenue = getRevenuePredication(stockData);

    const projectedCashFlow = getProjectedCashFlow(stockData, cashFlowRate, projectedRevenue);

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
    const predictedSharOutStanding = getPredictedShareOutStanding(stockData, predictionCashFlow)
    const result = todayValue / predictedSharOutStanding;
    console.log('result', result)

    return result;
}
module.exports = {
    dcf,
}
