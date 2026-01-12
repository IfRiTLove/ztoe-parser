const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function parse() {
    try {
        // Додаємо повний заголовок, щоб сайт не відхиляв запит
        const { data } = await axios.get('https://www.ztoe.com.ua/unhooking-search.php', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            }
        });
        
        const $ = cheerio.load(data);
        let schedule = [];

        $('table tr').each((i, row) => {
            const rowHtml = $(row).html();
            
            // Шукаємо рядок нашої підчерги
            if (rowHtml.includes('>2.2<')) {
                console.log("Знайдено рядок для черги 2.2!");
                const cells = $(row).find('td');
                
                cells.each((j, cell) => {
                    // Отримуємо стиль, переводимо в нижній регістр і видаляємо ВСІ пробіли
                    const style = ($(cell).attr('style') || '').toLowerCase().replace(/\s/g, '');
                    
                    // Пропускаємо технічні колонки
                    if (!style.includes('width:30pt') && !style.includes('width:3pt')) {
                        
                        // Якщо це комірка графіка (має фон)
                        if (style.includes('background:')) {
                            // Перевірка на червоний колір (#ff3333)
                            const isOff = style.includes('#ff3333') || 
                                          style.includes('red') || 
                                          style.includes('255,51,51');
                            
                            schedule.push(isOff ? 1 : 0);
                        }
                    }
                });
            }
        });

        // Має бути рівно 48 значень (24 години по 2 слоти)
        if (schedule.length < 48) {
            throw new Error(`Знайдено лише ${schedule.length} сегментів. Перевір структуру сайту.`);
        }

        // На випадок зайвих комірок
        const finalSchedule = schedule.slice(0, 48);

        const result = {
            lastUpdate: new Date().toISOString(),
            schedule: finalSchedule
        };

        fs.writeFileSync('data.json', JSON.stringify(result));
        console.log("Успіх! Файл data.json оновлено актуальними даними.");

    } catch (e) {
        console.error("Помилка парсингу:", e.message);
        process.exit(1);
    }
}

parse();
