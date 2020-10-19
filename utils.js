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

const formatIndustryDownTrend = (cell, fieldValue, industry) => {
    const industryFloat =  typeof industry === 'string' ? parseFloat(industry.split('%')[0]) : industry
    const fieldFloat = typeof industry === 'string' ? parseFloat(fieldValue.split('%')[0]): fieldValue

    if(fieldFloat > industryFloat * 1.1) {
        cell.textFormat = {foregroundColor: {red: 1, green: 0, blue: 0}}

    } else if (fieldFloat < industryFloat * 0.9){
        cell.textFormat = {foregroundColor: {red: 0, green: 1, blue: 0}}
    }
}

const formatIndustryUpTrend = (cell, fieldValue, industry) => {
    const fieldFloat = typeof industry === 'string' ? parseFloat(fieldValue.split('%')[0]): fieldValue
    const industryValue = typeof industry === 'string' ? parseFloat(industry.split('%')[0]): industry
    if(fieldFloat > industryValue * 1.1) {
        cell.textFormat = {foregroundColor: {red: 0, green: 1, blue: 0}}

    } else if (fieldFloat < industryValue * 0.9){
        cell.textFormat = {foregroundColor: {red: 1, green: 0, blue: 0}}
    }
}
module.exports = {
    deepClone,
    formatIndustryDownTrend,
    formatIndustryUpTrend,
}