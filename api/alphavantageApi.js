const axios = require("axios");
const _ = require('lodash');
const key = 'YQXCADA8XZ142H0F';

class AlphaVantage {
    constructor() {
        this.apiInstance = axios.create({
            baseURL: 'https://www.alphavantage.co/query',
            params: {
                apikey: key
            }
        });
    }

    async getFreeCashFlow(symbol) {
        const { data } = await this.apiInstance.get('', {params: {symbol, function: 'CASH_FLOW'}});
        if(_.isEmpty(data)) {
            return {}
        }
        const freeCashFlowHistory = data.annualReports.map(({ operatingCashflow, capitalExpenditures }) => {
            return parseInt(operatingCashflow) - parseInt(capitalExpenditures)
        }).reverse();

        return {
            freeCashFlowHistory
        }
    }

    async getBalanceSheet(symbol) {
        const { data } = await this.apiInstance.get('', {params: {symbol, function: 'BALANCE_SHEET'}});
        if(_.isEmpty(data)) {
            return {}
        }
        const commonStockSharesOutstandingHistory = data.annualReports
            .map(({commonStockSharesOutstanding}) =>  parseInt(commonStockSharesOutstanding)).reverse()

        return {
            commonStockSharesOutstandingHistory
        }
    }

}

module.exports = AlphaVantage;
