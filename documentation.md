# English Learning Tracker Pro - Подробная Документация

Эта документация предоставляет всесторонний обзор приложения "English Learning Tracker Pro", охватывая его структуру, функциональность и стили.

## 1. Общий Обзор Приложения

"English Learning Tracker Pro" - это интерактивное веб-приложение, разработанное для помощи пользователям в изучении английского языка. Оно предлагает различные инструменты для отслеживания прогресса, управления словарным запасом, планирования практики, ведения заметок, изучения грамматики и использования AI-инструментов. Приложение использует IndexedDB для локального хранения данных, обеспечивая автономную работу и сохранение пользовательских данных.

**Ключевые особенности:**
*   **Интуитивный интерфейс:** Боковая панель навигации для быстрого доступа к разделам.
*   **Персонализация:** Настройки темы (светлая/темная), акцентного цвета, целей обучения и уровня AI-помощи.
*   **Отслеживание прогресса:** Дашборд с графиками и статистикой.
*   **Управление словарным запасом:** Добавление, редактирование, фильтрация и поиск слов, а также генерация слов с помощью AI (Gemini).
*   **Календарь практики:** Планирование и отслеживание учебных сессий, генерация сессий с помощью AI.
*   **Творческие заметки:** Создание и управление заметками с различными стилями.
*   **Практика грамматики:** Изучение грамматических тем, генерация уроков и тестов с помощью AI.
*   **Дерево навыков:** Визуализация прогресса обучения.
*   **AI-инструменты:** Анализ прогресса, разговорная практика, помощник по письму, персонализированные советы.
*   **Управление данными:** Экспорт, импорт и сброс данных.
*   **Уведомления:** Напоминания о ежедневных целях.

## 2. Структура HTML (`index.html`)

Файл `index.html` является основой приложения, определяя его макет и подключая все необходимые ресурсы.

### 2.1. Подключение Ресурсов

*   **Мета-теги:** `charset`, `viewport` для адаптивности.
*   **Шрифты:** Google Fonts (Roboto) и Font Awesome (иконки).
*   **CSS-библиотеки:**
    *   `select2.min.css`: Для стилизации выпадающих списков.
    *   `animate.min.css`: Для CSS-анимаций.
    *   `style.css`: Основной файл стилей приложения.
*   **JavaScript-библиотеки (в конце `<body>`):**
    *   `jquery-3.6.0.min.js`: Для упрощения работы с DOM.
    *   `chart.js`: Для построения интерактивных графиков.
    *   `moment.js`, `luxon`, `chartjs-adapter-luxon`: Для работы с датами и временем в графиках.
    *   `chartjs-plugin-datalabels`: Плагин для отображения меток данных на графиках.
    *   `select2.min.js`: Для функциональности выпадающих списков.
    *   `marked/marked.min.js`: Для парсинга Markdown-текста.
    *   `d3js.org/d3.v7.min.js`: Для визуализации дерева навыков.
    *   `gsap.min.js`: Для анимаций (хотя в `script.js` не используется напрямую, подключен).
*   **Локальные скрипты:**
    *   `config.js`: Предполагается, что содержит конфигурационные данные (например, API-ключи).
    *   `prompts.js`: Содержит шаблоны промптов для AI.
    *   `script.js`: Основной JavaScript-файл с логикой приложения.

### 2.2. Основная Структура DOM

Приложение состоит из двух основных частей: боковой панели навигации (`.sidebar`) и основного содержимого (`.content`).

```html
<div class="app-container">
  <nav class="sidebar">...</nav>
  <main class="content">...</main>
</div>
```

#### 2.2.1. Боковая Панель Навигации (`.sidebar`)

*   **Логотип:** `.logo` с иконкой и названием "English Pro".
*   **Ссылки на разделы:** `.nav-links` - неупорядоченный список `ul` с элементами `li`, каждый из которых имеет атрибут `data-section` для переключения между разделами.
    *   Dashboard
    *   Vocabulary
    *   Practice Calendar
    *   Creative Notes
    *   Grammar Practice
    *   Skill Tree
    *   AI Tools
    *   Settings
*   **Переключатель темы:** `.theme-switcher` с иконками луны и солнца, а также `input type="checkbox"` для переключения светлой/темной темы.

#### 2.2.2. Основное Содержимое (`.content`)

Содержит несколько `<section>` элементов, каждый из которых представляет отдельный раздел приложения. Только один раздел активен (`.active`) в любой момент времени.

*   **Dashboard (`#dashboard`)**
    *   Заголовок `<h1>` с иконкой.
    *   Кнопка `Add Word` (`#addWordBtnDashboard`).
    *   Контейнер для статистики (`.stats-container`).
    *   Контейнеры для графиков (`.chart-container`) с кнопками выбора периода (неделя/месяц/день):
        *   `#goalChart` (Weekly Goal Completion)
        *   `#vocabChart` (Vocabulary Progress)
        *   `#practiceChart` (Practice Distribution)

