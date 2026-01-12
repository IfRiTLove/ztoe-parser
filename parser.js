const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function parse() {
  try {
    const { data } = await axios.get('https://www.ztoe.com.ua/unhooking-search.php');
    const $ = cheerio.load(data);
    let schedule = [];

    $('table tr').each((i, row) => {
      const cells = $(row).find('td');
      if ($(cells[0]).text().trim() === '2' && $(cells[1]).text().trim() === '2.2') {
        cells.each((j, cell) => {
          if (j > 1) {
            const style = $(cell).attr('style') || '';
            schedule.push(style.includes('red') ? 1 : 0);
          }
        });
      }
    });

    const result = {
      lastUpdate: new Date().toISOString(),
      schedule: schedule
    };

    fs.writeFileSync('data.json', JSON.stringify(result));
  } catch (e) { console.error(e); process.exit(1); }
}
parse();