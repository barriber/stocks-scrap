const  StockScrap = require("./modules/stockScrap");
const Spreadsheet = require("./modules/Spreadsheet");

const stockAnalysisController = async (req)  => {
    const {stock, spreadsheetId = '16ck3M8DDlrUCGJZ5kOY9VSVQ-YiIXSCXzo2CVT97G4Y', ...custom} = req.body
    const stockScrap = new StockScrap(stock);
    const spreadSheet = new Spreadsheet();
    const [stocksData] = await Promise.all([stockScrap.getStockData(custom),
        spreadSheet.initializeSpreadSheet(spreadsheetId)])
    await spreadSheet.modifySpreadsheet(stocksData);
}

module.exports = {
    stockAnalysisController
}
