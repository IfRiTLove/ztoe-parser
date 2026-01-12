const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function parse() {
    try {
        // Додаємо User-Agent, щоб сайт не блокив запит
        const { data } = await axios.get('https://www.ztoe.com.ua/unhooking-search.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        let schedule = [];

        // Шукаємо всі рядки таблиці
        $('table tr').each((i, row) => {
            const cells = $(row).find('td');
            const col1 = $(cells[0]).text().trim();
            const col2 = $(cells[1]).text().trim();

            // Перевіряємо, чи це наш рядок (Черга 2, підчерга 2.2)
            if (col1 === '2' && col2 === '2.2') {
                cells.each((j, cell) => {
                    if (j > 1) { // Пропускаємо колонки з назвою черги
                        const style = $(cell).attr('style') || '';
                        
                        // Перевірка кольору: шукаємо hex, rgb або назву
                        const isOff = style.includes('#ff3333') || 
                                      style.includes('red') || 
                                      style.includes('255, 51, 51');
                        
                        schedule.push(isOff ? 1 : 0);
                    }
                });
            }
        });

        // Якщо масив все ще порожній - значить селектор не спрацював
        if (schedule.length === 0) {
            console.error("Помилка: Не вдалося знайти дані для черги 2.2");
            process.exit(1); 
        }

        const result = {
            lastUpdate: new Date().toISOString(),
            schedule: schedule
        };

        fs.writeFileSync('data.json', JSON.stringify(result));
        console.log("Дані успішно оновлено!");
    } catch (e) {
        console.error("Критична помилка:", e.message);
        process.exit(1);
    }
}
parse();
