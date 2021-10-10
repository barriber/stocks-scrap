const axios = require('axios');

const deepClone = (aObject) => {
    if (!aObject) {
        return aObject;
    }

    let v;
    let bObject = Array.isArray(aObject) ? [] : {};
    for (const k in aObject) {
        v = aObject[k];
        bObject[k] = (typeof v === "object") ? deepClone(v) : v;
    }

    return bObject;
}

const getYahooApi = () => {
    return axios.create({
        baseURL: 'https://yh-finance.p.rapidapi.com/stock/v2',
        headers: {
            'x-rapidapi-host': 'yh-finance.p.rapidapi.com',
            'x-rapidapi-key': '33212a2cedmsh5d14793715e5faep16ae3cjsn6f5fb8154a78'
        }
    });
}
const formatIndustryDownTrend = (cell, fieldValue, industry) => {
    const fieldFloat = typeof fieldValue === 'string' ? parseFloat(fieldValue.split('%')[0]): fieldValue
    const industryFloat =  typeof industry === 'string' ? parseFloat(industry.split('%')[0]) : industry

    if(fieldFloat > industryFloat * 1.1) {
        cell.textFormat = {foregroundColor: {red: 1, green: 0, blue: 0}}

    } else if (fieldFloat < industryFloat * 0.9){
        cell.textFormat = {foregroundColor: {red: 0, green: 1, blue: 0}}
    }
}

const formatIndustryUpTrend = (cell, fieldValue, industry) => {
    const fieldFloat = typeof fieldValue === 'string' ? parseFloat(fieldValue.split('%')[0]): fieldValue
    const industryValue = typeof industry === 'string' ? parseFloat(industry.split('%')[0]): industry
    if(fieldFloat > industryValue * 1.1) {
        cell.textFormat = {foregroundColor: {red: 0, green: 1, blue: 0}}

    } else if (fieldFloat < industryValue * 0.9){
        cell.textFormat = {foregroundColor: {red: 1, green: 0, blue: 0}}
    }
}

module.exports = {
    getYahooApi,
    deepClone,
    formatIndustryDownTrend,
    formatIndustryUpTrend,
}