*   **Vocabulary Bank (`#vocabulary`)**
    *   Заголовок `<h1>` с иконкой.
    *   Кнопки `Сгенерировать (Gemini)` (`#generateWordsBtn`) и `Add Word` (`#addWordBtn`).
    *   Панель поиска и фильтрации (`.search-filter`):
        *   Поле поиска `#vocabSearch`.
        *   Выпадающие списки `#vocabFilter` (All Words, New, Learning, Mastered) и `#vocabPartOfSpeech` (All Parts, Noun, Verb, Adjective, Adverb, Expression).
    *   Таблица словарного запаса (`#vocabularyTable`) с заголовками для сортировки и телом `#vocabularyList` для динамического добавления слов.

*   **Practice Calendar (`#practice`)**
    *   Заголовок `<h1>` с иконкой.
    *   Кнопки `Generate Sessions` (`#generateSessionsBtn`) и `Add Session` (`#addPracticeBtn`).
    *   Календарь (`.calendar-container`) с кнопками навигации по месяцам (`#prevMonth`, `#nextMonth`) и сеткой дней `#calendarGrid`.
    *   Список запланированных сессий (`.practice-sessions`) с таблицей `#sessionsTable` и телом `#sessionsList`.

*   **Creative Notes (`#notes`)**
    *   Заголовок `<h1>` с иконкой.
    *   Кнопка `Add Note` (`#addNoteBtn`).
    *   Сетка для заметок `#notesGrid`.

*   **Grammar Practice (`#grammar`)**
    *   Заголовок `<h1>` с иконкой.
    *   Кнопка `Add Topic` (`#addGrammarTopicBtn`).
    *   Панель управления грамматикой (`.grammar-controls`):
        *   Поле поиска `#grammarSearch`.
        *   Выпадающие списки `#grammarLevel` (All Levels, Beginner, Intermediate, Advanced) и `#grammarCategory` (Tenses, Articles, Prepositions, Conditionals, Modals, Other).
    *   Контейнер грамматики (`.grammar-container`) с:
        *   Списком тем `#grammarTopicsList`.
        *   Областью контента `#grammarContentArea` для уроков/тестов.

*   **Skill Tree (`#progress`)**
    *   Заголовок `<h1>` с иконкой.
    *   Кнопка `Generate Plan` (`#generatePlanBtnSkillTree`).
    *   Контейнер дерева навыков (`.skill-tree-container`) с SVG-элементом `#skillTreeVisualization` и областью деталей `#skillDetails`.

*   **AI Tools (`#ai-tools`)**
    *   Заголовок `<h1>` с иконкой.
    *   Кнопка `Generate Plan` (`#generatePlanBtnAITools`).
    *   Контейнер AI-инструментов (`.ai-tools-container`) с карточками для:
        *   Learning Analytics (`#analyzeProgressBtn`)
        *   Conversation Practice (`#startConversationBtn`, `#conversationInput`, `#sendMessageBtn`, `#conversationTopic`, `#restartConversationBtn`)
        *   Writing Assistant (`#writingInput`, `#checkWritingBtn`)
        *   Personalized Tips (`#getTipsBtn`)

*   **Settings (`#settings`)**
    *   Заголовок `<h1>` с иконкой.
    *   Контейнер настроек (`.settings-container`) с карточками для:
        *   Appearance (Dark Mode, App Theme, Accent Color)
        *   Notifications (Enable Notifications, Daily Reminder)
        *   Goals (Daily Words, Daily Practice)
        *   Data Management (Export, Import, Reset)
        *   Learning Profile (Default Current Level, Default Target Level)
        *   AI Settings (AI Assistance Level, Feedback Detail, Language)

### 2.3. Модальные Окна

Приложение использует несколько модальных окон для ввода данных и отображения информации.

*   `#wordModal`: Добавление/редактирование слова.
*   `#editWordStatusModal`: Изменение статуса слова (уровень владения).
*   `#practiceModal`: Добавление/редактирование практического занятия.
*   `#noteModal`: Создание/редактирование заметки.
*   `#noteViewModal`: Просмотр заметки.
*   `#confirmModal`: Общее модальное окно подтверждения.
*   `#conversationModal`: Модальное окно для AI-разговорной практики.
*   `#planModal`: Модальное окно для генерации плана обучения.
*   `#generateSessionsModal`: Модальное окно для генерации практических сессий.
*   `#gemini-generate-modal`: Модальное окно для генерации слов с помощью Gemini.
*   `#grammarTopicModal`: Модальное окно для добавления/редактирования грамматической темы.

## 3. Функциональность JavaScript (`script.js`)

Файл `script.js` содержит всю основную логику приложения, включая управление состоянием, взаимодействие с IndexedDB, обновление UI, работу с графиками, AI-инструментами и обработку событий.

### 3.1. Глобальные Переменные и Объекты

