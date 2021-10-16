const {GoogleSpreadsheet} = require('google-spreadsheet');
const _ = require('lodash');
const spreadSheetDef = require('./spreadSheetDefinition');
const LAST_COLUMN = 'AZ'

const setHeader = async (sheet) => {
    const headers = _.map(spreadSheetDef, (obj, key) => {
        return obj.title ? obj.title : _.startCase(key);
    });
    const values = Object.values(spreadSheetDef);
    await sheet.setHeaderRow(headers);
    await sheet.loadCells(`A1:${LAST_COLUMN}1`); // loads a range of cells

    values.forEach((field, index) => {
        if (field.description && typeof field.description !== "function") {
            const cell = sheet.getCell(0, index);
            cell.note = field.description
        }
    })
}

const setValues = async (sheet, stock, rowIndex) => {
    await sheet.loadCells(`A${rowIndex}:${LAST_COLUMN}${rowIndex}`);
    _.forEach(stock, (field, key) => {
        const title = field.title ? field.title : _.startCase(key)
        const headerIndex = sheet.headerValues.findIndex(val => val.toLowerCase() === title.toLowerCase());
        if (headerIndex > -1) {
            const cell = sheet.getCell(rowIndex - 1, headerIndex);
            if (field.formula) {
                cell.formula = field.formula(stock.symbol.value)
            } else if (field.value) {
                cell.value = field.value;
            }

            if (field.valueNote) {
                cell.note = field.valueNote(stock.industry.value)
            }

            field.format && field.format(cell, field.value, stock.industry.value);
        } else {
            console.log('title', title)
        }
    })
}

const modifySpreadsheet = async (stocks, {sheet, rows}) => {
    //In order to know how many new lines needed
    const stockPromises = stocks.reduce((acc, stock) => {
        const stockRow = rows.find(row => row.symbol === stock.symbol.value);
        const rowIndex = stockRow ? stockRow.rowNumber : rows.length + acc.newStocks + 2;
        acc.result.push(setValues(sheet, stock, rowIndex))
        if (!stockRow) {
            acc.newStocks += 1;
        }
        return acc;
    }, {result: [], newStocks: 0})
    await Promise.all(stockPromises.result)
    await sheet.saveUpdatedCells();
}

const initializeSpreadSheet = async (spreadsheetId) => {
    const doc = new GoogleSpreadsheet(spreadsheetId);
    await doc.useServiceAccountAuth({
        client_email: process.env.client_email,
        private_key: process.env.private_key.replace(/\\n/gm, '\n'),
    });
    console.log('SPREADSHEET AUTH SUCCESS')
    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['Watchlist'];
    if (!sheet) {
        sheet = await doc.addSheet({title: 'Watchlist'})
    }

    if (sheet.gridProperties.columnCount < 30) {
        await sheet.resize({rowCount: 100, columnCount: 50})
        await setHeader(sheet);
    }

    const rows = await sheet.getRows();
    return {sheet, rows}

}

module.exports = {modifySpreadsheet, initializeSpreadSheet}
