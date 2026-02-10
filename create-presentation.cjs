const pptxgen = require("pptxgenjs");

// Создаём презентацию
let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = 'EntryPoint — Агрегатор IT-стажировок';
pres.author = 'EntryPoint Team';

// Цветовая палитра (Teal Trust)
const COLORS = {
    primary: "0A1628",      // Тёмный фон
    secondary: "0F2847",    // Светлее
    accent: "10B981",       // Зелёный акцент
    accentLight: "34D399",  // Светло-зелёный
    text: "FFFFFF",         // Белый текст
    muted: "94A3B8",        // Серый текст
    cardBg: "1E3A5F",       // Фон карточек
    success: "22C55E"       // Зелёный успех
};

// Хелпер для тени (создаём каждый раз новый объект)
const makeShadow = () => ({
    type: "outer", blur: 8, offset: 4, angle: 135, color: "000000", opacity: 0.25
});

// ========== СЛАЙД 1: Титульный ==========
let slide1 = pres.addSlide();
slide1.background = { color: COLORS.primary };

// Градиентный акцент (верхний угол)
slide1.addShape(pres.shapes.OVAL, {
    x: -2, y: -2, w: 6, h: 6,
    fill: { color: COLORS.accent, transparency: 85 }
});
slide1.addShape(pres.shapes.OVAL, {
    x: 7, y: 3, w: 5, h: 5,
    fill: { color: COLORS.accentLight, transparency: 90 }
});

// Название
slide1.addText("EntryPoint", {
    x: 0.5, y: 1.8, w: 9, h: 1.2,
    fontSize: 60, fontFace: "Arial Black", color: COLORS.accent,
    bold: true, align: "center"
});

// Подзаголовок
slide1.addText("Агрегатор IT-стажировок для студентов", {
    x: 0.5, y: 3.0, w: 9, h: 0.6,
    fontSize: 24, fontFace: "Arial", color: COLORS.muted, align: "center"
});

// Разделитель
slide1.addShape(pres.shapes.RECTANGLE, {
    x: 3.5, y: 3.8, w: 3, h: 0.03,
    fill: { color: COLORS.accent }
});

// Подпись
slide1.addText("Агрегатор IT-стажировок для студентов", {
    x: 0.5, y: 4.1, w: 9, h: 0.8,
    fontSize: 14, fontFace: "Arial", color: COLORS.muted, align: "center"
});

// ========== СЛАЙД 2: Миссия ==========
let slide2 = pres.addSlide();
slide2.background = { color: COLORS.primary };

slide2.addText("Наша миссия", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.text, bold: true
});

// Цитата-блок
slide2.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 1.4, w: 8.4, h: 1.8,
    fill: { color: COLORS.cardBg }, shadow: makeShadow()
});
slide2.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 1.4, w: 0.08, h: 1.8,
    fill: { color: COLORS.accent }
});
slide2.addText("«Мы агрегируем IT-стажировки для студентов,\nчтобы они быстрее находили первую работу»", {
    x: 1.1, y: 1.6, w: 7.9, h: 1.4,
    fontSize: 22, fontFace: "Georgia", color: COLORS.text, italic: true, align: "center", valign: "middle"
});

// We do X for Y
slide2.addText([
    { text: "We do ", options: { color: COLORS.muted } },
    { text: "aggregation of IT internships", options: { color: COLORS.accent, bold: true } },
    { text: "\nfor ", options: { color: COLORS.muted, breakLine: false } },
    { text: "students of top Russian universities", options: { color: COLORS.accent, bold: true } },
    { text: "\nso they could ", options: { color: COLORS.muted, breakLine: false } },
    { text: "find their first job in 2 clicks", options: { color: COLORS.accent, bold: true } }
], { x: 1.5, y: 3.5, w: 7, h: 1.2, fontSize: 18, fontFace: "Arial", align: "center" });

