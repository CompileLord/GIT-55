const prompts = {
  en: {
    systemInstruction: "You are an AI assistant for an English learning app. Your response MUST be in English. This is a strict requirement.",
    systemInstructionTeacher: "You are an AI English teacher. Correct and improve this English text while keeping its original meaning. Explain each correction clearly. Your explanation should be in English.",
    systemInstructionPartner: `You are an AI language practice partner. 
    Your primary instruction is to respond in English. This is a strict requirement.
    Your goal is to hold a natural, detailed, and extended conversation. 
    Your responses must be comprehensive, at least 3-5 sentences long. 
    Always encourage the user to continue the conversation by asking open-ended questions.`,
    
    vocabulary: `Provide a clear definition, 3 usage examples, and a translation to Russian for the word: [WORD]. Format as:\nDefinition: [clear definition]\nExamples:\n1. [example 1]\n2. [example 2]\n3. [example 3]\nTranslation: [translation]`,
    grammar: `Explain the grammar rule for: [TOPIC]. Provide 2 simple examples and 2 advanced examples. Format as:\nRule: [clear explanation]\nSimple Examples:\n1. [example 1]\n2. [example 2]\nAdvanced Examples:\n1. [example 1]\n2. [example 2]`,
    dialogue: `Create a natural dialogue of 6-8 lines about [TOPIC] between two people. Format each line as:\nA: [line 1]\nB: [line 2]`,
    translation: `Translate the following text to English, keeping the original meaning and natural phrasing: [TEXT]`,
    correction: `Text to correct: [TEXT]`,
    
    topicExplanation: `Explain the grammar topic "[TOPIC]" for an Intermediate level learner. Keep the explanation concise (3-5 sentences). Your response MUST be in English.`,
    grammarLesson: `Act as a professional English tutor. 
      Generate a concise and easy-to-understand lesson on the grammar topic: "[TOPIC]".
      The user's level is [LEVEL].
      The lesson should be in English.
      Explain the main rule, provide 2-3 clear examples, and mention a common mistake to avoid.
      Keep it focused and engaging. Use Markdown for formatting.`,
    testGeneration: `Generate a grammar test in English based on the topic "[TOPIC]".
      Configuration:
      - Number of questions: [COUNT]
      - Question types: [TYPES]
      - Difficulty: [DIFFICULTY]

      The entire test, including questions and options, MUST be in English.
      Return the test as a JSON object with a single key "questions".
      "questions" should be an array of objects. Each object must have:
      1. "type": "multiple-choice" or "dropdown".
      2. "question": The question text. For "dropdown", use "{...}" to mark the blank space.
      3. "options": An array of strings for the answer choices.
      4. "answer": The correct answer string from the "options" array.
      
      Return ONLY the JSON object.`,
    wordGeneration: `Generate [COUNT] English words related to the topic "[TOPIC]". 
    For each word, provide a Russian translation, the part of speech (noun, verb, adjective, adverb, expression), and an example sentence.
    Return the result as a JSON object with a single key "words", which is an array of objects.
    Each object in the array should have the following keys: "word", "translation", "partOfSpeech", "example".
    Return ONLY the JSON object.`,
    analyzeProgress: `Analyze the user's learning progress based on the following data: [DATA]. Provide a brief summary of their strengths and weaknesses, as well as 2-3 actionable tips for improvement. Your response MUST be in English.`,
    sendMessage: `You are an AI language practice partner. The user's current conversation topic is: "[TOPIC]". The user's message is: "[MESSAGE]". The conversation history is: [HISTORY]. Respond naturally and in detail (3-5 sentences), continuing the conversation. Always ask an open-ended question to encourage further dialogue. Your response MUST be in English.`,
    personalizedTips: `Based on the user's learning data: [DATA], provide 3 personalized tips to help them improve their English. Focus on practical advice. Your response MUST be in English.`,
    analyzeComprehensiveProgress: `Provide a detailed progress analysis connecting all learning areas based on the following data: [DATA].
      Highlight connections between areas and provide 3 specific improvement suggestions.
      Your response MUST be in [LANG_NAME].`,
    updateProfile: `Analyze this learning activity data and update the user's profile with strengths, weaknesses, preferred learning styles, and interests. Return as JSON.
    
    Activity Data: [DATA]`,
    EXAM_GENERATION_PROMPT: `
Generate a [LEVEL] English exam in JSON format. 
Type: [TYPE] (test/essay/listening/conversation).
Topics: [TOPICS].
Language: en.

Rules:
1. For "test": 10 questions, each with 4 options, 1 correct.
2. For "essay": 3 topics with word limits (100-200 words).
3. For "listening": 5 phrases to transcribe (use simple vocabulary).
4. For "conversation": 5 dialogue scenarios (e.g., "Order food in a cafe").

Output format (JSON):
{
  "title": "Exam Title",
  "type": "[TYPE]",
  "questions": [
    {
      "type": "test",
      "question": "She ___ TV every evening.",
      "options": ["watches", "is watching", "watch", "are watching"],
      "correctAnswer": "watches"
    }
  ]
}`,
    ESSAY_CHECK_PROMPT: `
Analyze this English essay and provide JSON feedback:
Topic: "[TOPIC]"
Text: "[TEXT]"

Output format:
{
  "score": 0-100,
  "feedback": "...",
  "grammarErrors": [{ "error": "...", "correction": "..." }],
  "vocabularySuggestions": ["..."]
}`
  },
  ru: {
    systemInstruction: "Ты — AI-ассистент в приложении для изучения английского языка. Твой ответ ДОЛЖЕН быть на русском языке. Это строгое требование.",
    systemInstructionTeacher: "Ты — AI-преподаватель английского. Исправь и улучши этот английский текст, сохранив его первоначальный смысл. Четко объясни каждое исправление. Твои объяснения должны быть на русском языке.",
    systemInstructionPartner: `Ты — AI-партнер для языковой практики. 
    Твоя главная инструкция — отвечать на русском языке. Это строгое требование.
    Твоя цель — поддерживать естественный, подробный и продолжительный разговор. 
    Твои ответы должны быть развернутыми, длиной не менее 3-5 предложений. 
    Всегда поощряй пользователя продолжать беседу, задавая открытые вопросы.`,

    vocabulary: `Дай четкое определение, 3 примера использования и перевод на русский для слова: [WORD]. Отформатируй так:\nОпределение: [четкое определение]\nПримеры:\n1. [пример 1]\n2. [пример 2]\n3. [пример 3]\nПеревод: [перевод]`,
    grammar: `Объясни грамматическое правило для: [TOPIC]. Приведи 2 простых и 2 сложных примера. Отформатируй так:\nПравило: [четкое объяснение]\nПростые примеры:\n1. [пример 1]\n2. [пример 2]\nСложные примеры:\n1. [пример 1]\n2. [пример 2]`,
    dialogue: `Создай естественный диалог из 6-8 реплик на тему [TOPIC] между двумя людьми. Отформатируй каждую реплику так:\nA: [реплика 1]\nB: [реплика 2]`,
    translation: `Переведи следующий текст на русский язык, сохранив исходный смысл и естественность фраз: [TEXT]`,
    correction: `Текст для исправления: [TEXT]`,

    topicExplanation: `Объясни грамматическую тему "[TOPIC]" для ученика среднего уровня. Объяснение должно быть кратким (3-5 предложений). Твой ответ ДОЛЖЕН быть на русском языке.`,
    grammarLesson: `Выступи в роли дружелюбного и ободряющего репетитора по английскому языку. 
      Создай подробный и понятный урок по грамматической теме: "[TOPIC]".
      Уровень пользователя: [LEVEL].
      Урок должен быть на [LANG_NAME] языке.
      Объясни основное правило, предоставь 3-5 четких примеров, включая их использование в различных контекстах, и подробно опиши распространенные ошибки, которые следует избегать.
      Урок должен быть сфокусированным, увлекательным и информативным. Используй Markdown для форматирования, включая заголовки и списки для лучшей читаемости.`,
    grammarTest: `Создай тест по грамматике на английском языке на тему "[TOPIC]".
      Конфигурация:
      - Количество вопросов: [COUNT]
      - Уровень: [LEVEL]
      - Язык: English

      Весь тест, включая вопросы и варианты ответов, ДОЛЖЕН быть на английском языке.
      Верни тест в виде JSON-объекта с одним ключом "questions".
      "questions" должен быть массивом объектов. Каждый объект должен содержать:
      1. "type": "multiple-choice" или "fill-in-the-blank".
      2. "question": Текст вопроса. Для "fill-in-the-blank" используй "{...}" для обозначения пропуска.
      3. "options": Массив строк для вариантов ответов (только для multiple-choice).
      4. "answer": Правильный ответ.
      5. "explanation": Краткое объяснение правильного ответа.
      
      Верни ТОЛЬКО JSON-объект.`,
    testGeneration: `Создай тест на английском языке.
      Конфигурация:
      - Тип теста: [TYPE] (vocabulary, grammar, mixed)
      - Количество вопросов: [COUNT]
      - Уровень: [LEVEL]
      [RECENT_WORDS]
      [LEARNING_TOPICS]

      Весь тест, включая вопросы и варианты ответов, ДОЛЖЕН быть на английском языке.
      Верни тест в виде JSON-объекта с одним ключом "questions".
      "questions" должен быть массивом объектов. Каждый объект должен содержать:
      1. "type": "multiple-choice" или "fill-in-the-blank".
      2. "question": Текст вопроса. Для "fill-in-the-blank" используй "{...}" для обозначения пропуска.
      3. "options": Массив строк для вариантов ответов (только для multiple-choice).
      4. "answer": Правильный ответ.
      5. "explanation": Краткое объяснение правильного ответа.
      
      Верни ТОЛЬКО JSON-объект.`,
    wordGeneration: `Сгенерируй [COUNT] английских слов, связанных с темой "[TOPIC]". 
    Для каждого слова предоставь перевод на русский, часть речи (noun, verb, adjective, adverb, expression) и пример предложения.
    Верни результат в виде JSON-объекта с одним ключом "words", который является массивом объектов.
    Каждый объект в массиве должен иметь следующие ключи: "word", "translation", "partOfSpeech", "example".
    Верни ТОЛЬКО JSON-объект.`,
    analyzeProgress: `Проанализируй прогресс обучения пользователя на основе следующих данных: [DATA]. 
      Предоставь краткое изложение их сильных и слабых сторон, а также предложи 2-3 действенных совета по улучшению. 
      Твой ответ ДОЛЖЕН быть на русском языке.`,
    sendMessage: `Ты — AI-партнер для языковой практики. 
      Текущая тема разговора пользователя: "[TOPIC]".
      Сообщение пользователя: "[MESSAGE]".
      История разговора: [HISTORY].
      Отвечай естественно и развернуто (3-5 предложений), продолжая разговор. 
      Всегда задавай открытый вопрос, чтобы стимулировать дальнейший диалог. 
      Твой ответ ДОЛЖЕН быть на русском языке.`,
    personalizedTips: `На основе данных об обучении пользователя: [DATA], предоставь 3 персонализированных совета, которые помогут ему улучшить свой английский. 
      Сосредоточься на практических советах. Твой ответ ДОЛЖЕН быть на русском языке.`,
    analyzeComprehensiveProgress: `Предоставьте подробный анализ прогресса, связывающий все области обучения, на основе следующих данных: [DATA].
      Выделите взаимосвязи между областями и дайте 3 конкретных предложения по улучшению.
      Ваш ответ ДОЛЖЕН быть на [LANG_NAME].`,
    updateProfile: `Проанализируй данные об учебной активности и обнови профиль пользователя, указав сильные и слабые стороны, предпочитаемые стили обучения и интересы. Верни в формате JSON.
    
    Данные об активности: [DATA]`,
    EXAM_GENERATION_PROMPT: `
Сгенерируй экзамен по английскому языку уровня [LEVEL] в формате JSON.
Тип: [TYPE] (test/essay/listening/conversation).
Темы: [TOPICS].
Language: ru.

Правила:
1. Для "test": 10 вопросов, в каждом 4 варианта ответа, 1 правильный.
2. Для "essay": 3 темы с ограничением слов (100-200 слов).
3. Для "listening": 5 фраз для транскрипции (используй простую лексику).
4. Для "conversation": 5 диалоговых сценариев (например, "Заказ еды в кафе").

Формат вывода (JSON):
{
  "title": "Название экзамена",
  "type": "[TYPE]",
  "questions": [
    {
      "type": "test",
      "question": "Она ___ телевизор каждый вечер.",
      "options": ["смотрит", "смотрит сейчас", "смотреть", "смотрят"],
      "correctAnswer": "смотрит"
    }
  ]
}`,
    ESSAY_CHECK_PROMPT: `
Проанализируй это эссе на английском языке и предоставь обратную связь в формате JSON:
Тема: "[TOPIC]"
Текст: "[TEXT]"

Формат вывода:
{
  "score": 0-100,
  "feedback": "...",
  "grammarErrors": [{ "error": "...", "correction": "..." }],
  "vocabularySuggestions": ["..."]
}`
  },
  tg: {
    systemInstruction: "Шумо ёрдамчии AI дар барномаи омӯзиши забони англисӣ ҳастед. Ҷавоби шумо БОЯД бо забони тоҷикӣ бошад. Ин талаботи қатъӣ аст.",
    systemInstructionTeacher: "Шумо муаллими AI-и забони англисӣ ҳастед. Ин матни англисиро ислоҳ ва такмил диҳед, дар ҳоле ки маънои аслии онро нигоҳ доред. Ҳар як ислоҳро ба таври возеҳ шарҳ диҳед. Шарҳҳои шумо бояд бо забони тоҷикӣ бошанд.",
    systemInstructionPartner: `Шумо шарики AI барои машқи забон ҳастед. 
    Дастури асосии шумо - бо забони тоҷикӣ ҷавоб додан аст. Ин талаботи қатъӣ аст.
    Ҳадафи шумо - гузаронидани сӯҳбати табиӣ, муфассал ва дарозмуддат аст. 
    Ҷавобҳои шумо бояд ҳамаҷониба, на камтар аз 3-5 ҷумла бошанд. 
    Ҳамеша корбарро ба идомаи сӯҳбат тавассути додани саволҳои кушода ташвиқ кунед.`,

    vocabulary: `Таърифи возеҳ, 3 мисоли истифода ва тарҷума ба тоҷикӣ барои калимаи: [WORD] пешниҳод кунед. Ба ин тартиб формат кунед:\nТаъриф: [таърифи возеҳ]\nМисолҳо:\n1. [мисол 1]\n2. [мисол 2]\n3. [мисол 3]\nТарҷума: [тарҷума]`,
    grammar: `Қоидаи грамматикиро барои: [TOPIC] шарҳ диҳед. 2 мисоли оддӣ ва 2 мисоли мураккаб пешниҳод кунед. Ба ин тартиб формат кунед:\nҚоида: [шарҳи возеҳ]\nМисолҳои оддӣ:\n1. [мисол 1]\n2. [мисол 2]\nМисолҳои мураккаб:\n1. [мисол 1]\n2. [мисол 2]`,
    dialogue: `Муколамаи табиӣ аз 6-8 сатр дар бораи [TOPIC] байни ду нафар эҷод кунед. Ҳар як сатрро ба ин тартиб формат кунед:\nA: [сатр 1]\nB: [сатр 2]`,
    translation: `Матни зеринро ба забони тоҷикӣ тарҷума кунед, маънои аслӣ ва ибораҳои табииро нигоҳ доред: [TEXT]`,
    correction: `Матн барои ислоҳ: [TEXT]`,

    topicExplanation: `Мавзӯи грамматикии "[TOPIC]" -ро барои омӯзандаи сатҳи миёна шарҳ диҳед. Шарҳро мухтасар (3-5 ҷумла) нигоҳ доред. Ҷавоби шумо БОЯД бо забони тоҷикӣ бошад.`,
   grammarLesson: `Ҳамчун репетитори дӯстона ва рӯҳбаландкунандаи забони англисӣ амал кунед. 
      Дар мавзӯи грамматикии "[TOPIC]" дарси муфассал ва фаҳмо таҳия кунед.
      Сатҳи корбар: [LEVEL].
      Дарс бояд бо забони [LANG_NAME] бошад.
      Қоидаи асосиро шарҳ диҳед, 3-5 мисоли возеҳ пешниҳод кунед, аз ҷумла истифодаи онҳо дар контекстҳои гуногун, ва хатогиҳои маъмулиро, ки бояд пешгирӣ карда шаванд, муфассал шарҳ диҳед.
      Дарсро мутамарказ, ҷолиб ва иттилоотӣ нигоҳ доред. Барои форматкунӣ Markdown-ро истифода баред, аз ҷумла сарлавҳаҳо ва рӯйхатҳо барои хониши беҳтар.`,
    grammarTest: `Дар мавзӯи "[TOPIC]" санҷиши грамматикӣ бо забони [LANG_NAME] таҳия кунед.
      Конфигуратсия:
      - Шумораи саволҳо: [COUNT]
      - Сатҳ: [LEVEL]
      - Забон: [LANG_NAME]

      Тамоми санҷиш, аз ҷумла саволҳо ва имконоти ҷавоб, БОЯД бо забони [LANG_NAME] бошад.
      Санҷишро ҳамчун объекти JSON бо як калиди "questions" баргардонед.
      "questions" бояд массиви объектҳо бошад. Ҳар як объект бояд дорои:
      1. "type": "multiple-choice" ё "fill-in-the-blank".
      2. "question": Матн савол. Барои "fill-in-the-blank" барои ишора ба фосилаи холӣ "{...}" -ро истифода баред.
      3. "options": Массиви сатрҳо барои интихоби ҷавобҳо (танҳо барои multiple-choice).
      4. "answer": Ҷавоби дуруст.
      5. "explanation": Шарҳи мухтасари ҷавоби дуруст.
      
      ТАНҲО объекти JSON-ро баргардонед.`,
    testGeneration: `Имтиҳонро бо забони [LANG_NAME] барои таҳия кунед.
      Конфигуратсия:
      - Намуди санҷиш: [TYPE] (vocabulary, grammar, mixed)
      - Шумораи саволҳо: [COUNT]
      - Сатҳ: [LEVEL]
      [RECENT_WORDS]
      [LEARNING_TOPICS]

      Тамоми санҷиш, аз ҷумла саволҳо ва имконоти ҷавоб, БОЯД бо забони [LANG_NAME] бошад.
      Санҷишро ҳамчун объекти JSON бо як калиди "questions" баргардонед.
      "questions" бояд массиви объектҳо бошад. Ҳар як объект бояд дорои:
      1. "type": "multiple-choice" ё "fill-in-the-blank".
      2. "question": Матн савол. Барои "fill-in-the-blank" барои ишора ба фосилаи холӣ "{...}" -ро истифода баред.
      3. "options": Массиви сатрҳо барои интихоби ҷавобҳо (танҳо барои multiple-choice).
      4. "answer": Ҷавоби дуруст.
      5. "explanation": Шарҳи мухтасари ҷавоби дуруст.
      
      ТАНҲО объекти JSON-ро баргардонед.`,
    wordGeneration: `[COUNT] калимаҳои англисиро, ки ба мавзӯи "[TOPIC]" алоқаманданд, таҳия кунед. 
    Барои ҳар як калима, тарҷума ба тоҷикӣ, қисми нутқ (исм, феъл, сифат, зарф, ибора) ва мисоли ҷумларо пешниҳод кунед.
    Натиҷаро ҳамчун объекти JSON бо як калиди "words", ки массиви объектҳо мебошад, баргардонед.
    Ҳар як объект дар массив бояд дорои калидҳои зерин бошад: "word", "translation", "partOfSpeech", "example".
    ТАНҲО объекти JSON-ро баргардонед.`,
    analyzeProgress: `Пешрафти омӯзиши корбарро дар асоси маълумоти зерин таҳлил кунед: [DATA]. 
      Хулосаи мухтасари ҷиҳатҳои қавӣ ва заифи онҳоро пешниҳод кунед ва 2-3 маслиҳати амалӣ барои беҳбудӣ диҳед. 
      Ҷавоби шумо БОЯД бо забони тоҷикӣ бошад.`,
    sendMessage: `Шумо шарики AI барои машқи забони англиси ҳастед. 
      Мавзӯи сӯҳбати ҳозираи корбар: "[TOPIC]".
      Паёми корбар: "[MESSAGE]".
      Таърихи сӯҳбат: [HISTORY].
      Ба таври табиӣ ва ҳамаҷониба (3-5 ҷумла) ҷавоб диҳед, сӯҳбатро идома диҳед. 
      Ҳамеша саволи кушода диҳед, то муколамаи минбаъдаро ташвиқ кунед. 
      Ҷавоби шумо БОЯД бо забони тоҷикӣ бошад.`,
    personalizedTips: `Дар асоси маълумоти омӯзиши корбар: [DATA], 3 маслиҳати фардӣ диҳед, то ба онҳо дар такмил додани забони англисӣ кӯмак расонед. 
      Ба маслиҳатҳои амалӣ тамаркуз кунед. Ҷавоби шумо БОЯД бо забони тоҷикӣ бошад.`,
    analyzeComprehensiveProgress: `Таҳлили муфассали пешрафтро, ки ҳамаи соҳаҳои омӯзишро мепайвандад, дар асоси маълумоти зерин пешниҳод кунед: [DATA].
      Пайвастагиҳои байни соҳаҳоро таъкид кунед ва 3 пешниҳоди мушаххас барои беҳбудӣ диҳед.
      Ҷавоби шумо БОЯД бо [LANG_NAME].`,
    updateProfile: `Маълумоти фаъолияти омӯзиширо таҳлил кунед ва профили корбарро бо ҷиҳатҳои қавӣ, заиф, сабкҳои омӯзиши афзалиятнок ва манфиатҳо навсозӣ кунед. Дар формати JSON баргардонед.
    
    Маълумоти фаъолият: [DATA]`,
    EXAM_GENERATION_PROMPT: `
Имтиҳони забони англисиро дар сатҳи [LEVEL] дар формати JSON таҳия кунед.
Намуд: [TYPE] (test/essay/listening/conversation).
Мавзӯъҳо: [TOPICS].
Забон: tg.

Правила:
1. Барои "test": 10 савол, ҳар кадом бо 4 вариант, 1 ҷавоби дуруст.
2. Барои "essay": 3 мавзӯъ бо маҳдудияти калима (100-200 калима).
3. Барои "listening": 5 фраз для транскрипции (используй простую лексику).
4. Барои "conversation": 5 диалоговых сценариев (например, "Заказ еды в кафе").

Формати баромад (JSON):
{
  "title": "Номи имтиҳон",
  "type": "[TYPE]",
  "questions": [
    {
      "type": "test",
      "question": "...",
      "options": ["...", "..."],
      "correctAnswer": "...",
      "wordLimit": 150
    }
  ]
}`,
    ESSAY_CHECK_PROMPT: `
Ин эссеи англисиро таҳлил кунед ва фикру мулоҳизаҳоро дар формати JSON пешниҳод кунед:
Мавзӯъ: "[TOPIC]"
Матн: "[TEXT]"

Формати баромад:
{
  "score": 0-100,
  "feedback": "...",
  "grammarErrors": [{ "error": "...", "correction": "..." }],
  "vocabularySuggestions": ["..."]
}`
  }
};
