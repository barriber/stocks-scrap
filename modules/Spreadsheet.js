const {GoogleSpreadsheet} = require('google-spreadsheet');
const _ = require('lodash');
const spreadSheetDef = require('../spreadSheetDefinition');
const {deepClone} = require("../utils");
const LAST_COLUMN = 'AZ';

let cachedSheet;

class Spreadsheet {
    async initializeSpreadSheet(spreadsheetId) {
        if(!cachedSheet) {
            const doc = new GoogleSpreadsheet(spreadsheetId);
            await doc.useServiceAccountAuth({
                client_email: process.env.client_email,
                private_key: process.env.private_key.replace(/\\n/gm, '\n'),
            });
            console.log('SPREADSHEET AUTH SUCCESS')
            await doc.loadInfo();
            this.sheet = doc.sheetsByTitle['Watchlist'];
            await this.sheet.getRows();
            if (!this.sheet) {
                this.sheet = await doc.addSheet({title: 'Watchlist'})
            }
            cachedSheet = this.sheet;
        } else {
            this.sheet = cachedSheet;
        }
        if (this.sheet.gridProperties.columnCount < 50) {
            await this.sheet.resize({rowCount: 100, columnCount: 50})
        }
        const headers = _.map(spreadSheetDef, (obj, key) => {
            return obj.title ? obj.title : _.startCase(key);
        });

        const headersToUpdate = _.differenceBy(headers, this.sheet.headerValues, _.toLower);
        if (headersToUpdate.length > 0) {
            await this.setHeader(headersToUpdate);
        }
    }

    async modifySpreadsheet(stock) {
        console.log('start - modify spreadsheet')
        const rows = await this.sheet.getRows();
        const stockDefinition = deepClone(spreadSheetDef);
        Object.entries(stockDefinition).forEach(([key, value]) => {
            if (stock[key]) {
                stockDefinition[key].value = stock[key];
            }
        });
        const stockRow = rows.find(row => row.symbol.toLowerCase() === stockDefinition.symbol.value.toLowerCase());
        const rowIndex = stockRow ? stockRow.rowNumber : rows.length + 2;
        await this.setValues(stockDefinition, rowIndex, stock)
        this.sheet.saveUpdatedCells();
    }

    async setHeader(difference) {
        const newHeader = [...this.sheet.headerValues, ...difference];
        await this.sheet.setHeaderRow(newHeader);
        await this.sheet.loadCells(`A1:${LAST_COLUMN}1`); // loads a range of cells
        difference.forEach((field) => {
            const index = newHeader.findIndex((header) => header === field);
            const colDef = _.find(spreadSheetDef, (val, key) => {
                return key === field || val.title?.toLowerCase() === field.toLowerCase()
            })
            if (colDef.description && typeof field.description !== "function") {
                const cell = this.sheet.getCell(0, index);
                cell.note = colDef.description
            }
        })
    }

    async setValues(stock, rowIndex, stockData) {
        await this.sheet.loadCells(`A${rowIndex}:${LAST_COLUMN}${rowIndex}`);
        _.forEach(stock, async (field, key) => {
            const title = field.title ? field.title : _.startCase(key)
            const headerIndex = this.sheet.headerValues.findIndex(val => val.toLowerCase() === title.toLowerCase());
            if (headerIndex > -1) {
                const cell = this.sheet.getCell(rowIndex - 1, headerIndex);
                if (field.formula) {
                    cell.formula = field.formula(stock.symbol.value, stockData)
                } else if (field.value) {
                    cell.value = field.value;
                }

                if (field.valueNote) {
                    cell.note = field.valueNote(stockData)
                }

                field.format && field.format(cell, field.value, stockData);
            } else {
                console.warn('MISSING COLUMN', title);
            }
        })
    }
}

module.exports = Spreadsheet