// Статистика
slide2.addShape(pres.shapes.RECTANGLE, {
    x: 3.5, y: 4.8, w: 3, h: 0.7,
    fill: { color: COLORS.accent, transparency: 15 },
    line: { color: COLORS.accent, width: 1 }
});
slide2.addText("< 2 мин", {
    x: 3.5, y: 4.75, w: 3, h: 0.45,
    fontSize: 28, fontFace: "Arial Black", color: COLORS.accent, align: "center", bold: true
});
slide2.addText("от входа до отклика", {
    x: 3.5, y: 5.15, w: 3, h: 0.3,
    fontSize: 10, fontFace: "Arial", color: COLORS.muted, align: "center"
});

// ========== СЛАЙД 3: Проблема ==========
let slide3 = pres.addSlide();
slide3.background = { color: COLORS.primary };

slide3.addText("Проблема", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.accent, bold: true
});
slide3.addText("Боль студента при поиске стажировки", {
    x: 0.5, y: 1.0, w: 9, h: 0.5,
    fontSize: 20, fontFace: "Arial", color: COLORS.muted
});

// Карточка 1
slide3.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.7, w: 4.3, h: 2.0, fill: { color: COLORS.cardBg }, shadow: makeShadow()
});
slide3.addText("❌  Разрозненная информация", {
    x: 0.7, y: 1.85, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: COLORS.text, bold: true
});
slide3.addText([
    { text: "hh.ru, LinkedIn, Telegram, сайты компаний", options: { bullet: true, breakLine: true } },
    { text: "Нет единой точки входа", options: { bullet: true, breakLine: true } },
    { text: "Мониторинг 10+ источников", options: { bullet: true } }
], { x: 0.7, y: 2.3, w: 4, h: 1.3, fontSize: 13, fontFace: "Arial", color: COLORS.muted });

// Карточка 2
slide3.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.7, w: 4.3, h: 2.0, fill: { color: COLORS.cardBg }, shadow: makeShadow()
});
slide3.addText("❌  Нет персонализации", {
    x: 5.4, y: 1.85, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: COLORS.text, bold: true
});
slide3.addText([
    { text: "Нельзя фильтровать по курсу, GPA", options: { bullet: true, breakLine: true } },
    { text: "Ручная проверка требований", options: { bullet: true, breakLine: true } },
    { text: "Время на неподходящие вакансии", options: { bullet: true } }
], { x: 5.4, y: 2.3, w: 4, h: 1.3, fontSize: 13, fontFace: "Arial", color: COLORS.muted });

// Статистика внизу
slide3.addShape(pres.shapes.RECTANGLE, {
    x: 2.5, y: 4.2, w: 5, h: 1.0,
    fill: { color: COLORS.accent, transparency: 15 },
    line: { color: COLORS.accent, width: 1 }
});
slide3.addText("73%", {
    x: 2.5, y: 4.2, w: 5, h: 0.6,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.accent, align: "center", bold: true
});
slide3.addText("студентов тратят >10 часов в неделю на поиск", {
    x: 2.5, y: 4.75, w: 5, h: 0.4,
    fontSize: 11, fontFace: "Arial", color: COLORS.muted, align: "center"
});

// ========== СЛАЙД 4: Решение ==========
let slide4 = pres.addSlide();
slide4.background = { color: COLORS.primary };

slide4.addText("Решение", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.accent, bold: true
});
slide4.addText("EntryPoint — единая точка входа", {
    x: 0.5, y: 1.0, w: 9, h: 0.5,
    fontSize: 20, fontFace: "Arial", color: COLORS.muted
});

// Карточка 1: Умные фильтры
slide4.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.7, w: 4.3, h: 2.3, fill: { color: COLORS.cardBg }, shadow: makeShadow()
});
slide4.addText("✅  Умные фильтры", {
    x: 0.7, y: 1.85, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: COLORS.success, bold: true
});
slide4.addText([
    { text: "Backend, Frontend, ML, DevOps, Mobile", options: { bullet: true, breakLine: true } },
    { text: "Город, формат, стек технологий", options: { bullet: true, breakLine: true } },
    { text: "Курс обучения и GPA", options: { bullet: true } }
], { x: 0.7, y: 2.35, w: 4, h: 1.5, fontSize: 13, fontFace: "Arial", color: COLORS.muted });

