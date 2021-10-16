const { getYahooApi } = require('./utils');
const industryAverages = require('./industryAverages.json')


const stockScrap = async (stock) => {
    const requestInstance = getYahooApi();
    const { data } = await requestInstance.get('get-summary', {params: {symbol: stock, region: 'US'}});

    const { defaultKeyStatistics, financialData, summaryDetail, price, summaryProfile } = data;
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

module.exports = {
    stockScrap,
}
