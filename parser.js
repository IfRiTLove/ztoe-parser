const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function parse() {
    try {
        const { data } = await axios.get('https://www.ztoe.com.ua/unhooking-search.php', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        
        const $ = cheerio.load(data);
        let schedule = [];

        $('table tr').each((i, row) => {
            const rowHtml = $(row).html();
            
            if (rowHtml.includes('>2.2<')) {
                const cells = $(row).find('td');
                
                cells.each((j, cell) => {
                    // Отримуємо ПОВНИЙ HTML код комірки (разом з тегами)
                    const cellHtml = $.html(cell).toLowerCase();
                    const style = ($(cell).attr('style') || '').toLowerCase();
                    
                    // Ігноруємо назву черги та порожні відступи
                    if (!style.includes('width:30pt') && !style.includes('width:3pt')) {
                        
                        // ПЕРЕВІРКА: Шукаємо колір ff3333 будь-де в коді комірки
                        const isOff = cellHtml.includes('#ff3333') || 
                                      cellHtml.includes('ff3333') || 
                                      style.includes('red') ||
                                      cellHtml.includes('255,51,51');

                        // Додаємо в масив, якщо це комірка з даними
                        if (cellHtml.includes('background') || cellHtml.includes('bgcolor')) {
                            schedule.push(isOff ? 1 : 0);
                        }
                    }
                });
            }
        });

        if (schedule.length < 48) {
            throw new Error(`Знайдено лише ${schedule.length} сегментів.`);
        }

        const result = {
            lastUpdate: new Date().toISOString(),
            schedule: schedule.slice(0, 48)
        };

        fs.writeFileSync('data.json', JSON.stringify(result));
        console.log("Успішно оновлено! Одиниць у масиві:", result.schedule.filter(x => x === 1).length);

    } catch (e) {
        console.error("Помилка:", e.message);
        process.exit(1);
    }
}
parse();