// Карточка 2: Мгновенный отклик
slide4.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.7, w: 4.3, h: 2.3, fill: { color: COLORS.cardBg }, shadow: makeShadow()
});
slide4.addText("✅  Мгновенный отклик", {
    x: 5.4, y: 1.85, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: COLORS.success, bold: true
});
slide4.addText([
    { text: "Кнопка → Telegram или Email", options: { bullet: true, breakLine: true } },
    { text: "Без регистрации и форм", options: { bullet: true, breakLine: true } },
    { text: "Прямая связь с HR", options: { bullet: true } }
], { x: 5.4, y: 2.35, w: 4, h: 1.5, fontSize: 13, fontFace: "Arial", color: COLORS.muted });

// Теги стека
slide4.addText("TypeScript    •    Vite    •    Vanilla CSS    •    Glassmorphism", {
    x: 0.5, y: 4.3, w: 9, h: 0.4,
    fontSize: 14, fontFace: "Consolas", color: COLORS.accent, align: "center"
});

// ========== СЛАЙД 5: Как работает ==========
let slide5 = pres.addSlide();
slide5.background = { color: COLORS.primary };

slide5.addText("Как это работает", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.text, bold: true
});

// Flow шаги
const steps = [
    { icon: "🌐", text: "Заходит\nна сайт" },
    { icon: "📋", text: "Видит\nсписок" },
    { icon: "🔍", text: "Применяет\nфильтры" },
    { icon: "📄", text: "Открывает\nкарточку" },
    { icon: "📖", text: "Читает\nдетали" },
    { icon: "✉️", text: "Откликается" }
];

let stepX = 0.3;
for (let i = 0; i < steps.length; i++) {
    slide5.addShape(pres.shapes.RECTANGLE, {
        x: stepX, y: 1.5, w: 1.4, h: 1.4,
        fill: { color: COLORS.cardBg }, shadow: makeShadow()
    });
    slide5.addText(steps[i].icon, {
        x: stepX, y: 1.55, w: 1.4, h: 0.5,
        fontSize: 24, align: "center"
    });
    slide5.addText(steps[i].text, {
        x: stepX, y: 2.05, w: 1.4, h: 0.8,
        fontSize: 10, fontFace: "Arial", color: COLORS.muted, align: "center", valign: "top"
    });

    // Стрелка между шагами
    if (i < steps.length - 1) {
        slide5.addText("→", {
            x: stepX + 1.4, y: 1.9, w: 0.25, h: 0.4,
            fontSize: 18, color: COLORS.accent, align: "center"
        });
    }
    stepX += 1.65;
}

// Метрики
const metrics = [
    { num: "30+", label: "Вакансий" },
    { num: "7", label: "Направлений" },
    { num: "20+", label: "ВУЗов" }
];
let metricX = 2;
for (let m of metrics) {
    slide5.addShape(pres.shapes.RECTANGLE, {
        x: metricX, y: 3.5, w: 2, h: 1.2,
        fill: { color: COLORS.accent, transparency: 85 },
        line: { color: COLORS.accent, width: 1 }
    });
    slide5.addText(m.num, {
        x: metricX, y: 3.55, w: 2, h: 0.7,
        fontSize: 32, fontFace: "Arial Black", color: COLORS.accent, align: "center", bold: true
    });
    slide5.addText(m.label, {
        x: metricX, y: 4.2, w: 2, h: 0.4,
        fontSize: 12, fontFace: "Arial", color: COLORS.muted, align: "center"
    });
    metricX += 2.1;
}

// ========== СЛАЙД 6: Рынок ==========
let slide6 = pres.addSlide();
slide6.background = { color: COLORS.primary };

slide6.addText("Рынок", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.accent, bold: true
});

