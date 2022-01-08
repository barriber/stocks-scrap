const axios = require('axios');
const _ = require('lodash');
const industryAverages = require('./industryAverages.json')

class YahooApi {
    constructor() {
        this.apiInstance = axios.create({
            baseURL: 'https://yh-finance.p.rapidapi.com/stock/v2',
            headers: {
                'x-rapidapi-host': 'yh-finance.p.rapidapi.com',
                'x-rapidapi-key': '33212a2cedmsh5d14793715e5faep16ae3cjsn6f5fb8154a78'
            }
        });
    }

    async getStockSummary(stock) {
        const {data} = await this.apiInstance.get('get-summary', {params: {symbol: stock, region: 'US'}});
        const {defaultKeyStatistics, financialData, summaryDetail, price, summaryProfile} = data;
        if (price.quoteType === 'INDEX') {
            return {price: price.regularMarketPrice.raw}
        }

        const industry = summaryProfile.industry
        return {
            exchangeName: price.exchangeName === 'NasdaqGS' ? 'NASDAQ' : price.exchangeName,
            forwardPE: defaultKeyStatistics.forwardPE.raw,
            beta: defaultKeyStatistics.beta.raw,
            peg: defaultKeyStatistics.pegRatio.raw,
            roe: financialData.returnOnEquity.raw,
            roa: financialData.returnOnAssets.raw,
            profitMargin: defaultKeyStatistics.profitMargins.raw,
            operatingMargin: financialData.operatingMargins.raw,
            operatingCashFlow: financialData.operatingCashflow.raw,
            currentRatio: financialData.currentRatio.raw,
            payoutRatio: summaryDetail.payoutRatio.raw,
            debtToEquity: financialData.debtToEquity.raw,
            marketCap: price.marketCap.raw,
            sharesOutstanding: defaultKeyStatistics.sharesOutstanding.raw,
            totalCash: financialData.totalCash.raw,
            totalDebt: financialData.totalDebt.raw,
            grossProfit: financialData.grossProfits.raw,
            industry,
            sector: summaryProfile.sector,
            industryPE: industryAverages[industry] && industryAverages[industry].pe,
            dividend: summaryDetail.dividendRate.raw,
        }
    }

    async getStockFinance(stock) {
        const {data} = await this.apiInstance.get('get-balance-sheet', {params: {symbol: stock, region: 'US'}});
        const {
            timeSeries,
            balanceSheetHistory: {balanceSheetStatements},
            incomeStatementHistory: {incomeStatementHistory},
            cashflowStatementHistory: {cashflowStatements}
        } = data;
        const longTermDebt = _.compact(timeSeries.annualLongTermDebt).map(({reportedValue}) => reportedValue.raw);
        const totalAssets = balanceSheetStatements[0].totalAssets.raw;
        const interestExpense = incomeStatementHistory[0].interestExpense.raw;
        const preTaxIncome = incomeStatementHistory[0].incomeBeforeTax.raw;
        const taxProvision = incomeStatementHistory[0].incomeTaxExpense.raw;
        const netIncomeHistory = incomeStatementHistory.map(({netIncome}) => netIncome.raw).reverse();
        const netIncome = netIncomeHistory[netIncomeHistory.length - 1];
        const revenueHistory = incomeStatementHistory.map(({totalRevenue}) => totalRevenue.raw).reverse();
        const revenue = revenueHistory[revenueHistory.length - 1];
        const freeCashFlowHistory = cashflowStatements.map(({totalCashFromOperatingActivities, capitalExpenditures}) => {
            return totalCashFromOperatingActivities.raw + (capitalExpenditures?.raw || 0)
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
            freeCashFlowHistory
        }
    }

    async getStockAnalysis(stock) {
        const {
            data: {
                earningsTrend,
                financialData,
                ...rest
            }
        } = await this.apiInstance.get('get-analysis', {params: {symbol: stock, region: 'US'}});
        const earningEstimates = this.getEarningsAnalysis(earningsTrend);
        return {
            ...earningEstimates,
            medianRecommendedPricePrice: financialData.targetMedianPrice.raw,
            recommendationRating: financialData.recommendationMean.raw,
        }
    }

    getEarningsAnalysis = ({trend}) => {
        const currentYear = trend.find(({period}) => period === '0y');
        const nextYear = trend.find(({period}) => period === '+1y');
        const nextFiveYears = trend.find(({period}) => period === '+5y');
        return {
            currentYearGrowth: currentYear.growth.raw,
            currentYearSalesGrowth: currentYear.earningsEstimate.growth.raw,
            nextYearGrowth: nextYear.growth.raw,
            nextYearSalesGrowth: nextYear.earningsEstimate.growth.raw,
            nextFiveYearsGrowth: nextFiveYears.growth.raw,
            revenueEstimateCurrentYear: currentYear.revenueEstimate.avg.raw,
            revenueEstimateNextYear: nextYear.revenueEstimate.avg.raw
        }
    }
}

module.exports = YahooApi
