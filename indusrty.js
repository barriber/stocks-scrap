const cheerio = require('cheerio');
const puppeteer = require('puppeteer');


const industryUrl = 'https://www.iclub.com/investing/stock_watch_list_industry.asp'

const getValue = (column, $) => {
    return $(column).text().trim();
}
const industryScrap = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(industryUrl)
    const [,industryFrame] = await page.frames();
    const content =  await industryFrame.content();
    const $ = cheerio.load(content);
    const rows =  $('tr')
    const result = {};
    rows.each((index,row) => {

        if(index > 3) {
            const columns  = $(row).children();
            const industry = getValue(columns[1], $)
            if(result[industry]) {
                debugger;
            }

            result[industry] = {
                sector: getValue(columns[0], $),
                roe:  parseFloat(getValue(columns[3], $)),
                'debt/equity': parseFloat(getValue(columns[4], $)),
                'revenue growth (5y)':parseFloat(getValue(columns[5], $)),
                'eps growth (5y)':parseFloat(getValue(columns[6], $)),
                'pe':parseFloat(getValue(columns[7], $)),
            }

        }
    })

    console.log(result)
}


module.exports = {
    industryScrap
}