// Таблица TAM/SAM/SOM
slide6.addTable([
    [
        { text: "Показатель", options: { fill: { color: COLORS.accent }, color: COLORS.primary, bold: true, align: "center" } },
        { text: "Объём", options: { fill: { color: COLORS.accent }, color: COLORS.primary, bold: true, align: "center" } },
        { text: "Описание", options: { fill: { color: COLORS.accent }, color: COLORS.primary, bold: true, align: "center" } }
    ],
    [
        { text: "TAM", options: { bold: true, color: COLORS.text } },
        { text: "1.2 млн", options: { color: COLORS.accent, bold: true } },
        { text: "Студенты IT-специальностей в России", options: { color: COLORS.muted } }
    ],
    [
        { text: "SAM", options: { bold: true, color: COLORS.text } },
        { text: "300 тыс.", options: { color: COLORS.accent, bold: true } },
        { text: "Студенты топ-20 вузов, ищущие стажировку", options: { color: COLORS.muted } }
    ],
    [
        { text: "SOM", options: { bold: true, color: COLORS.text } },
        { text: "15 тыс.", options: { color: COLORS.accent, bold: true } },
        { text: "Целевые пользователи в первый год (5% SAM)", options: { color: COLORS.muted } }
    ]
], {
    x: 0.5, y: 1.3, w: 9, h: 2,
    fontFace: "Arial", fontSize: 13,
    border: { pt: 0.5, color: COLORS.cardBg },
    fill: { color: COLORS.cardBg }
});

// Динамика
slide6.addText([
    { text: "📈  Рынок IT-стажировок растёт на ", options: { color: COLORS.muted } },
    { text: "25% в год", options: { color: COLORS.accent, bold: true } }
], { x: 0.5, y: 3.8, w: 9, h: 0.4, fontSize: 16, fontFace: "Arial" });

slide6.addText([
    { text: "📱  Компании всё активнее нанимают через ", options: { color: COLORS.muted } },
    { text: "Telegram", options: { color: COLORS.accent, bold: true } }
], { x: 0.5, y: 4.3, w: 9, h: 0.4, fontSize: 16, fontFace: "Arial" });

// ========== СЛАЙД 7: Конкуренты ==========
let slide7 = pres.addSlide();
slide7.background = { color: COLORS.primary };

slide7.addText("Конкуренты", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.text, bold: true
});

// Таблица сравнения
slide7.addTable([
    [
        { text: "Критерий", options: { fill: { color: COLORS.secondary }, color: COLORS.text, bold: true } },
        { text: "hh.ru", options: { fill: { color: COLORS.secondary }, color: COLORS.text, bold: true, align: "center" } },
        { text: "LinkedIn", options: { fill: { color: COLORS.secondary }, color: COLORS.text, bold: true, align: "center" } },
        { text: "Telegram", options: { fill: { color: COLORS.secondary }, color: COLORS.text, bold: true, align: "center" } },
        { text: "EntryPoint", options: { fill: { color: COLORS.accent }, color: COLORS.primary, bold: true, align: "center" } }
    ],
    [
        { text: "Фокус на стажировках", options: { color: COLORS.muted } },
        { text: "❌", options: { align: "center", color: "FF6B6B" } },
        { text: "❌", options: { align: "center", color: "FF6B6B" } },
        { text: "✅", options: { align: "center", color: COLORS.success } },
        { text: "✅", options: { align: "center", color: COLORS.success, bold: true } }
    ],
    [
        { text: "Фильтр по курсу/GPA", options: { color: COLORS.muted } },
        { text: "❌", options: { align: "center", color: "FF6B6B" } },
        { text: "❌", options: { align: "center", color: "FF6B6B" } },
        { text: "❌", options: { align: "center", color: "FF6B6B" } },
        { text: "✅", options: { align: "center", color: COLORS.success, bold: true } }
    ],
    [
        { text: "Мгновенный отклик", options: { color: COLORS.muted } },
        { text: "❌", options: { align: "center", color: "FF6B6B" } },
        { text: "❌", options: { align: "center", color: "FF6B6B" } },
        { text: "✅", options: { align: "center", color: COLORS.success } },
        { text: "✅", options: { align: "center", color: COLORS.success, bold: true } }
    ],
    [
        { text: "Структурированные данные", options: { color: COLORS.muted } },
        { text: "✅", options: { align: "center", color: COLORS.success } },
        { text: "✅", options: { align: "center", color: COLORS.success } },
        { text: "❌", options: { align: "center", color: "FF6B6B" } },
        { text: "✅", options: { align: "center", color: COLORS.success, bold: true } }
    ]
], {
    x: 0.5, y: 1.2, w: 9, h: 2.8,
    fontFace: "Arial", fontSize: 13,
    border: { pt: 0.5, color: COLORS.cardBg },
    fill: { color: COLORS.cardBg }
});