*   `eventBus`: Простая система событий для взаимодействия между компонентами.
*   `appData`: Основной объект, хранящий все данные приложения (слова, сессии практики, грамматические темы, заметки, настройки, дерево прогресса, история разговоров).
*   `elements`: Объект, содержащий ссылки на все ключевые DOM-элементы, инициализируется после `DOMContentLoaded`.
*   `goalChart`, `vocabChart`, `practiceChart`: Объекты Chart.js для графиков.
*   `currentCalendarDate`: Текущая дата для навигации по календарю.
*   `currentNoteId`: ID текущей просматриваемой/редактируемой заметки.
*   `noteBackgrounds`, `darkNoteBackgrounds`: Массивы градиентов для стилизации заметок.
*   `noteAspectRatios`: Массив соотношений сторон для заметок (хотя в текущей реализации используется `grid-auto-rows` для Masonry-подобного макета).
*   `db`: Глобальная переменная для IndexedDB.
*   `currentGrammarTest`, `currentGrammarTopicId`: Переменные для управления текущим тестом по грамматике.
*   `apiCache`: `Map` для кэширования ответов Gemini API.

### 3.2. Инициализация и Загрузка Данных

*   `initSelect2()`: Инициализирует библиотеку Select2 для стилизации выпадающих списков.
*   `initDB()`: Асинхронная функция для открытия и инициализации IndexedDB. Создает хранилища объектов (`words`, `practiceSessions`, `grammarTopics`, `notes`, `settings`, `progressTree`, `conversationHistory`) при первом запуске или обновлении версии БД.
*   `loadData()`: Асинхронная функция, которая загружает все данные из IndexedDB в `appData`. Если настройки отсутствуют, инициализирует их значениями по умолчанию. После загрузки вызывает `applyThemeSettings()`, `updateUI()` и `initSelect2()`.
*   `updateProgressCounters()`: Обновляет счетчики слов и грамматических тем в `progressTree` и их статусы.

### 3.3. Работа с IndexedDB

*   `getAllData(storeName)`: Получает все записи из указанного хранилища объектов.
*   `addData(storeName, data)`: Добавляет новую запись в хранилище объектов.
*   `updateData(storeName, dataObject)`: Обновляет существующую запись или добавляет новую, если ключ не существует (использует `put`).
*   `deleteData(storeName, id)`: Удаляет запись по ID из хранилища объектов.
*   `saveData()`: Сохраняет все данные из `appData` обратно в IndexedDB, очищая существующие хранилища и записывая текущие данные.

### 3.4. Обновление Пользовательского Интерфейса (`updateUI()`)

Эта функция является центральной для обновления всех динамических частей приложения после изменения данных. Она вызывает:
*   `updateStatsCards()`: Обновляет карточки статистики на дашборде.
*   `updateVocabularyList()`: Обновляет таблицу слов.
*   `updatePracticeCalendar()`: Обновляет календарь практики.
*   `updateSessionsList()`: Обновляет список запланированных сессий.
*   `updateNotesGrid()`: Обновляет сетку заметок.
*   `updateCharts()`: Обновляет все графики.
*   `updateSkillTree()`: Обновляет визуализацию дерева навыков.
*   `updateGrammarTopicsList()`: Обновляет список грамматических тем.

### 3.5. Функции для Разделов

#### 3.5.1. Dashboard

*   `calculateStreak()`: Рассчитывает текущую и максимальную серию дней практики.
*   `calculateTotalPracticeMinutes()`: Суммирует общее время практики.
*   `calculateWeeklyChange(type)`: Рассчитывает изменения за последнюю неделю для слов, практики и грамматики.
*   `getWeeklyChangeIcon(type)`: Возвращает соответствующую иконку для изменения.
*   `updateGoalChart(period)`, `updateVocabChart(period)`, `updatePracticeChart(period)`: Функции для создания/обновления графиков с учетом выбранного периода (день/неделя/месяц). Используют Chart.js.

#### 3.5.2. Vocabulary

*   `showMasteryContextMenu(wordId, x, y)`: Отображает контекстное меню для изменения уровня владения словом.
*   `editWord(wordId)`: Открывает модальное окно для редактирования слова.
*   `deleteWord(wordId)`: Удаляет слово.
*   `generateWordsWithGemini(topic, count)`: Отправляет запрос к Gemini API для генерации слов по заданной теме и количеству, затем добавляет их в базу данных.

#### 3.5.3. Practice Calendar

*   `updatePracticeCalendar()`: Генерирует сетку календаря, отмечая дни с практикой.
*   `getActivityColor(activityType)`: Возвращает цвет для типа активности.
*   `showDaySessions(date)`: Отображает модальное окно со списком сессий для выбранного дня.
*   `addPracticeSession(date)`: Открывает модальное окно для добавления сессии на конкретную дату.
*   `updateSessionCompletion(sessionId, completed)`, `updateSessionOnTime(sessionId, onTime)`: Обновляют статус выполнения и своевременности сессии.
*   `editPracticeSession(sessionId)`: Открывает модальное окно для редактирования сессии.
*   `deletePracticeSession(sessionId)`: Удаляет сессию.
*   `parseTreeAndCreateSessions(treeNode, planDuration, dailyRepetitions, studyTimes)`: Парсит структуру плана обучения (полученного от AI) и создает соответствующие практические сессии в календаре.

#### 3.5.4. Creative Notes

*   `updateNotesGrid()`: Генерирует сетку заметок, применяя случайные фоны и соотношения сторон (хотя Masonry-подобный макет теперь управляется `grid-auto-rows` и JS для `grid-row-end`).
*   `resizeAllNotes()`: Пересчитывает высоту заметок для Masonry-подобного макета.
*   `viewNote(noteId)`: Открывает модальное окно для просмотра заметки.
*   `editNote(noteId)`: Открывает модальное окно для редактирования заметки.
*   `deleteNote(noteId)`: Удаляет заметку.

