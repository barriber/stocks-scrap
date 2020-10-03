const {GoogleSpreadsheet} = require('google-spreadsheet');
const spreadSheetDef = require('./spreadSheetDefinition');
const LAST_COLUMN = 'AZ'
const setHeader = async (sheet) => {
    const headers = Object.keys(spreadSheetDef);
    const values = Object.values(spreadSheetDef);
    await sheet.setHeaderRow(headers);
    await sheet.loadCells(`A1:${LAST_COLUMN}1`); // loads a range of cells

    values.forEach((field, index) => {
        if (field.description) {
            const cell = sheet.getCell(0, index);
            cell.note = field.description
        }
    })
}

const setValues = async (sheet, stock, rows ) => {
    const values = Object.values(stock)
    const stockRow = rows.find(row => row.symbol === stock.symbol.value);
    const  rowIndex = stockRow ? stockRow.rowNumber : rows.length + 2;
    await sheet.loadCells(`A${rowIndex}:${LAST_COLUMN}${rowIndex}`);
    values.forEach((field, index) => {
        const cell = sheet.getCell(rowIndex -1, index);
        if (field.formula) {
            cell.formula = field.formula(values[0].value)
        } else {
            cell.value = field.value || 'N/A'
        }
        field.format && field.format(cell);
    })
}

const modifySpreadsheet = async (stocks, {sheet, rows}) => {
    await Promise.all(stocks.map(stock => setValues(sheet, stock, rows)))
    await sheet.saveUpdatedCells();
}

const initializeSpreadSheet = async () => {
    const doc = new GoogleSpreadsheet(process.env.spreadsheet_id);
    await doc.useServiceAccountAuth({
        client_email: process.env.client_email,
        private_key: process.env.private_key.replace(/\\n/gm, '\n'),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.resize({rowCount: 30, columnCount: 50})
    await setHeader(sheet);
    const rows = await sheet.getRows();

    return { sheet, rows }

}
module.exports = {modifySpreadsheet, initializeSpreadSheet}