// Преимущество
slide7.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 4.3, w: 9, h: 0.8,
    fill: { color: COLORS.accent, transparency: 85 },
    line: { color: COLORS.accent, width: 1 }
});
slide7.addText("🏆  Наше преимущество: Единственный сервис с персонализацией под профиль студента", {
    x: 0.5, y: 4.4, w: 9, h: 0.6,
    fontSize: 15, fontFace: "Arial", color: COLORS.text, align: "center", valign: "middle"
});

// ========== СЛАЙД 8: Бизнес-модель ==========
let slide8 = pres.addSlide();
slide8.background = { color: COLORS.primary };

slide8.addText("Бизнес-модель", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.accent, bold: true
});
slide8.addText("Freemium для студентов, подписка для компаний", {
    x: 0.5, y: 1.0, w: 9, h: 0.4,
    fontSize: 18, fontFace: "Arial", color: COLORS.muted
});

// Карточка: Бесплатно
slide8.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.6, w: 4.3, h: 2.4, fill: { color: COLORS.cardBg }, shadow: makeShadow()
});
slide8.addText("🎓  Бесплатно для студентов", {
    x: 0.7, y: 1.75, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: COLORS.success, bold: true
});
slide8.addText([
    { text: "Поиск и фильтрация", options: { bullet: true, breakLine: true } },
    { text: "Отклик на вакансии", options: { bullet: true, breakLine: true } },
    { text: "Шеринг ссылок", options: { bullet: true, breakLine: true } },
    { text: "Создание профиля", options: { bullet: true } }
], { x: 0.7, y: 2.2, w: 4, h: 1.6, fontSize: 13, fontFace: "Arial", color: COLORS.muted });

// Карточка: Платно
slide8.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.6, w: 4.3, h: 2.4, fill: { color: COLORS.cardBg }, shadow: makeShadow()
});
slide8.addText("💼  Платно для компаний", {
    x: 5.4, y: 1.75, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: COLORS.accent, bold: true
});
slide8.addText([
    { text: "Размещение — от 5 000 ₽/мес", options: { bullet: true, breakLine: true } },
    { text: "Приоритет — от 15 000 ₽/мес", options: { bullet: true, breakLine: true } },
    { text: "Бренд-страница — от 30 000 ₽/мес", options: { bullet: true } }
], { x: 5.4, y: 2.2, w: 4, h: 1.6, fontSize: 13, fontFace: "Arial", color: COLORS.muted });

// Прогноз
slide8.addShape(pres.shapes.RECTANGLE, {
    x: 2.5, y: 4.3, w: 5, h: 1.0,
    fill: { color: COLORS.accent, transparency: 15 },
    line: { color: COLORS.accent, width: 1 }
});
slide8.addText("500 000 ₽/мес", {
    x: 2.5, y: 4.3, w: 5, h: 0.6,
    fontSize: 32, fontFace: "Arial Black", color: COLORS.accent, align: "center", bold: true
});
slide8.addText("Прогноз через 1 год (50 компаний × 10 000 ₽)", {
    x: 2.5, y: 4.85, w: 5, h: 0.4,
    fontSize: 11, fontFace: "Arial", color: COLORS.muted, align: "center"
});

// ========== СЛАЙД 9: О проекте ==========
let slide9 = pres.addSlide();
slide9.background = { color: COLORS.primary };

slide9.addText("О проекте", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.text, bold: true
});

// Карточки ролей
const roles = [
    { title: "Frontend & UI/UX", desc: "Дизайн интерфейса, компоненты, адаптивность" },
    { title: "Дизайн & Документация", desc: "UX-исследование, спецификации, визуал" },
    { title: "Backend & Данные", desc: "Модели данных, справочники, логика фильтрации" },
    { title: "Интеграция & Тестирование", desc: "Сборка, деплой, QA" }
];