#### 3.5.5. Skill Tree

*   `renderSkillTree(data)`: Визуализирует дерево навыков с помощью D3.js. Включает функциональность масштабирования и панорамирования.
*   `wrap(text, width)`: Вспомогательная функция для переноса длинного текста в SVG.
*   `renderSubcategories(category)`: (Не используется напрямую в текущем `renderSkillTree`, но может быть частью более детальной визуализации).
*   `getSkillStatusClass(category)`, `getItemStatusClass(category, item)`: Функции для определения классов статуса навыков.
*   `showSkillDetails(skillName, skillText)`: Отображает детали выбранного навыка.
*   `getTopicExplanation(topic)`: Получает объяснение темы от Gemini API.
*   `startPracticeSession(skill)`, `showLearningResources(skill)`: Заглушки для будущей функциональности.

#### 3.5.6. Grammar Practice

*   `updateGrammarTopicsList()`: Обновляет список грамматических тем с учетом поиска и фильтров.
*   `showGrammarLesson(topicId, regenerate)`: Отображает урок по грамматике, генерируя его с помощью Gemini API (с возможностью кэширования).
*   `generateGrammarTest(topicId)`: Генерирует тест по грамматике с помощью Gemini API.
*   `renderGrammarTest(questions, container)`: Отображает вопросы теста в DOM.
*   `submitGrammarTest()`: Проверяет ответы пользователя и отображает результаты теста.
*   `showTestResultsModal(score, totalQuestions, results)`: Отображает модальное окно с подробными результатами теста.
*   `viewGrammarTopic(topicId)`: Показывает урок по грамматике при клике на тему.
*   `editGrammarTopic(topicId)`: Открывает модальное окно для редактирования грамматической темы.
*   `deleteGrammarTopic(topicId)`: Удаляет грамматическую тему.

#### 3.5.7. AI Tools

*   `analyzeProgress()`: Отправляет данные о прогрессе пользователя в Gemini API для анализа и отображает результат.
*   `startConversation()`: Инициализирует модальное окно для разговорной практики с AI.
*   `sendMessage()`: Отправляет сообщение пользователя AI и отображает ответ.
*   `checkWriting()`: Отправляет текст пользователя в Gemini API для проверки и коррекции.
*   `getPersonalizedTips()`: Получает персонализированные советы по обучению от Gemini API.
*   `analyzeComprehensiveProgress()`: Выполняет комплексный анализ прогресса обучения.
*   `visualizeKnowledgeGraph()`: (Заглушка) Для будущей визуализации графа знаний.

### 3.6. Настройки и Уведомления

*   `applyThemeSettings()`: Применяет настройки темы (темный режим, акцентный цвет, уровень AI-помощи, язык, уровни обучения) к DOM.
*   `showConfirmModal(title, message, confirmAction, confirmText, cancelAction, cancelText)`: Универсальное модальное окно для подтверждения действий.
*   `exportData()`: Экспортирует все данные приложения в JSON-файл.
*   `importData(file)`: Импортирует данные из JSON-файла, перезаписывая текущие данные.
*   `resetData()`: Удаляет все данные из IndexedDB.
*   `checkNotifications()`: Проверяет, нужно ли показать ежедневное напоминание о целях.
*   `requestNotificationPermission()`: Запрашивает разрешение на показ уведомлений в браузере.
*   `initializeLearningProfile()`: Инициализирует профиль обучения пользователя.
*   `updateLearningProfile()`: Обновляет профиль обучения на основе недавней активности с помощью AI.
*   `getRecentActivities(limit)`: Получает список недавних активностей пользователя.
*   `initEventSystem()`: Настраивает подписки на события через `eventBus`.
*   `getCrossSectionRecommendations()`: Получает персонализированные рекомендации от AI, связывающие различные области обучения.
*   `showRecommendationNotification(recommendations)`: Отображает уведомление с рекомендациями.
*   `generateSmartSchedule()`: (Заглушка) Для генерации оптимального расписания обучения с помощью AI.
*   `setupContextualReminders()`: Настраивает контекстные напоминания (например, о повторении слов).
*   `getPersonalizedExplanation(topic, currentContext)`: Получает персонализированное объяснение темы от AI.
*   `generateAdaptiveExercise(topic, difficulty)`: Генерирует адаптивное упражнение от AI.
*   `getPracticeDistribution()`: Рассчитывает распределение времени по типам практики.
*   `showNotification(message)`: Отображает простое уведомление.

### 3.7. Взаимодействие с Gemini API

*   `getPrompt(key, replacements)`: Централизованная функция для получения шаблонов промптов из `prompts.js` с учетом текущего языка и подстановкой плейсхолдеров. Добавляет системные инструкции для AI.
*   `callGeminiAPI(contents, model, useCache)`: Асинхронная функция для отправки запросов к Gemini API. Поддерживает кэширование ответов. Проверяет наличие API-ключа.
*   `showGeminiResponse(text)`: Отображает ответ от Gemini API в модальном окне, парся Markdown.

