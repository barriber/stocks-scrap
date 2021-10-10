const {getYahooApi} = require('./utils');


const getAnalysis = async (stock) => {
    const requestInstance = getYahooApi();
    const {data: {earningsTrend, financialData}} = await requestInstance.get('get-analysis', {params: {symbol: stock, region: 'US'}});
    const earningEstimates = getEarningsAnalysis(earningsTrend);
    return  {
        ...earningEstimates,
        medianRecommendedPricePrice:financialData.targetMedianPrice.raw,
        recommendationRating: financialData.recommendationMean.raw,
    }
}

const getEarningsAnalysis = ({trend}) => {
    const currentYear = trend.find(({period}) => period === '0y');
    const nextYear = trend.find(({period}) => period === '+1y');
    const nextFiveYears = trend.find(({period}) => period === '+5y');
    return {
        currentYearGrowth: currentYear.growth.raw,
        currentYearSalesGrowth: currentYear.earningsEstimate.growth.raw,
        nextYearGrowth: nextYear.growth.raw,
        nextYearSalesGrowth: nextYear.earningsEstimate.growth.raw,
        nextFiveYearsGrowth: nextFiveYears.growth.raw,
    }
}

module.exports = {
    getAnalysis,
}
