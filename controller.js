const  StockScrap = require("./modules/stockScrap");
const {initializeSpreadSheet, modifySpreadsheet} = require("./spreadsheet");

const stockAnalysisController = async (req)  => {
    const {stock, spreadsheetId = '16ck3M8DDlrUCGJZ5kOY9VSVQ-YiIXSCXzo2CVT97G4Y', ...custom} = req.body
    const stockScrap = new StockScrap(stock)
    const [sheetInit, ...stocksData] = await Promise.all([initializeSpreadSheet(spreadsheetId), stockScrap.getStockData(stock, custom)])
    await modifySpreadsheet(stocksData[0], sheetInit);
}

module.exports = {
    stockAnalysisController
}