### 3.8. Вспомогательные Функции

*   `capitalize(str)`: Делает первую букву строки заглавной.
*   `formatDate(dateString)`: Форматирует строку даты в `DD/MM/YYYY`.
*   `formatShortDate(date)`: Форматирует объект даты в короткий формат (например, "Mon, Aug 14").
*   `formatTime(timeString)`: Форматирует строку времени в `HH:MM AM/PM`.
*   `formatMonth(monthYear)`: Форматирует строку "YYYY-MM" в "Month YYYY".

### 3.9. Обработчики Событий (`setupEventListeners()`)

Эта функция настраивает все обработчики событий для интерактивности приложения:
*   Навигация по разделам боковой панели.
*   Переключение темы (в боковой панели и настройках).
*   Изменение акцентного цвета.
*   Открытие модальных окон для добавления/редактирования слов, заметок, сессий практики, грамматических тем.
*   Обработка форм добавления/редактирования.
*   Поиск и фильтрация слов и грамматических тем.
*   Навигация по календарю.
*   Изменение статуса выполнения/своевременности сессий.
*   Экспорт, импорт, сброс данных.
*   Управление уведомлениями и временем напоминаний.
*   Изменение целей по словам и практике.
*   Изменение уровня AI-помощи и детализации обратной связи.
*   Изменение языка приложения.
*   Обработчики для всех кнопок AI-инструментов.
*   Обработчики для кнопок выбора периода графиков.
*   Обработчики для генерации плана обучения и сессий.
*   Обработчики для добавления/удаления временных слотов в модальном окне плана.
*   Обработчики для кнопок масштабирования дерева навыков.

### 3.10. Запуск Приложения

*   `DOMContentLoaded` слушатель: Гарантирует, что DOM полностью загружен перед инициализацией.
    *   Инициализирует `elements`.
    *   Вызывает `setupEventListeners()`.
    *   Инициализирует `eventBus`.
    *   Вызывает `loadData()` для загрузки всех данных.
    *   Проверяет и инициализирует `learningProfile`, если он отсутствует.
    *   Вызывает `updateLearningProfile()` и `checkDailyRecommendations()` (если API-ключ установлен).
    *   Устанавливает интервал для `checkNotifications`.

## 4. Стили CSS (`style.css`)

Файл `style.css` определяет внешний вид и адаптивность приложения, используя CSS-переменные для легкой смены тем.

### 4.1. CSS-Переменные

*   `:root`: Определяет переменные для светлой темы (цвета, фоны, тени, переходы).
*   `[data-theme="dark"]`: Переопределяет переменные для темной темы.

### 4.2. Общие Стили

*   `*`: Сброс `box-sizing`, `margin`, `padding`.
*   `body`: Базовые стили шрифта, цвета текста, фона, переходов.
*   `.app-container`: Flexbox-контейнер для боковой панели и основного содержимого.

### 4.3. Боковая Панель (`.sidebar`)

*   Фиксированная ширина, фон, цвет текста.
*   Flexbox для расположения элементов.
*   Стили для логотипа, ссылок навигации (`.nav-links`), активных ссылок (`.active`), эффектов наведения.
*   Стили для переключателя темы (`.theme-switcher`, `.switch`, `.slider`).

### 4.4. Основное Содержимое (`.content`)

*   Flex-grow для заполнения доступного пространства.
*   Стили для разделов (`.section`), включая анимацию появления (`@keyframes fadeIn`).
*   Стили для заголовков разделов (`.section-header`, `h1`), кнопок действий (`.action-btn`).

### 4.5. Карточки Статистики (`.stats-container`, `.stat-card`)

*   Grid-макет для карточек.
*   Стили для фона, теней, границ, текста, значений и иконок.
*   Эффекты наведения.

### 4.6. Графики (`.chart-container`, `.chart-card`)

*   Grid-макет для графиков.
*   Стили для фона, теней, заголовков.
*   Стили для селекторов периода (`.chart-period-selector`, `.period-btn`), включая активное состояние и эффекты наведения.
*   Адаптивные стили для расположения графиков.

### 4.7. Поиск и Фильтрация (`.search-filter`)

*   Flexbox-макет для полей поиска и выпадающих списков.
*   Стили для поля поиска (`.search-box`, `input`), включая иконку.
*   Стили для Select2-компонентов (`.select2-container`, `.select2-selection`, `.select2-dropdown`, `.select2-results__option`).

### 4.8. Таблицы (`.table-container`, `table`)

*   Общие стили для таблиц, заголовков (`th`), ячеек (`td`), чередующихся строк.
*   Стили для сортируемых заголовков (`th[data-sort]`).
*   Индикаторы уровня владения (`.mastery-new`, `.mastery-learning`, `.mastery-mastered`).

### 4.9. Календарь (`.calendar-container`, `.calendar-grid`)

*   Стили для контейнера календаря, заголовка (`.calendar-header`), кнопок навигации.
*   Grid-макет для дней календаря (`.calendar-day`).
*   Стили для заголовков дней недели, пустых дней, дней с практикой (`.has-practice`), сегодняшнего дня (`.today`), выбранного дня (`.selected`).
*   Стили для точек событий (`.day-events`, `.day-event-dot`).

