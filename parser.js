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
          if (j > 1) { // Пропускаємо перші дві колонки (черга)
            const style = $(cell).attr('style') || '';
            const text = $(cell).text().toLowerCase();

            // Перевірка на червоний колір:
            // 1. Шукаємо слово 'red'
            // 2. Шукаємо HEX-коди #ff3333, #ff0000 тощо
            // 3. Шукаємо RGB значення rgb(255, 51, 51)
            const isRed = style.includes('red') ||
              style.includes('#ff3333') ||
              style.includes('#ff0000') ||
              style.includes('255, 51, 51');

            schedule.push(isRed ? 1 : 0);
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