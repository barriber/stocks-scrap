const {GoogleSpreadsheet} = require('google-spreadsheet');

const setHeader = async (sheet, headers, values) => {
    await sheet.setHeaderRow(headers);
    await sheet.loadCells('A1:Z1'); // loads a range of cells
    values.forEach((field, index) => {
        if (field.description) {
            const cell = sheet.getCell(0, index);
            cell.note = field.description
        }
    })
}

const setValues = async (sheet, values) => {
    await sheet.loadCells('A2:Z2');
    values.forEach((field, index) => {
        const cell = sheet.getCell(1, index);
        cell.value = field.value || 'N/A'
    })

}

const modifySpreadsheet = async (stock) => {
    const doc = new GoogleSpreadsheet(process.env.spreadsheet_id);
    await doc.useServiceAccountAuth({
        client_email: process.env.client_email,
        private_key: process.env.private_key.replace(/\\n/gm, '\n'),
    });
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    const values = Object.values(stock)
    const keys = Object.keys(stock)
    await setHeader(sheet, keys, values);
    await setValues(sheet, values)
    await sheet.saveUpdatedCells();
}


module.exports = modifySpreadsheet