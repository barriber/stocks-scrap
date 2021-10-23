const {GoogleSpreadsheet} = require('google-spreadsheet');
const _ = require('lodash');
const spreadSheetDef = require('./spreadSheetDefinition');
const {deepClone} = require("./utils");
const LAST_COLUMN = 'AZ';

const setHeader = async (sheet, difference) => {
    const newHeader = [...sheet.headerValues, ...difference];
    await sheet.setHeaderRow(newHeader);
    await sheet.loadCells(`A1:${LAST_COLUMN}1`); // loads a range of cells
    difference.forEach((field) => {
        const index = newHeader.findIndex((header) => header === field);
        if (field.description && typeof field.description !== "function") {
            const cell = sheet.getCell(0, index);
            cell.note = field.description
        }
    })
}

const setValues = async (sheet, stock, rowIndex, stockData) => {
    await sheet.loadCells(`A${rowIndex}:${LAST_COLUMN}${rowIndex}`);
    _.forEach(stock, async (field, key) => {
        const title = field.title ? field.title : _.startCase(key)
        const headerIndex = sheet.headerValues.findIndex(val => val.toLowerCase() === title.toLowerCase());
        if (headerIndex > -1) {
            const cell = sheet.getCell(rowIndex - 1, headerIndex);
            if (field.formula) {
                cell.formula = field.formula(stock.symbol.value, stockData)
            } else if (field.value) {
                cell.value = field.value;
            }

            if (field.valueNote) {
                cell.note = field.valueNote(stockData)
            }

            field.format && field.format(cell, field.value, stock);
        } else {
            console.warn('MISSING COLUMN', title);
        }
    })
}

const modifySpreadsheet = async (stock, {sheet, rows}) => {
    //In order to know how many new lines needed
    const stockDefinition = deepClone(spreadSheetDef);
    Object.entries(stockDefinition).forEach(([key, value]) => {
        if (stock[key]) {
            stockDefinition[key].value = stock[key];
        }
    });
    const stockRow = rows.find(row => row.symbol.toLowerCase() === stockDefinition.symbol.value.toLowerCase());
    const rowIndex = stockRow ? stockRow.rowNumber : rows.length + acc.newStocks + 2;
    await setValues(sheet, stockDefinition, rowIndex, stock)
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
    const rows = await sheet.getRows();

    if (sheet.gridProperties.columnCount < 50) {
        await sheet.resize({rowCount: 100, columnCount: 50})
    }
    const headers = _.map(spreadSheetDef, (obj, key) => {
        return obj.title ? obj.title : _.startCase(key);
    });

    const headersToUpdate = _.differenceBy(headers, sheet.headerValues, _.toLower);
    if (headersToUpdate.length > 0) {
        await setHeader(sheet, headersToUpdate);
    }
    return {sheet, rows}

}

module.exports = {modifySpreadsheet, initializeSpreadSheet}
