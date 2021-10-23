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

const average = (arr) => {
    return arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
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
    const industryValue = typeof industry === 'string' ? parseFloat(industry.split('%')[0]): industry
    if(fieldValue > industryValue * 1.1) {
        cell.textFormat = {foregroundColor: {red: 0, green: 1, blue: 0}}

    } else if (fieldValue < industryValue * 0.9){
        cell.textFormat = {foregroundColor: {red: 1, green: 0, blue: 0}}
    }
    cell.numberFormat = {type: 'PERCENT' };
    cell.value = +fieldValue.toFixed(3);
}

const formatPercent = (cell, fieldValue) => {
    cell.numberFormat = {type: 'PERCENT' };
    if(fieldValue) {
        cell.value = +fieldValue.toFixed(3);
    }
}

const bigNumberFormat = (cell, fieldValue) => {
    cell.numberFormat = {type: 'NUMBER', pattern: fieldValue > 10000000 ? '0.00,,,"B"' :  '0.00,,"M"'};
    cell.value = fieldValue;
}
const decimalFormat = (cell, fieldValue) => {
    cell.numberFormat = {type: 'NUMBER', pattern: '###.##'};
}

module.exports = {
    average,
    decimalFormat,
    formatPercent,
    bigNumberFormat,
    deepClone,
    formatIndustryDownTrend,
    formatIndustryUpTrend,
}