### 4.10. Список Сессий Практики (`.practice-sessions`)

*   Стили для контейнера и таблицы сессий.
*   Стили для чекбоксов выполнения (`.completed-checkbox`, `.ontime-checkbox`, `.checkbox-container`, `.checkmark`).

### 4.11. Сетка Заметок (`.notes-grid`, `.note-card`)

*   Grid-макет для заметок с `grid-auto-rows` для Masonry-подобного эффекта.
*   Стили для карточек заметок (фон, тень, заголовок, предпросмотр, дата).
*   Стили для случайных фоновых градиентов заметок (светлая и темная темы).

### 4.12. Дерево Навыков (`.skill-tree-container`, `.skill-tree`, `#skillTreeVisualization`)

*   Flexbox-макет для контейнера дерева и деталей.
*   Стили для SVG-элемента D3.js (круги узлов, текст, линии связей).
*   Стили для кнопок масштабирования (`#zoom-controls`).
*   Стили для индикаторов статуса навыков (`.skill-new`, `.skill-in-progress`, `.skill-mastered`).
*   Стили для прогресс-баров (`.progress-bar`, `.progress`).

### 4.13. AI-Инструменты (`.ai-tools-container`, `.ai-tool-card`)

*   Grid-макет для карточек инструментов.
*   Стили для заголовков карточек, иконок, текста, кнопок.
*   Стили для области ввода текста (`textarea`).
*   Стили для модального окна разговора (`.conversation-container`, `.conversation-messages`, `.conversation-input`, `.ai-message`, `.user-message`, `.message-avatar`, `.message-content`, `.message-text`, `.message-time`).

### 4.14. Настройки (`.settings-container`, `.settings-card`)

*   Grid-макет для карточек настроек.
*   Стили для заголовков карточек, опций настроек (`.settings-option`), полей ввода.
*   Стили для кнопок управления данными (`.settings-btn`, `.danger`).
*   Стили для радиокнопок выбора языка (`.radio-group`).

### 4.15. Модальные Окна (`.modal`, `.modal-content`)

*   Общие стили для модальных окон (фон, размытие, анимация появления).
*   Стили для содержимого модальных окон (фон, тень, заголовок, кнопка закрытия).
*   Стили для форм внутри модальных окон (`.form-row`, `.form-group`, `label`, `input`, `select`, `textarea`).
*   Стили для кнопок форм (`.primary-btn`, `.secondary-btn`, `.danger-btn`).
*   Стили для области просмотра заметок (`.note-view-content`).
*   Стили для пустых состояний (`.empty-table`, `.empty-notes`).
*   Стили для индикатора загрузки (`.loader-container`, `.loader`).

### 4.16. Стили для Практики Грамматики

*   `.grammar-controls`: Flexbox для элементов управления поиском и фильтрацией.
*   `.grammar-container`: Grid-макет для списка тем и области контента.
*   `.grammar-topics-list`: Стили для списка тем.
*   `.grammar-topic`: Стили для отдельных тем (фон, границы, тени, эффекты наведения, активное состояние).
*   `.topic-title`, `.topic-meta`, `.topic-level`, `.topic-category`, `.topic-status`: Стили для метаданных темы, включая цветовые индикаторы уровня и статуса.
*   `.topic-actions`: Стили для кнопок редактирования/удаления темы.
*   `.grammar-content-area`: Стили для области отображения уроков и тестов, включая пустое состояние.
*   `.lesson-header`, `.test-header`: Стили для заголовков уроков/тестов и кнопок действий.
*   `.lesson-content`, `.test-content`: Стили для содержимого уроков/тестов (текст, списки, код).
*   `.question-card`: Стили для карточек вопросов в тесте.
*   `.question-text`, `.options`, `.option-label`, `input[type="radio"]`, `.fill-in-blank-input`: Стили для вопросов и вариантов ответов.
*   `.test-results-modal`: Стили для модального окна результатов теста.
*   `.results-summary`, `.results-details`, `.result-item`, `.correct`, `.incorrect`, `.your-answer`, `.correct-answer`, `.explanation`: Стили для отображения результатов теста, включая цветовые индикаторы правильности и объяснения.

### 4.17. Адаптивность (Медиа-запросы)

Приложение полностью адаптивно и использует медиа-запросы для оптимизации макета под различные размеры экранов:
*   `@media (max-width: 1200px)`: Изменения для средних экранов (сетки статистики и графиков).
*   `@media (max-width: 992px)`: Сворачивание боковой панели, изменения в сетках.
*   `@media (max-width: 768px)`: Переключение на колончатый макет для `app-container`, адаптация боковой панели, форм, сеток заметок и AI-инструментов.
*   `@media (max-width: 576px)`: Дальнейшая адаптация для маленьких экранов (отступы, размеры шрифтов, расположение элементов форм, модальных окон, грамматического раздела).
*   `@media (max-width: 400px)`: Оптимизация для очень маленьких экранов (скрытие логотипа, переключателя темы, дальнейшее уменьшение отступов и размеров элементов).

