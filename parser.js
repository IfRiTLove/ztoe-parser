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

        let foundRow = false;

        $('table tr').each((i, row) => {
            const rowHtml = $(row).html();

            // Шукаємо чергу 6.2 (виключаємо рядки з повідомленнями)
            if (rowHtml.includes('>6.2<') && rowHtml.includes('pidcherga_id') && !rowHtml.includes('<h3>') && !foundRow) {
                foundRow = true;
                const cells = $(row).find('td');

                cells.each((j, cell) => {
                    const style = ($(cell).attr('style') || '');

                    // Ігноруємо назву черги та порожні відступи
                    if (!style.includes('width:30pt') && !style.includes('width:3pt')) {
                        // Перевіряємо, чи є background колір в style атрибуті
                        const hasBackground = style.includes('background:');
                        const isOff = style.includes('#ff3333');

                        // Додаємо в масив тільки комірки з background
                        if (hasBackground) {
                            schedule.push(isOff ? 1 : 0);
                        }
                    }
                });
            }
        });

        console.log(`Знайдено ${schedule.length} сегментів`);

        // Беремо останні 48 сегментів, оскільки відключення знаходяться в кінці
        const finalSchedule = schedule.length >= 48 ? schedule.slice(-48) : schedule;

        const result = {
            lastUpdate: new Date().toISOString(),
            schedule: finalSchedule
        };

        fs.writeFileSync('data.json', JSON.stringify(result));
        console.log("Успішно оновлено! Одиниць у масиві:", result.schedule.filter(x => x === 1).length);

    } catch (e) {
        console.error("Помилка:", e.message);
        process.exit(1);
    }
}
parse();
