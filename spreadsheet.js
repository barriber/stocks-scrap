const {GoogleSpreadsheet} = require('google-spreadsheet');
const spreadSheetDef = require('./spreadSheetDefinition');
const LAST_COLUMN = 'AZ'
const setHeader = async (sheet) => {
    const headers = Object.keys(spreadSheetDef);
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

const setValues = async (sheet, stock, rowIndex ) => {
    const values = Object.values(stock)
    await sheet.loadCells(`A${rowIndex}:${LAST_COLUMN}${rowIndex}`);
    values.forEach((field, index) => {
        const cell = sheet.getCell(rowIndex -1, index);
        if (field.formula) {
            cell.formula = field.formula(values[0].value)
        } else {
            cell.value = field.value || 'N/A'
        }

        if (field.valueNote) {
            cell.note = field.valueNote(stock.industry.value)
        }

            field.format && field.format(cell, field.value, stock.industry.value);
    })
}

const modifySpreadsheet = async (stocks, {sheet, rows}) => {
    //In order to know how many new lines needed
    const stockPromises = stocks.reduce((acc, stock) => {
        const stockRow = rows.find(row => row.symbol === stock.symbol.value);
        const  rowIndex = stockRow ? stockRow.rowNumber : rows.length + acc.newStocks + 2;
        acc.result.push(setValues(sheet, stock, rowIndex))
        if(!stockRow) {
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
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // await sheet.resize({rowCount: 30, columnCount: 50})
    await setHeader(sheet);
    const rows = await sheet.getRows();

    return { sheet, rows }

}

module.exports = {modifySpreadsheet, initializeSpreadSheet}