## 5. Файл `config.js`

Этот файл, вероятно, содержит глобальные конфигурационные переменные, такие как `GEMINI_API_KEY`. В `script.js` есть проверка на `GEMINI_API_KEY === "YOUR_API_KEY"`, что указывает на необходимость его настройки пользователем.

## 6. Файл `prompts.js`

Этот файл содержит JavaScript-объект `prompts`, который хранит шаблоны текстовых промптов для взаимодействия с Gemini API. Промпты организованы по языкам (`en`, `ru`, `tg`) и по ключам функциональности (например, `wordGeneration`, `grammarLesson`, `correction`, `dialogue`, `sendMessage`, `analyzeProgress`, `personalizedTips`, `planGeneration`, `studyGuide`, `topicExplanation`, `updateProfile`, `analyzeComprehensiveProgress`).

Каждый промпт может содержать плейсхолдеры (например, `[COUNT]`, `[TOPIC]`, `[TEXT]`, `[LEVEL]`, `[LANG_NAME]`, `[HISTORY]`, `[DATA]`, `[PRIMARY_GOAL]`, `[PLAN_DURATION]`, `[TIME_PROMPT]`, `[DAILY_REPETITIONS]`, `[CUSTOM_SECTIONS]`, `[PATH]`), которые заменяются динамически функцией `getPrompt` в `script.js` перед отправкой запроса к AI.

Также содержит системные инструкции (`systemInstruction`, `systemInstructionTeacher`, `systemInstructionPartner`), которые задают роль AI в диалоге.

## 7. Логика Работы Каждой Кнопки и Строки (Примеры)

### 7.1. Навигация по Разделам

*   **Кнопки в `.nav-links li`:** При клике на элемент `li`, JavaScript (в `setupEventListeners`) удаляет класс `active` у всех ссылок навигации и добавляет его к текущей. Затем он скрывает все `<section>` элементы и показывает тот, чей `id` соответствует `data-section` атрибуту нажатой ссылки.

### 7.2. Переключение Темы

*   **Чекбокс `#themeToggle` (и `#themeToggleSettings`):** При изменении состояния чекбокса, JavaScript проверяет его `checked` свойство. Если `true`, он добавляет атрибут `data-theme="dark"` к элементу `<html>` и устанавливает `appData.settings[0].darkMode = true`. В противном случае, атрибут `data-theme` удаляется, и `darkMode` устанавливается в `false`. Затем вызывается `updateData` для сохранения настройки. CSS-переменные в `style.css` автоматически адаптируются под `[data-theme="dark"]`.

### 7.3. Добавление/Редактирование Слова

*   **Кнопка `#addWordBtn` (или `#addWordBtnDashboard`):** При клике, JavaScript устанавливает заголовок модального окна `#wordModalTitle` на "Add New Word", удаляет скрытое поле `wordId` (если оно есть, чтобы гарантировать добавление нового слова, а не редактирование), и отображает модальное окно `#wordModal`.
*   **Форма `#wordForm` (submit):** При отправке формы, JavaScript собирает данные из полей ввода. Если присутствует скрытое поле `wordId`, он вызывает `updateData('words', newWord)` для обновления существующего слова. В противном случае, он генерирует новый `id` и вызывает `addData('words', newWord)`. После этого вызывается `loadData()` для перезагрузки всех данных и обновления UI, модальное окно закрывается, и форма сбрасывается.

### 7.4. Изменение Уровня Владения Словом (Контекстное Меню)

*   **Клик по строке таблицы слов:** При клике на `<tr>` в `#vocabularyTable` (если это не кнопка редактирования/удаления), JavaScript получает `data-id` слова. Затем он вызывает `showMasteryContextMenu(wordId, x, y)`, которая создает и отображает небольшое контекстное меню рядом с курсором.
*   **Клик по опции в контекстном меню:** При выборе опции ("New", "Learning", "Mastered"), JavaScript обновляет свойство `mastery` соответствующего слова в `appData.words` и вызывает `updateData('words', word)` для сохранения изменения. Затем `loadData()` обновляет UI, и меню закрывается.

### 7.5. Генерация Слов с Gemini

*   **Кнопка `#generateWordsBtn`:** Открывает модальное окно `#gemini-generate-modal`.
*   **Форма `#gemini-generate-form` (submit):** Собирает тему и количество слов. Отображает индикатор загрузки. Вызывает `generateWordsWithGemini(topic, count)`. Эта функция формирует промпт с помощью `getPrompt('wordGeneration', ...)`, вызывает `callGeminiAPI` для получения ответа от AI. Ответ парсится (ожидается JSON с массивом слов), и каждое слово добавляется в IndexedDB через `addData('words', newWord)`. После успешного добавления вызывается `loadData()` для обновления UI, и модальное окно закрывается. В случае ошибки отображается сообщение.

### 7.6. Календарь Практики

*   **Кнопки `#prevMonth` / `#nextMonth`:** При клике, JavaScript изменяет `currentCalendarDate` на предыдущий/следующий месяц и вызывает `updatePracticeCalendar()` для перерисовки календаря.
*   **Клик по дню в календаре (`.calendar-day`):** При клике, JavaScript добавляет класс `selected` к выбранному дню и вызывает `showDaySessions(dateStr)` для отображения модального окна с сессиями на этот день.
*   **Кнопка `Add Session` в модальном окне дня:** Вызывает `addPracticeSession(date)`, которая открывает модальное окно `#practiceModal` с предустановленной датой.