let cardX = 0.5;
let cardY = 1.3;
for (let i = 0; i < roles.length; i++) {
    if (i === 2) { cardX = 0.5; cardY = 3.0; }

    slide9.addShape(pres.shapes.RECTANGLE, {
        x: cardX, y: cardY, w: 4.3, h: 1.5, fill: { color: COLORS.cardBg }, shadow: makeShadow()
    });
    slide9.addText(roles[i].title, {
        x: cardX + 0.2, y: cardY + 0.15, w: 3.9, h: 0.4,
        fontSize: 16, fontFace: "Arial", color: COLORS.text, bold: true
    });
    slide9.addText(roles[i].desc, {
        x: cardX + 0.2, y: cardY + 0.55, w: 3.9, h: 0.7,
        fontSize: 13, fontFace: "Arial", color: COLORS.accent
    });

    cardX += 4.7;
}

// Формат работы
slide9.addText("👥  Формат работы: Agile-спринт, ежедневные синки, ретроспектива", {
    x: 0.5, y: 4.8, w: 9, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: COLORS.muted, align: "center"
});

// ========== СЛАЙД 10: Процесс работы ==========
let slide10 = pres.addSlide();
slide10.background = { color: COLORS.primary };

slide10.addText("Процесс работы", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.accent, bold: true
});

// Этапы спринта
slide10.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.2, w: 4.3, h: 2.8, fill: { color: COLORS.cardBg }, shadow: makeShadow()
});
slide10.addText("📅  Этапы спринта", {
    x: 0.7, y: 1.35, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: COLORS.text, bold: true
});
slide10.addText([
    { text: "День 1-2: Планирование, задачи", options: { bullet: true, breakLine: true } },
    { text: "День 3-5: Разработка MVP", options: { bullet: true, breakLine: true } },
    { text: "День 6: Интеграция, тесты", options: { bullet: true, breakLine: true } },
    { text: "День 7: Ретроспектива", options: { bullet: true } }
], { x: 0.7, y: 1.8, w: 4, h: 2, fontSize: 13, fontFace: "Arial", color: COLORS.muted });

// Модель Такмена
slide10.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.2, w: 4.3, h: 2.8, fill: { color: COLORS.cardBg }, shadow: makeShadow()
});
slide10.addText("🧠  Модель Такмена", {
    x: 5.4, y: 1.35, w: 4, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: COLORS.text, bold: true
});
slide10.addText([
    { text: "Forming: Обсуждение идей", options: { bullet: true, breakLine: true } },
    { text: "Storming: Спор о дизайне", options: { bullet: true, breakLine: true } },
    { text: "Norming: Glassmorphism-стиль", options: { bullet: true, breakLine: true } },
    { text: "Performing: Эффективная работа", options: { bullet: true } }
], { x: 5.4, y: 1.8, w: 4, h: 2, fontSize: 13, fontFace: "Arial", color: COLORS.muted });

// Матрица Сандала
slide10.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 4.3, w: 9, h: 0.8,
    fill: { color: COLORS.accent, transparency: 85 },
    line: { color: COLORS.accent, width: 1 }
});
slide10.addText("📊  Матрица Сандала: Высокая продуктивность + Высокая позитивность", {
    x: 0.5, y: 4.4, w: 9, h: 0.6,
    fontSize: 15, fontFace: "Arial", color: COLORS.text, align: "center", valign: "middle"
});

// ========== СЛАЙД 11: Технологии ==========
let slide11 = pres.addSlide();
slide11.background = { color: COLORS.primary };

slide11.addText("Технологии", {
    x: 0.5, y: 0.4, w: 9, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: COLORS.text, bold: true
});

