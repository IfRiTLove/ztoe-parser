const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function parse() {
    try {
        const { data } = await axios.get('https://www.ztoe.com.ua/unhooking-search.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        let schedule = [];

        $('table tr').each((i, row) => {
            const rowHtml = $(row).html();
            
            // Шукаємо рядок, де є текст 2.2
            if (rowHtml.includes('>2.2<')) {
                console.log("Рядок 2.2 знайдено!");
                const cells = $(row).find('td');
                
                cells.each((j, cell) => {
                    const style = $(cell).attr('style') || '';
                    // Пропускаємо комірку з назвою "2.2" та порожню комірку (3pt)
                    if (!style.includes('width:30pt') && !style.includes('width:3pt')) {
                        // Перевірка на червоний колір
                        const isOff = style.includes('#ff3333') || 
                                      style.includes('red') || 
                                      style.includes('255, 51, 51');
                        
                        // Додаємо тільки якщо це комірка з даними (вони мають background)
                        if (style.includes('background:')) {
                            schedule.push(isOff ? 1 : 0);
                        }
                    }
                });
            }
        });

        // Має бути 48 півгодинних інтервалів
        if (schedule.length < 48) {
            console.error(`Помилка: Знайдено лише ${schedule.length} сегментів замість 48`);
            process.exit(1);
        }

        // Якщо раптом знайшло більше (наприклад, 49), обрізаємо до 48
        if (schedule.length > 48) schedule = schedule.slice(0, 48);

        const result = {
            lastUpdate: new Date().toISOString(),
            schedule: schedule
        };

        fs.writeFileSync('data.json', JSON.stringify(result));
        console.log("Успіх! data.json оновлено одиницями та нулями.");
    } catch (e) {
        console.error("Помилка:", e.message);
        process.exit(1);
    }
}
parse();