### 7.7. Добавление/Редактирование Грамматической Темы

*   **Кнопка `#addGrammarTopicBtn`:** Открывает модальное окно `#grammarTopicModal` для добавления новой темы.
*   **Форма `#grammarTopicForm` (submit):** Собирает данные о теме. Генерирует новый `id` и вызывает `addData('grammarTopics', newTopic)`. Затем `loadData()` обновляет UI, и модальное окно закрывается.

### 7.8. Просмотр Урока/Теста по Грамматике

*   **Клик по грамматической теме в списке (`.grammar-topic`):** Вызывает `viewGrammarTopic(topicId)`, которая в свою очередь вызывает `showGrammarLesson(topicId)`.
*   **`showGrammarLesson(topicId)`:** Очищает `#grammarContentArea`, показывает индикатор загрузки. Формирует промпт для AI (`getPrompt('grammarLesson', ...)`) и вызывает `callGeminiAPI`. Полученный Markdown-ответ парсится с помощью `marked.parse()` и вставляется в `lessonContentDiv`. Урок сохраняется в объекте темы.
*   **Кнопка `#startTestBtn`:** Вызывает `generateGrammarTest(topicId)`.
*   **`generateGrammarTest(topicId)`:** Аналогично уроку, формирует промпт для теста (`getPrompt('grammarTest', ...)`), вызывает `callGeminiAPI`. Ожидается JSON-ответ с вопросами, который парсится и передается в `renderGrammarTest`.
*   **Кнопка `#submitTestBtn`:** Вызывает `submitGrammarTest()`. Эта функция собирает ответы пользователя из DOM, сравнивает их с правильными ответами (`currentGrammarTest.questions`), подсчитывает балл и вызывает `showTestResultsModal` для отображения результатов.

### 7.9. Генерация Плана Обучения

*   **Кнопки `#generatePlanBtnSkillTree` / `#generatePlanBtnAITools`:** Открывают модальное окно `#planModal`.
*   **Форма `#planForm` (submit):** Собирает все параметры плана (длительность, повторения, уровни, цель, время и т.д.). Показывает индикатор загрузки. Формирует сложный промпт (`getPrompt('planGeneration', ...)`) и вызывает `callGeminiAPI`. Полученный JSON-ответ парсится и используется для обновления `appData.progressTree` и вызова `parseTreeAndCreateSessions` для создания практических сессий на основе сгенерированного плана. После этого `loadData()` обновляет UI.

### 7.10. AI-Инструменты (Примеры)

*   **Кнопка `#analyzeProgressBtn`:** Собирает текущие данные о прогрессе пользователя, формирует промпт (`getPrompt('analyzeProgress', ...)`) и вызывает `callGeminiAPI`. Результат отображается в модальном окне `showGeminiResponse`.
*   **Кнопка `#sendMessageBtn` (в модальном окне разговора):** Добавляет сообщение пользователя в историю разговора и в DOM. Показывает индикатор загрузки. Формирует промпт (`getPrompt('sendMessage', ...)`) с учетом истории разговора и вызывает `callGeminiAPI`. Ответ AI добавляется в DOM и историю.

### 7.11. Настройки

*   **Поля ввода/выбора в разделе "Settings":** При изменении значений (например, `#accentColor`, `#dailyWordsGoal`, `#aiAssistanceLevel`, `#languageSelection`), соответствующие свойства в `appData.settings[0]` обновляются, и вызывается `updateData('settings', appData.settings[0])` для сохранения изменений в IndexedDB. Для языка также очищается кэш API и применяется тема.
*   **Кнопка `#exportBtn`:** Вызывает `exportData()`, которая собирает все данные из IndexedDB, преобразует их в JSON-строку и предлагает пользователю скачать файл.
*   **Кнопка `#importBtn`:** Инициирует выбор файла. После выбора файла, `importData(file)` читает его, парсит JSON и, после подтверждения пользователя через `showConfirmModal`, очищает все хранилища IndexedDB и записывает импортированные данные.

### 7.12. Уведомления

*   **`setInterval(checkNotifications, 5 * 60 * 1000)`:** Эта строка запускает функцию `checkNotifications` каждые 5 минут.
*   **`checkNotifications()`:** Проверяет, включены ли уведомления в настройках. Сравнивает текущее время с `reminderTime` из настроек. Если время совпадает и напоминание еще не было показано сегодня, а также если пользователь не выполнил свои ежедневные цели (практика или слова), то генерируется и отображается уведомление (через `Notification` API или `alert`).

## 8. Заключение

Приложение "English Learning Tracker Pro" представляет собой комплексное решение для изучения английского языка, сочетающее в себе функциональность отслеживания прогресса, управления контентом и интерактивные AI-инструменты. Его модульная структура, использование IndexedDB для хранения данных и адаптивный дизайн делают его мощным и удобным инструментом для любого учащегося.
