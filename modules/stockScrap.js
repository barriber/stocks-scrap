const _ = require('lodash');
const axios = require('axios');
const cheerio = require('cheerio');
const Redis = require('../Redis');
const YahooApi = require("../yahooApi");
// const regex = /\$stock/g;
const DAY_IN_SECONDS = 86400;

class StockScrap {
    constructor(stock) {
        this.stock = stock.toUpperCase();
        this.api = new YahooApi();
        this.redis = new Redis();
    }

    async getStockData(custom) {
        console.log('start - scrapping stock')
        try {
            const cached = await this.redis.client.get(this.stock);
            if(cached) {
                const stock = JSON.parse(cached);
                stock.custom = custom;
                return stock;
            }

            const [bondRate, ...stockScraping] = await Promise.all([this.getBondRate(),
                this.api.getStockSummary(this.stock), this.api.getStockAnalysis(this.stock), this.api.getStockFinance(this.stock)]);
            const stockData = stockScraping.reduce((acc, next) => {
                return {...acc, ...next}
            }, {})

            stockData.treasuryBondRate = bondRate ;
            stockData.competitors = await this.scrapCompetitors(stockData.exchangeName);
            stockData.symbol = this.stock;
            stockData.custom = custom;
            this.redis.client.set(this.stock, JSON.stringify(stockData), 'ex', DAY_IN_SECONDS * 21);

            return stockData;
        } catch (e) {
            console.log('Stock analysis Failed')
            console.log('Error', e);
        }
    }

    async getBondRate() {
        let bondRate = await this.redis.client.get('bondRate');
        if(bondRate) {
            return bondRate;
        }

        const tenYearsBond = await this.api.getStockSummary('^TNX');
        bondRate = tenYearsBond.price / 100;
        this.redis.client.set('bondRate', bondRate, 'ex', DAY_IN_SECONDS * 31);
        return bondRate;
    }

    async scrapCompetitors(market) {
        const parsedStock = this.stock.replace('.', '-');
        const competitorsUrl = `https://www.marketbeat.com/stocks/${market}/${parsedStock}/competitors-and-alternatives/`
        const {data: competitorData} = await axios(competitorsUrl)
        const $ = cheerio.load(competitorData);
        const competitors = $('.ticker-area').slice(0, 5);
        const stocks = []
        competitors.each((i, competitor) => {
            const stock = $(competitor).text();
            stocks.push(stock)
        })

        return stocks.join(', ')
    }
}

module.exports = StockScrap;

// const zacksTableParser = ($, tableId) => {
//     const tableRows = $(`#${tableId} tr`);
//     const rows = [];
//     tableRows.each((index, row) => {
//         if (index > 0) {
//             const rowObj = {}
//             const columns = $(row).children();
//             rowObj.title = $(columns[0]).text();
//             rowObj.company = $(columns[1]).text();
//             rowObj.industry = $(columns[2]).text();
//
//             rows.push(rowObj)
//         }
//     })
//     return rows;
// }
// const zacksScrap = async (stock, stockDefinition) => {
//     const zacksIndustryUrl = `https://www.zacks.com/stock/research/$stock/industry-comparison`;
//     let zacksData
//     try {
//         zacksData = await axios(zacksIndustryUrl.replace(regex, stock))
//         console.log('================', zacksData)
//     } catch (e) {
//         console.log('ZACKS FAILED')
//         console.log('xxxxx', JSON.stringify(e))
//     }
//
//     console.log('ZACKS FETCH SUCCESSS')
//     const $ = cheerio.load(zacksData.data);
//     const zacksRecomendations = zacksTableParser($, 'recommendations_estimates')
//     const growthRatesTable = zacksTableParser($, 'growth_rates')
//     const financialsTable = zacksTableParser($, 'financials')
//
//     if (zacksRecomendations.length > 0) {
//         stockDefinition['Zacks recommendation'] = {
//             value: zacksRecomendations[0].company,
//             valueNote: () => `Industry Zacks recommendation: ${zacksRecomendations[0].industry}`
//         }
//
//         stockDefinition["Growth Estimates next 5 years"].valueNote = () => `Zacks estimate: ${growthRatesTable[3].company}
//     \nIndustry Zacks estimates: ${growthRatesTable[3].industry}`
//         stockDefinition["Growth Estimates next year"].valueNote = () => `Zacks estimate: ${growthRatesTable[1].company}
//     \nIndustry Zacks estimates: ${growthRatesTable[1].industry}`
//         stockDefinition["Profit Margin"].valueNote = () => `Industry average ${financialsTable[4].industry}`
//         stockDefinition["Profit Margin"].format = (cell, fieldValue) => {
//             formatIndustryUpTrend(cell, fieldValue, financialsTable[4].industry);
//         }
//         stockDefinition["price/book"].valueNote = () => `industry ${financialsTable[1].industry}`
//         stockDefinition["price/book"].format = (cell, fieldValue) => {
//             formatIndustryDownTrend(cell, fieldValue, financialsTable[1].industry);
//         }
//     }
// }