// Таблица стека
slide11.addTable([
    [
        { text: "Компонент", options: { fill: { color: COLORS.accent }, color: COLORS.primary, bold: true } },
        { text: "Технология", options: { fill: { color: COLORS.accent }, color: COLORS.primary, bold: true } },
        { text: "Почему выбрали", options: { fill: { color: COLORS.accent }, color: COLORS.primary, bold: true } }
    ],
    [
        { text: "Язык", options: { color: COLORS.muted } },
        { text: "TypeScript", options: { color: COLORS.accent, bold: true } },
        { text: "Типизация, меньше багов", options: { color: COLORS.muted } }
    ],
    [
        { text: "Сборка", options: { color: COLORS.muted } },
        { text: "Vite", options: { color: COLORS.accent, bold: true } },
        { text: "Быстрый dev-сервер, HMR", options: { color: COLORS.muted } }
    ],
    [
        { text: "Стили", options: { color: COLORS.muted } },
        { text: "Vanilla CSS", options: { color: COLORS.accent, bold: true } },
        { text: "Glassmorphism без фреймворков", options: { color: COLORS.muted } }
    ],
    [
        { text: "Хранение", options: { color: COLORS.muted } },
        { text: "LocalStorage", options: { color: COLORS.accent, bold: true } },
        { text: "Простота для MVP", options: { color: COLORS.muted } }
    ],
    [
        { text: "Деплой", options: { color: COLORS.muted } },
        { text: "Vercel", options: { color: COLORS.accent, bold: true } },
        { text: "Бесплатный хостинг", options: { color: COLORS.muted } }
    ]
], {
    x: 0.5, y: 1.2, w: 9, h: 3,
    fontFace: "Arial", fontSize: 13,
    border: { pt: 0.5, color: COLORS.cardBg },
    fill: { color: COLORS.cardBg }
});

// Метрики
slide11.addText("📱  Адаптивность: Desktop + Mobile    |    🚀  Загрузка: < 1.5 сек", {
    x: 0.5, y: 4.5, w: 9, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: COLORS.muted, align: "center"
});

// ========== СЛАЙД 12: Call to Action ==========
let slide12 = pres.addSlide();
slide12.background = { color: COLORS.primary };

// Градиентные круги
slide12.addShape(pres.shapes.OVAL, {
    x: -2, y: 2, w: 5, h: 5,
    fill: { color: COLORS.accent, transparency: 88 }
});
slide12.addShape(pres.shapes.OVAL, {
    x: 8, y: -1, w: 4, h: 4,
    fill: { color: COLORS.accentLight, transparency: 92 }
});

// Название
slide12.addText("EntryPoint", {
    x: 0.5, y: 1.3, w: 9, h: 1,
    fontSize: 56, fontFace: "Arial Black", color: COLORS.accent,
    bold: true, align: "center"
});

slide12.addText("Найди стажировку за 2 клика", {
    x: 0.5, y: 2.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: "Arial", color: COLORS.muted, align: "center"
});

// CTA блок
slide12.addShape(pres.shapes.RECTANGLE, {
    x: 2.5, y: 3.0, w: 5, h: 1.2,
    fill: { color: COLORS.accent },
    shadow: makeShadow()
});
slide12.addText("🚀  Попробуй сейчас!", {
    x: 2.5, y: 3.1, w: 5, h: 0.5,
    fontSize: 20, fontFace: "Arial", color: COLORS.primary, bold: true, align: "center"
});
slide12.addText("entrypoint.vercel.app", {
    x: 2.5, y: 3.6, w: 5, h: 0.5,
    fontSize: 18, fontFace: "Consolas", color: COLORS.primary, align: "center"
});

// Спасибо
slide12.addText("Спасибо за внимание!", {
    x: 0.5, y: 4.5, w: 9, h: 0.4,
    fontSize: 18, fontFace: "Arial", color: COLORS.text, align: "center"
});

// Подпись
slide12.addText("EntryPoint Team", {
    x: 0.5, y: 5.0, w: 9, h: 0.3,
    fontSize: 11, fontFace: "Arial", color: COLORS.muted, align: "center"
});

// Сохраняем файл
pres.writeFile({ fileName: "EntryPoint_Presentation.pptx" })
    .then(() => console.log("✅ Презентация создана: EntryPoint_Presentation.pptx"))
    .catch(err => console.error("❌ Ошибка:", err));
