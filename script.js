console.log("script.js started"); // Добавлено для отладки

const eventBus = {
  events: {},
  
  subscribe(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  },
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
};

// Инициализация appData в самом начале скрипта
let appData = {
    words: [],
    practiceSessions: [],
    grammarTopics: [],
    notes: [],
    settings: [], // Начинаем с пустого массива
    conversationHistory: [],
};

// DOM элементы
let elements;

// Объекты графиков
let goalChart, vocabChart, practiceChart;

// Текущая дата для календаря
let currentCalendarDate = new Date();

// ID текущей заметки для просмотра/редактирования
let currentNoteId = null;

// Цветовые схемы для заметок
const noteBackgrounds = [
  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
  'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
  'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
  'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
  'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
];

const darkNoteBackgrounds = [
  'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)',
  'linear-gradient(135deg, #000428 0%, #004e92 100%)',
  'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
  'linear-gradient(135deg, #4776e6 0%, #8e54e9 100%)'
];

// Соотношения сторон для заметок
const noteAspectRatios = [
  { name: '1:1', value: '1/1' },
  { name: '3:4', value: '3/4' },
  { name: '4:3', value: '4/3' },
  { name: '16:9', value: '16/9' },
  { name: '9:16', value: '9/16' }
];

// Инициализация Select2
function initSelect2() {
  $('.select2').select2({
    width: '100%',
    minimumResultsForSearch: Infinity
  });
}

let db; // Глобальная переменная для базы данных

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('EnglishTrackerDB', 2); // Увеличена версия для экзаменов

        request.onupgradeneeded = function(event) {
            db = event.target.result;
            // Создаем хранилища объектов, если они еще не существуют
            if (!db.objectStoreNames.contains('words')) {
                db.createObjectStore('words', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('practiceSessions')) {
                db.createObjectStore('practiceSessions', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('grammarTopics')) {
                db.createObjectStore('grammarTopics', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('notes')) {
                db.createObjectStore('notes', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('conversationHistory')) {
                db.createObjectStore('conversationHistory', { keyPath: 'id' });
            }
            console.log("IndexedDB upgrade complete.");
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            console.log("IndexedDB opened successfully.");
            resolve();
        };

        request.onerror = function(event) {
            console.error("IndexedDB error:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

async function loadData() {
    await initDB(); // Убедиться, что БД готова

    const defaultSettings = {
        id: 'main', // Ключ для объекта настроек
        darkMode: false,
        notifications: true,
        reminderTime: "19:00",
        dailyWordsGoal: 5,
        dailyPracticeGoal: 30,
        accentColor: "#4285f4",
        lastUpdated: new Date().toISOString(),
        aiAssistanceLevel: "balanced",
        aiFeedbackDetail: "detailed",
        language: "ru",
        defaultCurrentLevel: "A1",
        defaultTargetLevel: "B2",
        learningProfile: {
            strengths: [],
            weaknesses: [],
            preferredLearningStyles: [],
            interests: [],
            lastActiveTimes: {}
        }
    };

    // --- Загрузка Settings ---
    // Используем Promise для settingsRequest, чтобы дождаться его завершения
    await new Promise((resolve, reject) => {
        const settingsTransaction = db.transaction(['settings'], 'readwrite');
        const settingsStore = settingsTransaction.objectStore('settings');
        const settingsRequest = settingsStore.get('main'); // Получаем объект по ключу 'main'

        settingsRequest.onsuccess = async function(event) {
            const loadedSettings = event.target.result;
            if (loadedSettings) {
                appData.settings = [{ ...defaultSettings, ...loadedSettings }];
                console.log("Settings loaded from DB:", appData.settings[0]);
            } else {
                appData.settings = [defaultSettings];
                console.log("Default settings used and will be saved.");
                try {
                    await updateData('settings', appData.settings[0]);
                } catch (err) {
                    console.error("Failed to save default settings:", err);
                }
            }
            resolve();
        };

        settingsRequest.onerror = function(event) {
            console.error("Error loading settings:", event.target.error);
            appData.settings = [defaultSettings]; // В случае ошибки всё равно используем дефолтные
            reject(event.target.error);
        };
    });

    // --- Загрузка других данных (words, practiceSessions и т.д.) ---
    const otherStores = ['words', 'practiceSessions', 'grammarTopics', 'notes', 'conversationHistory'];
    const loadPromises = otherStores.map(storeName => 
        getAllData(storeName).then(data => {
            appData[storeName] = data;
        }).catch(err => {
            console.error(`Failed to load ${storeName}:`, err);
            appData[storeName] = []; // Инициализируем пустым массивом в случае ошибки
        })
    );

    await Promise.all(loadPromises); // Ждем загрузки всех остальных данных

    // Применяем настройки после их загрузки/инициализации
    applyThemeSettings();
    updateUI();
    initSelect2(); // Предполагается, что эта функция существует

    console.log("appData after loadData:", appData); // Добавлено для отладки
}

// Функции для работы с IndexedDB
function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`Error getting data from ${storeName}:`, event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function addData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Error adding data to ${storeName}:`, event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Предполагаемая улучшенная версия updateData (фрагмент)
// Убедитесь, что эта функция использует правильные методы IndexedDB (put для обновления/вставки)
async function updateData(storeName, dataObject) {
    // Предполагаем, что dataObject имеет уникальный ключ 'id'
    if (!db) {
        console.error("Database not initialized before updateData call.");
        // Или попытаться инициализировать снова, но лучше избегать этого
        await initDB();
        if (!db) {
             console.error("Failed to initialize database.");
             return Promise.reject(new Error("Database not available"));
        }
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const objectStore = transaction.objectStore(storeName);

    // Используем put, который обновляет, если ключ существует, или вставляет новый
    console.log(`Updating ${storeName} with data:`, dataObject);
    const request = objectStore.put(dataObject);

    return new Promise((resolve, reject) => {
        request.onsuccess = function(event) {
            console.log(`Data updated in ${storeName}:`, dataObject);
            resolve(event.target.result); // Может вернуть ключ, если это было добавление
        };

        request.onerror = function(event) {
            console.error(`Error updating data in ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

function deleteData(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Error deleting data from ${storeName}:`, event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}


// Сохранение данных в IndexedDB
async function saveData() {
    try {
    const stores = ['words', 'practiceSessions', 'grammarTopics', 'notes', 'settings', 'conversationHistory'];
        const transaction = db.transaction(stores, 'readwrite');

        transaction.onerror = (event) => {
            console.error("Error saving data:", event.target.errorCode);
        };

        for (const storeName of stores) {
            const store = transaction.objectStore(storeName);
            store.clear();
            const data = appData[storeName];
            if (Array.isArray(data)) {
                data.forEach(item => {
                    store.put(item);
                });
            }
        }

        await new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        });

    } catch (error) {
        console.error("Failed to save data:", error);
    }
}

// Применение настроек темы
function applyThemeSettings() {
  // Темная тема
  if (appData.settings[0].darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
    elements.themeToggle.checked = true;
    elements.themeToggleSettings.checked = true;
  } else {
    document.documentElement.removeAttribute('data-theme');
    elements.themeToggle.checked = false;
    elements.themeToggleSettings.checked = false;
  }
  
  // Акцентный цвет
  if (appData.settings[0].accentColor) {
    document.documentElement.style.setProperty('--primary-color', appData.settings[0].accentColor);
    elements.accentColor.value = appData.settings[0].accentColor;
  }
  
  // Настройки AI
  if (appData.settings[0].aiAssistanceLevel) {
    elements.aiAssistanceLevel.value = appData.settings[0].aiAssistanceLevel;
  }
  
  if (appData.settings[0].language) {
    console.log("Applying language from settings:", appData.settings[0].language);
    // Находим все радиокнопки с именем "language" внутри languageSelection
    const languageRadios = elements.language.querySelectorAll('input[name="language"]');
    languageRadios.forEach(radio => {
      if (radio.value === appData.settings[0].language) {
        radio.checked = true;
      } else {
        radio.checked = false; // Убедимся, что другие не выбраны
      }
    });
    console.log("Language set to:", appData.settings[0].language);
  }
  
  if (appData.settings[0].aiFeedbackDetail) {
    elements.aiFeedbackDetail.value = appData.settings[0].aiFeedbackDetail;
  }
  
  // Настройки профиля обучения
  if (appData.settings[0].defaultCurrentLevel) {
    elements.defaultCurrentLevel.value = appData.settings[0].defaultCurrentLevel;
  }
  
  if (appData.settings[0].defaultTargetLevel) {
    elements.defaultTargetLevel.value = appData.settings[0].defaultTargetLevel;
  }
}

// Обновление интерфейса
function updateUI() {
  // Обновляем выбранный язык в настройках
  if (appData.settings[0]?.language) {
      // Находим все радиокнопки с именем "language" внутри languageSelection
      const languageRadios = elements.language.querySelectorAll('input[name="language"]');
      languageRadios.forEach(radio => {
        if (radio.value === appData.settings[0].language) {
          radio.checked = true;
        } else {
          radio.checked = false; // Убедимся, что другие не выбраны
        }
      });
  }
  updateStatsCards();
  updateVocabularyList();
  updatePracticeCalendar();
  updateSessionsList();
  updateNotesGrid();
  updateCharts();
  updateGrammarTopicsList();
  renderFocusTasks();
}

// New Focus Tasks functions
let countdownInterval;

function renderFocusTasks() {
  const dayTasksList = document.querySelector('#day-tasks .tasks-list');
  const eveningTasksList = document.querySelector('#evening-tasks .tasks-list');

  if (!dayTasksList || !eveningTasksList) return;

  const now = new Date();
  const upcomingUncompletedSessions = appData.practiceSessions
    .filter(session => {
      const sessionDateTime = new Date(`${session.date}T${session.time}`);
      return !session.completed && sessionDateTime >= now;
    })
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  dayTasksList.innerHTML = '';
  eveningTasksList.innerHTML = '';

  upcomingUncompletedSessions.forEach(session => {
    const [hour] = session.time.split(':').map(Number);
    const listItem = document.createElement('li');
    listItem.dataset.sessionId = session.id;
    listItem.dataset.dateTime = `${session.date}T${session.time}`;

    listItem.innerHTML = `
      <div class="task-item-checkbox">
        <input type="checkbox" id="focus-task-${session.id}" data-session-id="${session.id}" ${session.completed ? 'checked' : ''}>
        <label for="focus-task-${session.id}" class="custom-checkbox-label"></label>
      </div>
      <div class="task-item-details">
        <div class="task-item-header">
          <span class="task-item-activity">${capitalize(session.customActivity || session.activityType)}</span>
          <span class="task-item-countdown"></span>
        </div>
        <p class="task-item-description">${session.notes || 'No description.'}</p>
      </div>
    `;

    if (hour >= 7 && hour < 18) {
      dayTasksList.appendChild(listItem);
    } else {
      eveningTasksList.appendChild(listItem);
    }
  });

  if (dayTasksList.children.length === 0) {
    dayTasksList.innerHTML = '<li>No upcoming day tasks.</li>';
  }
  if (eveningTasksList.children.length === 0) {
    eveningTasksList.innerHTML = '<li>No upcoming evening tasks.</li>';
  }

  updateCountdowns();
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdowns, 60000); // Update every minute

  // Добавляем обработчики для новых чекбоксов
  document.querySelectorAll('.task-item-checkbox input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const sessionId = e.target.dataset.sessionId;
      const isCompleted = e.target.checked;
      const session = appData.practiceSessions.find(s => s.id === sessionId);
      if (session) {
        session.completed = isCompleted;
        updateData('practiceSessions', session).then(() => {
          // Обновляем UI, чтобы отразить изменения (например, в таблице сессий)
          updateSessionsList(); 
        });
      }
    });
  });
}

function updateCountdowns() {
  const taskElements = document.querySelectorAll('#focus-tasks-container .tasks-list li[data-date-time]');
  const now = new Date();

  taskElements.forEach(taskEl => {
    const countdownEl = taskEl.querySelector('.task-item-countdown');
    const dateTimeStr = taskEl.dataset.dateTime;
    const targetDate = new Date(dateTimeStr);
    const diff = targetDate - now;

    if (diff <= 0) {
      countdownEl.textContent = 'Started';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let countdownText = 'Starts in: ';
    if (d > 0) countdownText += `${d}d `;
    if (h > 0) countdownText += `${h}h `;
    countdownText += `${m}m`;

    countdownEl.textContent = countdownText;
  });
}

// Показать модальное окно с деталями задачи
function showTaskDetailsModal(sessionId) {
  const session = appData.practiceSessions.find(s => s.id === sessionId);
  if (!session) return;

  const modal = document.createElement('div');
  modal.classList.add('modal', 'task-details-modal');

  const targetDate = new Date(`${session.date}T${session.time}`);
  const now = new Date();
  const diff = targetDate - now;

  let countdownText = 'Task has started.';
  if (diff > 0) {
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    countdownText = 'Starts in: ';
    if (d > 0) countdownText += `${d}d `;
    if (h > 0) countdownText += `${h}h `;
    countdownText += `${m}m`;
  }

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${capitalize(session.customActivity || session.activityType)}</h2>
      <div class="task-details-content">
        <p><strong>Date:</strong> ${formatDate(session.date)}</p>
        <p><strong>Time:</strong> ${formatTime(session.time)}</p>
        <p><strong>Duration:</strong> ${session.duration} minutes</p>
        <p><strong>Description:</strong></p>
        <p>${session.notes || 'No description provided.'}</p>
        <hr>
        <p class="task-countdown"><strong>Time remaining:</strong> ${countdownText}</p>
      </div>
      <div class="modal-actions">
        <button class="secondary-btn close-modal">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'block';

  const closeModal = () => {
      if (document.body.contains(modal)) {
          modal.remove();
      }
  };

  modal.querySelector('.close').addEventListener('click', closeModal);
  modal.querySelector('.close-modal').addEventListener('click', closeModal);
  
  const windowClickListener = (e) => {
    if (e.target === modal) {
      closeModal();
      window.removeEventListener('click', windowClickListener);
    }
  };
  window.addEventListener('click', windowClickListener);
}


// --- Новые функции для раздела "Grammar Practice" ---

// Обновление списка грамматических тем
function updateGrammarTopicsList() {
  const searchTerm = elements.grammarSearch.value.toLowerCase();
  const levelFilter = elements.grammarLevel.value;
  const categoryFilter = elements.grammarCategory.value;
  
  let filteredTopics = [...appData.grammarTopics];
  
  // Применение фильтров
  if (searchTerm) {
    filteredTopics = filteredTopics.filter(topic => 
      topic.title.toLowerCase().includes(searchTerm) ||
      (topic.description && topic.description.toLowerCase().includes(searchTerm)));
  }
  
  if (levelFilter !== 'all') {
    filteredTopics = filteredTopics.filter(topic => topic.level === levelFilter);
  }
  
  if (categoryFilter !== 'all') {
    filteredTopics = filteredTopics.filter(topic => topic.category === categoryFilter);
  }
  
  // Сортировка по статусу и дате добавления
  const statusOrder = { 'mastered': 1, 'learning': 2, 'new': 3 };
  filteredTopics.sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.dateAdded) - new Date(a.dateAdded);
  });
  
  // Очистка списка
  elements.grammarTopicsList.innerHTML = '';
  
  // Добавление тем в список
  if (filteredTopics.length === 0) {
    elements.grammarTopicsList.innerHTML = `
      <div class="empty-table">No grammar topics found. Add your first topic!</div>
    `;
    return;
  }
  
  filteredTopics.forEach(topic => {
    const topicElement = document.createElement('div');
    topicElement.className = 'grammar-topic';
    topicElement.innerHTML = `
      <div class="topic-title">${topic.title}</div>
      <div class="topic-meta">
        <span class="topic-level ${topic.level.toLowerCase()}">${topic.level}</span>
        <span class="topic-category">${capitalize(topic.category)}</span>
        <span class="topic-status ${topic.status}">${capitalize(topic.status)}</span>
      </div>
      <div class="topic-actions">
        <button class="edit-btn" data-id="${topic.id}"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" data-id="${topic.id}"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    
    topicElement.addEventListener('click', () => {
      viewGrammarTopic(topic.id);
    });
    
    elements.grammarTopicsList.appendChild(topicElement);
  });
  
  // Добавление обработчиков для кнопок
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const topicId = e.currentTarget.getAttribute('data-id');
      editGrammarTopic(topicId);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const topicId = e.currentTarget.getAttribute('data-id');
      deleteGrammarTopic(topicId);
    });
  });
}

// --- Новые функции для раздела "Grammar Practice" ---

// --- Новые функции для раздела "Grammar Practice" ---

// Глобальная переменная для хранения текущего теста
let currentGrammarTest = null;
let currentGrammarTopicId = null;

// Показать урок по грамматике
async function showGrammarLesson(topicId, regenerate = false) {
  const topic = appData.grammarTopics.find(t => t.id === topicId);
  if (!topic) return;

  currentGrammarTopicId = topicId; // Сохраняем ID текущей темы

  elements.grammarContentArea.innerHTML = `
    <div class="lesson-header">
      <h2>${topic.title} Lesson</h2>
      <div class="lesson-actions">
        <button id="regenerateLessonBtn" class="action-btn secondary-btn">
          <i class="fas fa-sync-alt"></i> Regenerate Lesson
        </button>
        <button id="startTestBtn" class="action-btn primary-btn">
          <i class="fas fa-clipboard-question"></i> Start Test
        </button>
      </div>
    </div>
    <div id="lessonContent" class="lesson-content">
      <div class="loader-container">
        <div class="loader"></div>
        <p>Generating lesson...</p>
      </div>
    </div>
  `;

  const lessonContentDiv = elements.grammarContentArea.querySelector('#lessonContent');

  // Проверяем, существует ли уже контент урока и не требуется ли принудительная регенерация
  if (topic.lessonContent && !regenerate) {
    console.log("Отображение кэшированного контента урока для темы:", topic.title);
    lessonContentDiv.innerHTML = marked.parse(topic.lessonContent);
  } else {
    // Генерируем новый контент урока
    try {
      const lang = appData.settings[0].language || 'en';
      const langName = lang === 'en' ? 'English' : 'Russian';
      const contents = getPrompt('grammarLesson', { TOPIC: topic.title, LEVEL: appData.settings[0].defaultCurrentLevel, LANG_NAME: langName });
      
      const response = await callGeminiAPI(contents, 'gemini-1.5-flash-latest', false); // Всегда генерируем, если regenerate = true или контента нет
      
      lessonContentDiv.innerHTML = marked.parse(response);

      // Сохраняем только что сгенерированный урок в теме
      topic.lessonContent = response;
      await updateData('grammarTopics', topic);

    } catch (error) {
      lessonContentDiv.innerHTML = `<p class="error">Не удалось сгенерировать урок. ${error.message}</p>`;
      console.error("Ошибка при генерации урока по грамматике:", error);
    }
  }

  // Добавляем обработчики кнопок
  document.getElementById('regenerateLessonBtn').addEventListener('click', () => {
    showGrammarLesson(topicId, true); // Регенерируем урок
  });
  document.getElementById('startTestBtn').addEventListener('click', () => {
    // Открываем модальное окно конфигурации теста
    elements.testConfigTopicId.value = topicId; // Сохраняем topicId в скрытом поле
    elements.grammarTestConfigModal.style.display = 'block';
    // Инициализируем Select2 для нового элемента, если он еще не инициализирован
    if (!$(elements.testQuestionTypes).data('select2')) {
      initSelect2(); 
    }
  });
}

// Генерация теста по грамматике
async function generateGrammarTest(topicId, config = {}) {
  const topic = appData.grammarTopics.find(t => t.id === topicId);
  if (!topic) return;

  // Закрываем модальное окно конфигурации, если оно открыто
  elements.grammarTestConfigModal.style.display = 'none';

  elements.grammarContentArea.innerHTML = `
    <div class="test-header">
      <h2>${topic.title} Test</h2>
      <div class="test-actions">
        <button id="regenerateTestBtn" class="action-btn secondary-btn">
          <i class="fas fa-sync-alt"></i> Regenerate Test
        </button>
        <button id="submitTestBtn" class="action-btn primary-btn">
          <i class="fas fa-check-circle"></i> Finish Test
        </button>
      </div>
    </div>
    <div id="testContent" class="test-content">
      <div class="loader-container">
        <div class="loader"></div>
        <p>Generating test...</p>
      </div>
    </div>
  `;

  const testContentDiv = elements.grammarContentArea.querySelector('#testContent');
  try {
    const lang = appData.settings[0].language || 'en';
    const langName = lang === 'en' ? 'English' : 'Russian';

    // Используем параметры из config, если они предоставлены
    const questionCount = config.questionCount || 5; // По умолчанию 5 вопросов
    const questionTypes = config.questionTypes || ['multiple-choice', 'fill-in-the-blank']; // По умолчанию оба типа
    const difficulty = config.difficulty || appData.settings[0].defaultCurrentLevel; // По умолчанию текущий уровень

    const contents = getPrompt('grammarTest', { 
      TOPIC: topic.title, 
      LEVEL: difficulty, // Используем выбранный уровень сложности
      LANG_NAME: langName,
      QUESTION_COUNT: questionCount,
      QUESTION_TYPES: questionTypes.join(', ') // Передаем типы вопросов как строку
    });
    const response = await callGeminiAPI(contents, 'gemini-1.5-flash-latest', false); // Тесты не кэшируем

    // Парсим JSON из ответа
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    const jsonString = response.slice(jsonStart, jsonEnd);
    currentGrammarTest = JSON.parse(jsonString);

    if (!currentGrammarTest || !currentGrammarTest.questions || !Array.isArray(currentGrammarTest.questions)) {
      throw new Error("Invalid test format received from AI.");
    }

    renderGrammarTest(currentGrammarTest.questions, testContentDiv);

  } catch (error) {
    testContentDiv.innerHTML = `<p class="error">Could not generate test. ${error.message}</p>`;
    console.error("Error generating grammar test:", error);
  }

  // Добавляем обработчики кнопок
  document.getElementById('regenerateTestBtn').addEventListener('click', () => {
    // При регенерации используем те же параметры, что были выбраны
    const currentConfig = {
      questionCount: elements.testQuestionCount.value,
      questionTypes: Array.from(elements.testQuestionTypes.selectedOptions).map(option => option.value),
      difficulty: elements.testDifficulty.value
    };
    generateGrammarTest(topicId, currentConfig); // Регенерируем тест с текущими параметрами
  });
  document.getElementById('submitTestBtn').addEventListener('click', () => {
    submitGrammarTest();
  });
}

// Отображение теста
function renderGrammarTest(questions, container) {
  let html = '';
  questions.forEach((q, index) => {
    html += `
      <div class="question-card">
        <p class="question-text">${index + 1}. ${q.question}</p>
        <div class="options">
    `;
    if (q.type === 'multiple-choice' && q.options) {
      q.options.forEach((option, optIndex) => {
        html += `
          <label class="option-label">
            <input type="radio" name="question-${index}" value="${option}">
            <span>${option}</span>
          </label>
        `;
      });
    } else if (q.type === 'fill-in-the-blank') {
      html += `<input type="text" class="fill-in-blank-input" data-question-index="${index}" placeholder="Your answer">`;
    }
    html += `
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// Отправка теста и проверка ответов
function submitGrammarTest() {
  if (!currentGrammarTest || !currentGrammarTest.questions) {
    alert("No test to submit.");
    return;
  }

  let score = 0;
  const results = [];
  const questions = currentGrammarTest.questions;

  questions.forEach((q, index) => {
    let userAnswer = '';
    let isCorrect = false;

    if (q.type === 'multiple-choice') {
      const selectedOption = document.querySelector(`input[name="question-${index}"]:checked`);
      if (selectedOption) {
        userAnswer = selectedOption.value;
        isCorrect = (userAnswer === q.answer);
      }
    } else if (q.type === 'fill-in-the-blank') {
      const inputField = document.querySelector(`.fill-in-blank-input[data-question-index="${index}"]`);
      if (inputField) {
        userAnswer = inputField.value.trim();
        // Для fill-in-the-blank, проверяем на совпадение с ответом (без учета регистра)
        isCorrect = (userAnswer.toLowerCase() === q.answer.toLowerCase());
      }
    }

    if (isCorrect) {
      score++;
    }

    results.push({
      question: q.question,
      userAnswer: userAnswer,
      correctAnswer: q.answer,
      isCorrect: isCorrect,
      explanation: q.explanation || 'No explanation provided.'
    });
  });

  showTestResultsModal(score, questions.length, results);
}

// Показать модальное окно с результатами теста
function showTestResultsModal(score, totalQuestions, results) {
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.innerHTML = `
    <div class="modal-content large test-results-modal">
      <span class="close">&times;</span>
      <h2>Test Results</h2>
      <div class="results-summary">
        <p>You scored: <strong>${score} / ${totalQuestions}</strong></p>
        <p>Percentage: <strong>${((score / totalQuestions) * 100).toFixed(0)}%</strong></p>
      </div>
      <div class="results-details">
        ${results.map((res, index) => `
          <div class="result-item ${res.isCorrect ? 'correct' : 'incorrect'}">
            <p class="question-text"><strong>${index + 1}. Question:</strong> ${res.question}</p>
            <p class="your-answer"><strong>Your Answer:</strong> ${res.userAnswer || 'No answer'}</p>
            <p class="correct-answer"><strong>Correct Answer:</strong> ${res.correctAnswer}</p>
            <p class="explanation"><strong>Explanation:</strong> ${res.explanation}</p>
          </div>
        `).join('')}
      </div>
      <div class="modal-actions">
        <button class="primary-btn" onclick="this.closest('.modal').remove(); showGrammarLesson(currentGrammarTopicId);">Back to Lesson</button>
        <button class="secondary-btn" onclick="this.closest('.modal').remove(); generateGrammarTest(currentGrammarTopicId);">Retake Test</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'block';
    modal.querySelector('.close').addEventListener('click', () => {
        console.log('Close button clicked in practice calendar modal.');
        modal.remove();
    });
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Вспомогательные функции для грамматики
function viewGrammarTopic(topicId) {
  // При клике на тему сразу показываем урок в grammar-content-area
  showGrammarLesson(topicId);
}


function editGrammarTopic(topicId) {
  const topic = appData.grammarTopics.find(t => t.id === topicId);
  if (!topic) return;

  document.getElementById('grammarModalTitle').textContent = 'Edit Grammar Topic';
  document.getElementById('grammarTopicTitle').value = topic.title;
  document.getElementById('grammarTopicCategory').value = topic.category;
  document.getElementById('grammarTopicLevel').value = topic.level;
  document.getElementById('grammarTopicStatus').value = topic.status;

  let existingIdField = document.getElementById('grammarTopicId');
  if (existingIdField) existingIdField.remove();

  const idField = document.createElement('input');
  idField.type = 'hidden';
  idField.id = 'grammarTopicId';
  idField.value = topicId;
  document.getElementById('grammarTopicForm').appendChild(idField);

  document.getElementById('grammarTopicModal').style.display = 'block';
}

async function deleteGrammarTopic(topicId) {
  await deleteData('grammarTopics', topicId);
  appData.grammarTopics = appData.grammarTopics.filter(topic => topic.id !== topicId);
  updateUI();
}


// Обновление карточек статистики
function updateStatsCards() {
  const statsHTML = `
    <div class="stat-card">
      <h3>Current Streak</h3>
      <div class="stat-value">${calculateStreak().currentStreak} days</div>
      <div class="stat-change">
        <i class="fas fa-fire"></i> ${calculateStreak().streakChange}
      </div>
      <div class="stat-icon"><i class="fas fa-fire"></i></div>
    </div>
    
    <div class="stat-card">
      <h3>Words Learned</h3>
      <div class="stat-value">${appData.words.length}</div>
      <div class="stat-change">
        <i class="fas ${getWeeklyChangeIcon('words')}"></i> ${calculateWeeklyChange('words')}
      </div>
      <div class="stat-icon"><i class="fas fa-book-open"></i></div>
    </div>
    
    <div class="stat-card">
      <h3>Practice Hours</h3>
      <div class="stat-value">${(calculateTotalPracticeMinutes() / 60).toFixed(1)}</div>
      <div class="stat-change">
        <i class="fas ${getWeeklyChangeIcon('practice')}"></i> ${calculateWeeklyChange('practice')}
      </div>
      <div class="stat-icon"><i class="fas fa-clock"></i></div>
    </div>
    
    <div class="stat-card">
      <h3>Grammar Topics</h3>
      <div class="stat-value">${appData.grammarTopics.filter(t => t.status === 'mastered').length}/${appData.grammarTopics.length}</div>
      <div class="stat-change">
        <i class="fas ${getWeeklyChangeIcon('grammar')}"></i> ${calculateWeeklyChange('grammar')}
      </div>
      <div class="stat-icon"><i class="fas fa-pen-fancy"></i></div>
    </div>
  `;
  
  elements.statsContainer.innerHTML = statsHTML;
}

// Расчет текущей серии
function calculateStreak() {
  if (appData.practiceSessions.length === 0) {
    return { currentStreak: 0, streakChange: 'Start your streak!' };
  }
  
  // Получаем уникальные даты занятий
  const uniqueDates = [...new Set(appData.practiceSessions.map(s => s.date))].sort();
  
  // Расчет текущей серии
  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Проверяем сегодняшний день
  if (uniqueDates.includes(today)) {
    currentStreak = 1;
    // Проверяем предыдущие дни
    let checkDate = new Date(yesterday);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } 
  // Проверяем вчерашний день, если сегодня еще не было занятий
  else if (uniqueDates.includes(yesterdayStr)) {
    currentStreak = 1;
    // Проверяем предыдущие дни
    let checkDate = new Date(yesterday);
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  // Расчет максимальной серии
  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate = null;
  
  // Преобразуем строки дат в объекты Date для сортировки
  const dateObjects = uniqueDates.map(d => new Date(d)).sort((a, b) => a - b);
  
  for (const date of dateObjects) {
    if (prevDate) {
      const dayDiff = (date - prevDate) / (1000 * 60 * 60 * 24);
      if (dayDiff === 1) {
        tempStreak++;
      } else if (dayDiff > 1) {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 0;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = date;
  }
  
  maxStreak = Math.max(maxStreak, tempStreak);
  
  let streakChange;
  if (currentStreak === 0) {
    streakChange = 'Start your streak!';
  } else if (currentStreak > maxStreak) {
    streakChange = 'New record! 🎉';
  } else {
    streakChange = `Record: ${maxStreak} days`;
  }
  
  return { currentStreak, streakChange };
}

// Расчет общего времени практики в минутах
function calculateTotalPracticeMinutes() {
  return appData.practiceSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
}

// Расчет изменений за неделю
function calculateWeeklyChange(type) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  switch (type) {
    case 'words':
      const recentWords = appData.words.filter(word => 
        new Date(word.dateAdded) > oneWeekAgo
      ).length;
      return recentWords > 0 ? `+${recentWords} this week` : 'No new words';
      
    case 'practice':
      const recentMinutes = appData.practiceSessions
        .filter(session => new Date(session.date) > oneWeekAgo)
        .reduce((sum, session) => sum + (session.duration || 0), 0);
      const recentHours = (recentMinutes / 60).toFixed(1);
      return recentMinutes > 0 ? `+${recentHours}h this week` : 'No practice';
      
    case 'grammar':
      const recentTopics = appData.grammarTopics.filter(topic => 
        new Date(topic.dateAdded) > oneWeekAgo
      ).length;
      return recentTopics > 0 ? `+${recentTopics} this week` : 'No new topics';
      
    default:
      return '';
  }
}

// Получение иконки для изменения за неделю
function getWeeklyChangeIcon(type) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  switch (type) {
    case 'words':
      const hasNewWords = appData.words.some(word => new Date(word.dateAdded) > oneWeekAgo);
      return hasNewWords ? 'fa-arrow-up success' : 'fa-minus neutral';
      
    case 'practice':
      const hasPractice = appData.practiceSessions.some(session => new Date(session.date) > oneWeekAgo);
      return hasPractice ? 'fa-arrow-up success' : 'fa-minus neutral';
      
    case 'grammar':
      const hasNewTopics = appData.grammarTopics.some(topic => new Date(topic.dateAdded) > oneWeekAgo);
      return hasNewTopics ? 'fa-arrow-up success' : 'fa-minus neutral';
      
    default:
      return 'fa-minus neutral';
  }
}

// Функция для отображения контекстного меню выбора статуса
async function showMasteryContextMenu(wordId, x, y) {
  const word = appData.words.find(w => w.id === wordId);
  if (!word) return;

  // Удаляем любое существующее контекстное меню
  const existingMenu = document.getElementById('masteryContextMenu');
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement('div');
  menu.id = 'masteryContextMenu';
  menu.classList.add('context-menu');
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  const masteryOptions = ['new', 'learning', 'mastered'];

  masteryOptions.forEach(option => {
    const item = document.createElement('div');
    item.classList.add('context-menu-item');
    if (word.mastery === option) {
      item.classList.add('active');
    }
    item.textContent = capitalize(option);
    item.addEventListener('click', async () => {
      word.mastery = option;
      await updateData('words', word);
      updateUI(); // Just update the UI
      menu.remove();
    });
    menu.appendChild(item);
  });

  document.body.appendChild(menu);

  // Закрываем меню при клике вне его
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && e.target.id !== 'masteryContextMenu') {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  // Добавляем задержку, чтобы клик, открывший меню, не закрыл его сразу
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 100);
}

// Обновление списка слов
function updateVocabularyList() {
  const searchTerm = elements.vocabSearch.value.toLowerCase();
  const masteryFilter = elements.vocabFilter.value;
  const partOfSpeechFilter = elements.vocabPartOfSpeech.value;
  
  let filteredWords = [...appData.words];
  
  // Применение фильтров
  if (searchTerm) {
    filteredWords = filteredWords.filter(word => 
      word.word.toLowerCase().includes(searchTerm) ||
      word.translation.toLowerCase().includes(searchTerm) ||
      (word.example && word.example.toLowerCase().includes(searchTerm))
    );
  }
  
  if (masteryFilter !== 'all') {
    filteredWords = filteredWords.filter(word => word.mastery === masteryFilter);
  }
  
  if (partOfSpeechFilter !== 'all') {
    filteredWords = filteredWords.filter(word => word.partOfSpeech === partOfSpeechFilter);
  }
  
  // Сортировка: сначала Learning, потом New, потом Mastered, затем по дате добавления (новые сначала)
  const masteryOrder = { 'learning': 1, 'new': 2, 'mastered': 3 };
  filteredWords.sort((a, b) => {
    const orderDiff = masteryOrder[a.mastery] - masteryOrder[b.mastery];
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return new Date(b.dateAdded) - new Date(a.dateAdded);
  });
  
  // Очистка списка
  elements.vocabularyList.innerHTML = '';
  
  // Добавление слов в таблицу
  if (filteredWords.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="6" class="empty-table">No words found. Add your first word!</td>
    `;
    elements.vocabularyList.appendChild(row);
    return;
  }
  
  filteredWords.forEach(word => {
    const row = document.createElement('tr');
    row.setAttribute('data-id', word.id); // Добавляем data-id для строки
    row.innerHTML = `
      <td>${word.word}</td>
      <td>${word.translation}</td>
      <td>${capitalize(word.partOfSpeech)}</td>
      <td>${formatDate(word.dateAdded)}</td>
      <td class="mastery-${word.mastery}">${capitalize(word.mastery)}</td>
      <td class="actions">
        <button class="edit-btn" data-id="${word.id}"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" data-id="${word.id}"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
    elements.vocabularyList.appendChild(row);

    // Добавляем обработчик клика на всю строку для изменения статуса
    row.addEventListener('click', (e) => {
      // Проверяем, не был ли клик по кнопке (редактировать/удалить)
      if (!e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
        const wordId = e.currentTarget.getAttribute('data-id');
        showMasteryContextMenu(wordId, e.clientX, e.clientY);
      }
    });
  });
  
  // Добавление обработчиков событий для кнопок
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wordId = e.currentTarget.getAttribute('data-id');
      editWord(wordId);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wordId = e.currentTarget.getAttribute('data-id');
      deleteWord(wordId);
    });
  });
}

// Редактирование слова (открывает основное модальное окно слова)
function editWord(wordId) {
  const word = appData.words.find(w => w.id === wordId);
  if (!word) return;
  
  // Заполнение формы
  document.getElementById('word').value = word.word;
  document.getElementById('translation').value = word.translation;
  document.getElementById('partOfSpeech').value = word.partOfSpeech;
  document.getElementById('example').value = word.example || '';
  document.getElementById('mastery').value = word.mastery; // Устанавливаем текущий уровень владения
  
  // Изменение заголовка модального окна
  elements.wordModalTitle.textContent = 'Edit Word';
  
  // Добавление скрытого поля для ID
  const existingIdField = document.getElementById('wordId');
  if (existingIdField) existingIdField.remove();
  
  const idField = document.createElement('input');
  idField.type = 'hidden';
  idField.id = 'wordId';
  idField.value = wordId;
  elements.wordForm.appendChild(idField);
  
  // Открытие модального окна
  elements.wordModal.style.display = 'block';
}

// Удаление слова
async function deleteWord(wordId) {
  await deleteData('words', wordId);
  appData.words = appData.words.filter(word => word.id !== wordId);
  updateUI();
}

// Обновление календаря практики
function updatePracticeCalendar() {
  elements.calendarGrid.innerHTML = '';
  
  // Установка текущего месяца
  const month = currentCalendarDate.getMonth();
  const year = currentCalendarDate.getFullYear();
  elements.currentMonth.textContent = new Date(year, month).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Получение первого дня месяца и дня недели
  const firstDay = new Date(year, month, 1);
  const startingDay = firstDay.getDay(); // 0 (воскресенье) до 6 (суббота)
  
  // Получение количества дней в месяце
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Получение дат с практическими занятиями
  const practiceDates = [...new Set(appData.practiceSessions.map(s => s.date))];
  
  // Получение сегодняшней даты
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Добавление заголовков дней недели
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  daysOfWeek.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day', 'header');
    dayElement.textContent = day;
    elements.calendarGrid.appendChild(dayElement);
  });
  
  // Добавление пустых ячеек для дней предыдущего месяца
  for (let i = 0; i < startingDay; i++) {
    const emptyElement = document.createElement('div');
    emptyElement.classList.add('calendar-day', 'empty');
    elements.calendarGrid.appendChild(emptyElement);
  }
  
  // Добавление дней месяца
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    // Исправлено: Форматирование даты для избежания проблем с часовым поясом
    const dateStr = date.getFullYear() + '-' + 
                    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(date.getDate()).padStart(2, '0');
    console.log(`Calendar day ${day}: date object is ${date}, formatted dateStr is ${dateStr}`);
    
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day');
    dayElement.textContent = day;
    
    // Проверка, есть ли занятия в этот день
    if (practiceDates.includes(dateStr)) {
      dayElement.classList.add('has-practice');
      
      // Добавляем точки для каждого типа активности
      const dayActivities = appData.practiceSessions
        .filter(s => s.date === dateStr)
        .map(s => s.activityType);
      
      const uniqueActivities = [...new Set(dayActivities)];
      
      const eventsContainer = document.createElement('div');
      eventsContainer.classList.add('day-events');
      
      uniqueActivities.forEach(activity => {
        const dot = document.createElement('div');
        dot.classList.add('day-event-dot');
        dot.style.backgroundColor = getActivityColor(activity);
        eventsContainer.appendChild(dot);
      });
      
      dayElement.appendChild(eventsContainer);
    }
    
    // Проверка, является ли день сегодняшним
    if (date.getTime() === today.getTime()) {
      dayElement.classList.add('today');
    }
    
    // Обработчик клика
    dayElement.addEventListener('click', () => {
      document.querySelectorAll('.calendar-day').forEach(d => 
        d.classList.remove('selected')
      );
      dayElement.classList.add('selected');
      showDaySessions(dateStr);
    });
    
    elements.calendarGrid.appendChild(dayElement);
  }
}

// Получение цвета для типа активности
function getActivityColor(activityType) {
  const colors = {
    listening: '#4299e1',
    speaking: '#9f7aea',
    reading: '#48bb78',
    writing: '#ed8936',
    grammar: '#f56565',
    other: '#a0aec0'
  };
  
  return colors[activityType] || colors.other;
}

// Показ занятий за выбранный день
async function showDaySessions(date) {
    const sessions = appData.practiceSessions.filter(s => s.date === date);
    const modal = document.createElement('div');
    modal.classList.add('modal', 'day-sessions-modal');

    let sessionsListHTML = '';
    if (sessions.length === 0) {
        sessionsListHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No practice sessions scheduled for this day.</p>
            </div>
        `;
    } else {
        sessions.sort((a, b) => a.time.localeCompare(b.time)); // Сортировка по времени
        sessionsListHTML = sessions.map(session => `
            <div class="day-session-item" data-session-id="${session.id}">
                <div class="session-item-time">${formatTime(session.time)}</div>
                <div class="session-item-info">
                    <div class="session-item-activity" style="border-left-color: ${getActivityColor(session.activityType)}">
                        <strong>${capitalize(session.customActivity || session.activityType)}</strong> (${session.duration} min)
                    </div>
                    <div class="session-item-notes">${session.notes || 'No notes'}</div>
                </div>
                <div class="session-item-actions">
                    <button class="icon-btn edit-btn" data-id="${session.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn delete-btn" data-id="${session.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join('');
    }

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Sessions on ${formatDate(date)}</h2>
            <div class="day-sessions-content">
                ${sessionsListHTML}
            </div>
            <div class="modal-actions">
                <button class="primary-btn add-session-btn" data-date="${date}">
                    <i class="fas fa-plus"></i> Add Session for this Day
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    const closeModal = () => {
        if (document.body.contains(modal)) {
            modal.remove();
        }
    };

    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.querySelector('.add-session-btn').addEventListener('click', (e) => {
        const date = e.currentTarget.getAttribute('data-date');
        addPracticeSession(date);
        closeModal();
    });

    modal.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sessionId = e.currentTarget.getAttribute('data-id');
            editPracticeSession(sessionId);
            closeModal();
        });
    });

    modal.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sessionId = e.currentTarget.getAttribute('data-id');
            deletePracticeSession(sessionId);
            closeModal();
        });
    });

    const windowClickListener = (e) => {
        if (e.target === modal) {
            closeModal();
            window.removeEventListener('click', windowClickListener);
        }
    };
    window.addEventListener('click', windowClickListener);
}

// Добавление практического занятия на конкретную дату
function addPracticeSession(date) {
  console.log(`addPracticeSession called with date: ${date}`);
  elements.practiceModalTitle.textContent = 'Add Practice Session';
  elements.practiceDate.value = date;
  elements.practiceTime.value = '18:00';
  
  // Удаляем скрытое поле ID, если оно есть
  const existingIdField = document.getElementById('practiceId');
  if (existingIdField) existingIdField.remove();
  
  elements.practiceModal.style.display = 'block';
}

// Обновление списка запланированных сессий
function updateSessionsList() {
  elements.sessionsList.innerHTML = '';
  
  // Получаем будущие сессии (начиная с сегодняшнего дня)
  const today = new Date().toISOString().split('T')[0];
  const upcomingSessions = appData.practiceSessions
    .filter(session => session.date >= today)
    .sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  
  if (upcomingSessions.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="6" class="empty-table">No upcoming sessions. Schedule your first practice!</td>
    `;
    elements.sessionsList.appendChild(row);
    return;
  }
  
  upcomingSessions.forEach(session => {
    const row = document.createElement('tr');
    row.dataset.id = session.id; // Добавляем ID к строке
    row.innerHTML = `
      <td>${formatDate(session.date)}</td>
      <td>${formatTime(session.time)}</td>
      <td>${capitalize(session.activityType)}</td>
      <td>
        <label class="checkbox-container">
          <input type="checkbox" class="completed-checkbox" data-id="${session.id}" 
            ${session.completed ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
      </td>
      <td>
        <label class="checkbox-container">
          <input type="checkbox" class="ontime-checkbox" data-id="${session.id}" 
            ${session.onTime ? 'checked' : ''} ${!session.completed ? 'disabled' : ''}>
          <span class="checkmark"></span>
        </label>
      </td>
      <td class="actions">
        <button class="edit-btn" data-id="${session.id}"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" data-id="${session.id}"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
    elements.sessionsList.appendChild(row);

    // Добавляем обработчик клика на строку
    row.addEventListener('click', (e) => {
      // Срабатывает только если клик не по чекбоксу или кнопке
      if (!e.target.closest('input[type="checkbox"]') && !e.target.closest('.actions')) {
        const sessionId = row.dataset.id;
        showTaskDetailsModal(sessionId);
      }
    });
  });
  
  // Добавление обработчиков событий для чекбоксов
  document.querySelectorAll('.completed-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const sessionId = e.target.getAttribute('data-id');
      const completed = e.target.checked;
      updateSessionCompletion(sessionId, completed);
      
      // Включаем/выключаем чекбокс "On Time" в зависимости от состояния "Completed"
      const onTimeCheckbox = e.target.closest('tr').querySelector('.ontime-checkbox');
      onTimeCheckbox.disabled = !completed;
      if (!completed) {
        onTimeCheckbox.checked = false;
        updateSessionOnTime(sessionId, false);
      }
    });
  });
  
  document.querySelectorAll('.ontime-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const sessionId = e.target.getAttribute('data-id');
      const onTime = e.target.checked;
      updateSessionOnTime(sessionId, onTime);
    });
  });
  
  // Добавление обработчиков событий для кнопок
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sessionId = e.currentTarget.getAttribute('data-id');
      editPracticeSession(sessionId);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sessionId = e.currentTarget.getAttribute('data-id');
      deletePracticeSession(sessionId);
    });
  });
}

// Обновление статуса выполнения сессии
function updateSessionCompletion(sessionId, completed) {
  const session = appData.practiceSessions.find(s => s.id === sessionId);
  if (session) {
    session.completed = completed;
    if (!completed) {
      session.onTime = false;
    }
    updateData('practiceSessions', session);
  }
}

// Обновление статуса своевременности сессии
function updateSessionOnTime(sessionId, onTime) {
  const session = appData.practiceSessions.find(s => s.id === sessionId);
  if (session) {
    session.onTime = onTime;
    updateData('practiceSessions', session);
  }
}

// Редактирование практического занятия
function editPracticeSession(sessionId) {
  const session = appData.practiceSessions.find(s => s.id === sessionId);
  if (!session) return;
  
  // Заполнение формы
  elements.practiceDate.value = session.date;
  elements.practiceTime.value = session.time;
  elements.activityType.value = session.activityType;
  
  if (session.activityType === 'other' && session.customActivity) {
    elements.activityType.value = 'other';
    elements.customActivity.value = session.customActivity;
    elements.customActivity.style.display = 'block';
  }
  
  elements.duration.value = session.duration;
  document.getElementById('reminder').value = session.reminder || 'none';
  document.getElementById('practiceNotes').value = session.notes || '';
  
  // Изменение заголовка модального окна
  elements.practiceModalTitle.textContent = 'Edit Practice Session';
  
  // Добавление скрытого поля для ID
  const existingIdField = document.getElementById('practiceId');
  if (existingIdField) existingIdField.remove();
  
  const idField = document.createElement('input');
  idField.type = 'hidden';
  idField.id = 'practiceId';
  idField.value = sessionId;
  elements.practiceForm.appendChild(idField);
  
  // Открытие модального окна
  elements.practiceModal.style.display = 'block';
}

// Удаление практического занятия
async function deletePracticeSession(sessionId) {
  await deleteData('practiceSessions', sessionId);
  appData.practiceSessions = appData.practiceSessions.filter(session => session.id !== sessionId);
  updateUI();
}

// Обновление сетки заметок для masonry layout
function updateNotesGrid() {
  elements.notesGrid.innerHTML = '';

  if (appData.notes.length === 0) {
    elements.notesGrid.innerHTML = `
      <div class="empty-notes">
        <i class="fas fa-sticky-note"></i>
        <p>No notes yet. Create your first note!</p>
      </div>
    `;
    return;
  }

  // Сортируем заметки по дате изменения (новые сначала)
  const sortedNotes = [...appData.notes].sort((a, b) =>
    new Date(b.dateUpdated) - new Date(a.dateUpdated)
  );

  // Создаем карточки заметок
  sortedNotes.forEach((note, index) => {
    const bgIndex = note.bgIndex || index % noteBackgrounds.length;
    const aspectRatio = note.aspectRatio || noteAspectRatios[Math.floor(Math.random() * noteAspectRatios.length)].value;

    const noteCard = document.createElement('div');
    noteCard.classList.add('note-card');
    noteCard.setAttribute('data-id', note.id);
    noteCard.setAttribute('data-bg', bgIndex + 1);
    noteCard.style.aspectRatio = aspectRatio; // Применяем соотношение сторон

    if (appData.settings[0].darkMode) {
      noteCard.style.background = darkNoteBackgrounds[bgIndex];
    } else {
      noteCard.style.background = noteBackgrounds[bgIndex];
    }

    noteCard.innerHTML = `
      <div class="note-title">${note.title}</div>
      <div class="note-preview">${note.content.replace(/\n/g, '<br>')}</div>
      <div class="note-date">${formatDate(note.dateUpdated)}</div>
    `;

    noteCard.addEventListener('click', () => {
      viewNote(note.id);
    });

    elements.notesGrid.appendChild(noteCard);
    
    // Для masonry layout, нам нужно установить grid-row-end
    // Это будет сделано после того, как элемент будет в DOM и его размеры будут известны
    requestAnimationFrame(() => {
      const rowHeight = parseInt(window.getComputedStyle(elements.notesGrid).getPropertyValue('grid-auto-rows'));
      const rowGap = parseInt(window.getComputedStyle(elements.notesGrid).getPropertyValue('grid-row-gap'));
      const cardHeight = noteCard.offsetHeight;
      const rowSpan = Math.ceil((cardHeight + rowGap) / (rowHeight + rowGap));
      noteCard.style.gridRowEnd = `span ${rowSpan}`;
    });
  });
}

// Функция для пересчета высоты всех заметок (теперь она просто пересчитывает grid-row-end)
function resizeAllNotes() {
    const allNotes = elements.notesGrid.querySelectorAll('.note-card');
    const rowHeight = parseInt(window.getComputedStyle(elements.notesGrid).getPropertyValue('grid-auto-rows'));
    const rowGap = parseInt(window.getComputedStyle(elements.notesGrid).getPropertyValue('grid-row-gap'));

    allNotes.forEach(noteCard => {
        const cardHeight = noteCard.offsetHeight;
        const rowSpan = Math.ceil((cardHeight + rowGap) / (rowHeight + rowGap));
        noteCard.style.gridRowEnd = `span ${rowSpan}`;
    });
}

// Просмотр заметки
function viewNote(noteId) {
  const note = appData.notes.find(n => n.id === noteId);
  if (!note) return;
  
  currentNoteId = noteId;
  
  // Заполнение модального окна
  elements.noteViewTitle.textContent = note.title;
  elements.noteViewContent.innerHTML = note.content.replace(/\n/g, '<br>');
  
  // Установка обработчиков для кнопок
  elements.editNoteBtn.onclick = () => {
    elements.noteViewModal.style.display = 'none';
    editNote(noteId);
  };
  
  elements.deleteNoteBtn.onclick = () => {
    elements.noteViewModal.style.display = 'none';
    deleteNote(noteId);
  };
  
  // Открытие модального окна
  elements.noteViewModal.style.display = 'block';
}

// Редактирование заметки
function editNote(noteId) {
  const note = appData.notes.find(n => n.id === noteId);
  if (!note) return;
  
  // Заполнение формы
  elements.noteTitle.value = note.title;
  elements.noteContent.value = note.content;
  
  // Изменение заголовка модального окна
  elements.noteModalTitle.textContent = 'Edit Note';
  
  // Добавление скрытого поля для ID
  const existingIdField = document.getElementById('noteId');
  if (existingIdField) existingIdField.remove();
  
  const idField = document.createElement('input');
  idField.type = 'hidden';
  idField.id = 'noteId';
  idField.value = noteId;
  elements.noteForm.appendChild(idField);
  
  // Открытие модального окна
  elements.noteModal.style.display = 'block';
}

// Удаление заметки
async function deleteNote(noteId) {
  await deleteData('notes', noteId);
  appData.notes = appData.notes.filter(note => note.id !== noteId);
  updateUI();
}


async function getTopicExplanation(topic) {
    const lang = appData.settings[0].language || 'en';
    const langName = lang === 'en' ? 'English' : 'Russian';
    const replacements = {
        TOPIC: topic,
        LEVEL: appData.settings[0].defaultCurrentLevel || 'intermediate', // Используем уровень пользователя
        LANG_NAME: langName
    };
    const contents = getPrompt('topicExplanation', replacements);
    const response = await callGeminiAPI(contents, 'gemini-1.5-flash-latest');
    return marked.parse(response); // Парсим Markdown
}

function startPracticeSession(skill) {
  alert(`Starting practice session for: ${skill}`);
  // Здесь можно добавить логику для начала сессии практики
}

function showLearningResources(skill) {
  const resources = {
    vocabulary: [
      { name: "Oxford Learner's Dictionaries", url: "https://www.oxfordlearnersdictionaries.com/" },
      { name: "Vocabulary.com", url: "https://www.vocabulary.com/" }
    ],
    grammar: [
      { name: "English Grammar Guide", url: "https://www.ef.com/english-resources/english-grammar/" },
      { name: "Grammarly Handbook", url: "https://www.grammarly.com/handbook/" }
    ]
  };
  
  let resourcesHTML = `<h4>Recommended Resources:</h4><ul>`;
  
  const category = skill.split('-')[0];
  (resources[category] || []).forEach(resource => {
    resourcesHTML += `
      <li>
        <a href="${resource.url}" target="_blank" rel="noopener noreferrer">
          ${resource.name}
        </a>
      </li>
    `;
  });
  
  resourcesHTML += `</ul>`;
  
  document.getElementById("skillDetails").insertAdjacentHTML("beforeend", resourcesHTML);
}

// Обновление графиков
function updateCharts() {
  console.log("updateCharts called.");
  // Инициализируем графики с периодом "week" по умолчанию
  updateGoalChart('week');
  updateVocabChart('week');
  updatePracticeChart('week');
}

// Обновление графика выполнения целей
function updateGoalChart(period = 'week') {
  if (goalChart) {
    goalChart.destroy();
  }
  const ctx = elements.goalChart.getContext('2d');
  if (!appData.settings || appData.settings.length === 0) {
    ctx.font = "16px Roboto";
    ctx.fillStyle = "grey";
    ctx.textAlign = "center";
    ctx.fillText("Настройки не загружены.", elements.goalChart.width / 2, elements.goalChart.height / 2);
    return;
  }

  const dailyWordsGoal = appData.settings[0].dailyWordsGoal || 5;
  const dailyPracticeGoal = appData.settings[0].dailyPracticeGoal || 30;

  const dates = [];
  const actualWords = [];
  const targetWords = [];
  const actualPracticeMinutes = [];
  const targetPracticeMinutes = [];

  const getDateOnly = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const todayOnly = getDateOnly(new Date());

  let numPeriods = 7; // По умолчанию неделя
  let dateFormatter = formatShortDate;

  if (period === 'month') {
    numPeriods = 30;
    dateFormatter = formatShortDate;
  } else if (period === 'day') {
    numPeriods = 1;
    // Для "дня" мы не будем использовать часовые данные, а только дневные
    dateFormatter = formatShortDate; 
  }

  for (let i = numPeriods - 1; i >= 0; i--) {
    const date = new Date(todayOnly);
    if (period === 'day') {
      // Для "дня" показываем только текущий день
      dates.push(dateFormatter(date)); 
    } else {
      date.setDate(todayOnly.getDate() - i);
      dates.push(dateFormatter(date));
    }
    
    const dateStr = date.toISOString().split('T')[0];

    // Actual words added
    const wordsAddedToday = appData.words.filter(word =>
      getDateOnly(word.dateAdded).getTime() === getDateOnly(date).getTime()
    ).length;
    actualWords.push(wordsAddedToday);
    targetWords.push(dailyWordsGoal); // Goal is constant

    // Actual practice minutes
    const practiceMinutesToday = appData.practiceSessions
      .filter(session => getDateOnly(session.date).getTime() === getDateOnly(date).getTime())
      .reduce((sum, session) => sum + (session.duration || 0), 0);
    actualPracticeMinutes.push(practiceMinutesToday);
    targetPracticeMinutes.push(dailyPracticeGoal); // Goal is constant
  }

  goalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Actual Words',
          data: actualWords,
          borderColor: '#4299e1', // Blue
          backgroundColor: 'rgba(66, 153, 225, 0.2)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y-words',
          pointBackgroundColor: '#4299e1',
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Target Words',
          data: targetWords,
          borderColor: '#4299e1', // Blue
          borderDash: [5, 5], // Dashed line for target
          backgroundColor: 'transparent',
          pointRadius: 0, // No points for target line
          tension: 0.3,
          yAxisID: 'y-words'
        },
        {
          label: 'Actual Practice (min)',
          data: actualPracticeMinutes,
          borderColor: '#48bb78', // Green
          backgroundColor: 'rgba(72, 187, 120, 0.2)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y-minutes',
          pointBackgroundColor: '#48bb78',
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Target Practice (min)',
          data: targetPracticeMinutes,
          borderColor: '#48bb78', // Green
          borderDash: [5, 5], // Dashed line for target
          backgroundColor: 'transparent',
          pointRadius: 0, // No points for target line
          tension: 0.3,
          yAxisID: 'y-minutes'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        'y-words': {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Words Added'
          },
          ticks: {
            precision: 0
          }
        },
        'y-minutes': {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Practice Minutes'
          },
          ticks: {
            precision: 0
          },
          grid: {
            drawOnChartArea: false // Only draw grid lines for the left Y-axis
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.dataset.yAxisID === 'y-words') {
                label += context.raw + ' words';
              } else {
                label += context.raw + ' min';
              }
              return label;
            },
            afterBody: function(context) {
              return '';
            }
          }
        },
      },
      animation: {
        duration: 1000
      }
    }
  });
}

// Обновление графика словарного запаса
function updateVocabChart(period = 'week') {
  if (vocabChart) {
    vocabChart.destroy();
  }
  const ctx = elements.vocabChart.getContext('2d');
  if (!appData.words || appData.words.length === 0) {
    ctx.font = "16px Roboto";
    ctx.fillStyle = "grey";
    ctx.textAlign = "center";
    ctx.fillText("Нет данных о словах для отображения.", elements.vocabChart.width / 2, elements.vocabChart.height / 2);
    return;
  }

  const dataPoints = {}; // Для агрегации данных
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let labels = [];
  let newWordsData = [];
  let masteredWordsData = [];

  // Вспомогательная функция для получения даты без времени
  const getDateOnly = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const todayOnly = getDateOnly(today);

  if (period === 'day') {
    // Агрегация по дням: только сегодняшний день
    labels.push(formatShortDate(todayOnly));
    dataPoints[todayOnly.toISOString().split('T')[0]] = { new: 0, mastered: 0 };

    appData.words.forEach(word => {
      const wordDateOnly = getDateOnly(word.dateAdded);
      if (wordDateOnly.getTime() === todayOnly.getTime()) {
        dataPoints[todayOnly.toISOString().split('T')[0]].new++;
        if (word.mastery === 'mastered') {
          dataPoints[todayOnly.toISOString().split('T')[0]].mastered++;
        }
      }
    });
    newWordsData.push(dataPoints[todayOnly.toISOString().split('T')[0]].new);
    masteredWordsData.push(dataPoints[todayOnly.toISOString().split('T')[0]].mastered);

  } else if (period === 'week') {
    // Агрегация по дням за последние 7 дней
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayOnly);
      date.setDate(todayOnly.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(formatShortDate(date));
      dataPoints[dateStr] = { new: 0, mastered: 0 };
    }
    appData.words.forEach(word => {
      const wordDateOnly = getDateOnly(word.dateAdded);
      const wordDateStr = wordDateOnly.toISOString().split('T')[0];
      if (dataPoints[wordDateStr]) { // Проверяем, что дата входит в последние 7 дней
        dataPoints[wordDateStr].new++;
        if (word.mastery === 'mastered') {
          dataPoints[wordDateStr].mastered++;
        }
      }
    });
    Object.keys(dataPoints).sort().forEach(dateStr => {
      newWordsData.push(dataPoints[dateStr].new);
      masteredWordsData.push(dataPoints[dateStr].mastered);
    });

  } else if (period === 'month') {
    // Агрегация по дням за текущий календарный месяц
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      labels.push(formatShortDate(d));
      dataPoints[dateStr] = { new: 0, mastered: 0 };
    }

    appData.words.forEach(word => {
      const wordDateOnly = getDateOnly(word.dateAdded);
      if (wordDateOnly >= getDateOnly(firstDayOfMonth) && wordDateOnly <= getDateOnly(lastDayOfMonth)) {
        const wordDateStr = wordDateOnly.toISOString().split('T')[0];
        if (dataPoints[wordDateStr]) {
          dataPoints[wordDateStr].new++;
          if (word.mastery === 'mastered') {
            dataPoints[wordDateStr].mastered++;
          }
        }
      }
    });
    Object.keys(dataPoints).sort().forEach(dateStr => {
      newWordsData.push(dataPoints[dateStr].new);
      masteredWordsData.push(dataPoints[dateStr].mastered);
    });
  }

  vocabChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'New Words Added',
          data: newWordsData,
          borderColor: '#4299e1',
          backgroundColor: 'rgba(66, 153, 225, 0.2)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#4299e1',
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Words Mastered',
          data: masteredWordsData,
          borderColor: '#48bb78',
          backgroundColor: 'rgba(72, 187, 120, 0.2)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#48bb78',
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false
          },
          title: {
            display: true,
            text: period === 'day' ? 'Hour' : (period === 'week' ? 'Day' : 'Month')
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Words'
          },
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.raw + ' words';
              return label;
            }
          }
        }
      },
      animation: {
        duration: 1000
      }
    }
  });
}

// Обновление графика распределения практики
function updatePracticeChart(period = 'week') {
  if (practiceChart) {
    practiceChart.destroy();
  }
  const ctx = elements.practiceChart.getContext('2d');
  if (!appData.practiceSessions || appData.practiceSessions.length === 0) {
    ctx.font = "16px Roboto";
    ctx.fillStyle = "grey";
    ctx.textAlign = "center";
    ctx.fillText("Нет данных о практике для отображения.", elements.practiceChart.width / 2, elements.practiceChart.height / 2);
    return;
  }
  
  const activityData = {
    listening: 0, speaking: 0, reading: 0, writing: 0,
    vocabulary: 0, grammar: 0, other: 0
  };

  const now = new Date();
  let filterDate = new Date(now);

  if (period === 'week') {
    filterDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    filterDate.setMonth(now.getMonth() - 1);
  } else if (period === 'day') {
    filterDate.setHours(0, 0, 0, 0); // Только за текущий день
  }

  appData.practiceSessions.forEach(session => {
    const sessionDate = new Date(session.date);
    if (sessionDate >= filterDate) {
      let activity = session.activityType;
      if (activity === 'other' && session.customActivity) {
        const customLower = session.customActivity.toLowerCase();
        if (customLower.includes('vocabulary') || customLower.includes('words')) {
          activity = 'vocabulary';
        } else if (customLower.includes('grammar') || customLower.includes('tenses')) {
          activity = 'grammar';
        }
      }

      if (activity in activityData) {
        activityData[activity] += session.duration || 0;
      } else {
        activityData.other += session.duration || 0;
      }
    }
  });
  
  const chartData = Object.entries(activityData)
    .filter(([_, minutes]) => minutes > 0)
    .map(([activity, minutes]) => ({
      activity,
      hours: (minutes / 60).toFixed(1)
    }));
  
  practiceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.map(item => capitalize(item.activity)),
      datasets: [{
        label: 'Practice Hours',
        data: chartData.map(item => item.hours),
        backgroundColor: [
          '#4299e1', '#9f7aea', '#48bb78', '#ed8936',
          '#f56565', '#a0aec0', '#667eea', '#805ad5'
        ],
        borderColor: [
          '#4299e1', '#9f7aea', '#48bb78', '#ed8936',
          '#f56565', '#a0aec0', '#667eea', '#805ad5'
        ],
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours'
          },
          ticks: {
            precision: 0
          }
        },
        y: {
          grid: {
            display: false
          },
          title: {
            display: true,
            text: 'Activity Type'
          }
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              return `${label}: ${value} hours`;
            }
          }
        }
      },
      animation: {
        duration: 1000
      }
    }
  });
}

// Показать модальное окно подтверждения
function showConfirmModal(title, message, confirmAction, confirmText = 'Confirm', cancelAction = null, cancelText = 'Cancel') {
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  
  elements.confirmAction.textContent = confirmText;
  elements.confirmCancel.textContent = cancelText;

  // Удаление предыдущих обработчиков
  const newConfirmAction = elements.confirmAction.cloneNode(true);
  elements.confirmAction.parentNode.replaceChild(newConfirmAction, elements.confirmAction);
  elements.confirmAction = newConfirmAction;

  const newConfirmCancel = elements.confirmCancel.cloneNode(true);
  elements.confirmCancel.parentNode.replaceChild(newConfirmCancel, elements.confirmCancel);
  elements.confirmCancel = newConfirmCancel;
  
  // Установка новых обработчиков
  elements.confirmAction.onclick = () => {
    if (confirmAction) confirmAction();
    elements.confirmModal.style.display = 'none';
  };
  
  elements.confirmCancel.onclick = () => {
    if (cancelAction) cancelAction();
    elements.confirmModal.style.display = 'none';
  };
  
  // Открытие модального окна
  elements.confirmModal.style.display = 'block';
}

// Экспорт данных
async function exportData() {
    const exportObject = {};
    const stores = ['words', 'practiceSessions', 'grammarTopics', 'notes', 'settings', 'conversationHistory'];
    for (const storeName of stores) {
        exportObject[storeName] = await getAllData(storeName);
    }

    const dataStr = JSON.stringify(exportObject, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `english-tracker-data-${formatDate(new Date())}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Импорт данных
function importData(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            showConfirmModal(
                'Import Data',
                'This will overwrite all your current data. Are you sure?',
                async () => {
                    const stores = ['words', 'practiceSessions', 'grammarTopics', 'notes', 'settings', 'conversationHistory'];
                    for (const storeName of stores) {
                        const transaction = db.transaction(storeName, 'readwrite');
                        const store = transaction.objectStore(storeName);
                        store.clear(); 
                        if (importedData[storeName]) {
                            for (const item of importedData[storeName]) {
                                store.add(item);
                            }
                        }
                    }
                    await loadData();
                    alert('Data imported successfully!');
                }
            );
        } catch (error) {
            alert('Error importing data. Please check the file format.');
        }
    };

    reader.readAsText(file);
}

// Сброс всех данных
function resetData() {
    showConfirmModal(
        'Reset All Data',
        'This will delete all your data and cannot be undone. Are you sure?',
        async () => {
            const stores = ['words', 'practiceSessions', 'grammarTopics', 'notes', 'settings', 'conversationHistory'];
            for (const storeName of stores) {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                store.clear();
            }
            await loadData();
            alert('All data has been reset.');
        }
    );
}

// Проверка уведомлений
function checkNotifications() {
  setupContextualReminders();
  if (!appData.settings[0].notifications) return;
  
  // Проверка текущего времени
  const now = new Date();
  const [hours, minutes] = appData.settings[0].reminderTime.split(':').map(Number);
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);
  
  // Разница во времени в минутах
  const timeDiff = (now - reminderTime) / (1000 * 60);
  
  // Если текущее время близко к времени напоминания (±5 минут)
  if (Math.abs(timeDiff) <= 5) {
    // Проверка, было ли показано напоминание сегодня
    const today = new Date().toISOString().split('T')[0];
    const lastNotificationDate = localStorage.getItem('lastNotificationDate');
    if (lastNotificationDate === today) return;
    
    // Проверка, было ли сегодня занятие
    const hasPracticeToday = appData.practiceSessions.some(s => s.date === today);
    
    // Проверка, было ли добавлено достаточно слов сегодня
    const wordsAddedToday = appData.words.filter(w => 
      w.dateAdded.split('T')[0] === today
    ).length;
    
    // Показ уведомления, если что-то не выполнено
    if (!hasPracticeToday || wordsAddedToday < appData.settings[0].dailyWordsGoal) {
      let message = 'Daily English Learning Reminder:\n\n';
      
      if (!hasPracticeToday) {
        message += `- You haven't practiced today (goal: ${appData.settings[0].dailyPracticeGoal} minutes)\n`;
      }
      
      if (wordsAddedToday < appData.settings[0].dailyWordsGoal) {
        message += `- You've added only ${wordsAddedToday} words today (goal: ${appData.settings[0].dailyWordsGoal})\n`;
      }
      
      message += '\nKeep up with your English learning goals!';
      
      // Проверяем, поддерживает ли браузер уведомления
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('English Learning Reminder', {
          body: message,
          icon: '/favicon.ico'
        });
      } else {
        alert(message);
      }
      
      localStorage.setItem('lastNotificationDate', today);
    }
  }
}

// Запрос разрешения на уведомления
function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    });
  }
}

// Кэш для ответов Gemini API
const apiCache = new Map();

// Gemini API функции

/**
 * Получает и форматирует промпт из централизованного объекта prompts.
 * @param {string} key - Ключ промпта (например, 'vocabulary').
 * @param {object} replacements - Объект для замены плейсхолдеров (например, { WORD: 'hello' }).
 * @returns {string} - Отформатированный промпт.
 */
function getPrompt(key, replacements = {}) {
    // Получаем текущий язык из настроек
    // Получаем текущий язык из настроек
    const lang = appData.settings[0]?.language || 'en';
    console.log("Generating prompt for language:", lang); // Добавьте эту строку
    const langPrompts = prompts[lang] || prompts.en;

    // Добавляем язык в replacements, если его там нет
    if (!replacements.LANG_NAME) {
        replacements.LANG_NAME = lang === 'en' ? 'English' :
                               lang === 'ru' ? 'Russian' :
                               lang === 'tg' ? 'Tajik' : 'English';
    }

    let promptTemplate = langPrompts[key];
    if (!promptTemplate) {
        console.error(`Prompt key "${key}" not found for language "${lang}". Falling back to English.`);
        promptTemplate = prompts.en[key];
        if (!promptTemplate) {
            console.error(`Prompt key "${key}" not found even in English fallback. Returning empty string.`);
            return [];
        }
    }

    // Заменяем плейсхолдеры
    for (const placeholder in replacements) {
        const regex = new RegExp(`\\[${placeholder}\\]`, 'g');
        promptTemplate = promptTemplate.replace(regex, replacements[placeholder]);
    }

    // Формируем содержимое запроса с учетом системной инструкции
    const contents = [];
    
    // Определяем системную инструкцию
    let systemInstructionText = null;
    if (key === 'correction') {
        systemInstructionText = langPrompts.systemInstructionTeacher || prompts.en.systemInstructionTeacher;
    } else if (key === 'dialogue' || key === 'sendMessage') {
        systemInstructionText = langPrompts.systemInstructionPartner || prompts.en.systemInstructionPartner;
    } else {
        systemInstructionText = langPrompts.systemInstruction || prompts.en.systemInstruction;
    }

    if (systemInstructionText) {
        contents.push({ role: "user", parts: [{ text: systemInstructionText }] });
        contents.push({ role: "model", parts: [{ text: "OK, I will act as instructed." }] });
    }
    
    contents.push({ role: "user", parts: [{ text: promptTemplate }] });

    return contents;
}


async function callGeminiAPI(contents, model = 'gemini-1.5-flash-latest', useCache = true) {
    if (GEMINI_API_KEY === "YOUR_API_KEY") {
        const errorMessage = "API key is not set. Please add your Gemini API key in config.js.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    const lang = appData.settings[0]?.language || 'en';
    const cacheKey = `${model}:${lang}:${JSON.stringify(contents)}`;
    if (useCache && apiCache.has(cacheKey)) {
        console.log("Returning cached response for:", cacheKey);
        return apiCache.get(cacheKey);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify({ contents }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Gemini API Error: Status ${response.status}, Status Text: ${response.statusText}, Details:`, errorData);
            throw new Error(`API request failed with status ${response.status}: ${errorData.error.message || JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content.parts[0].text) {
            throw new Error('No content received from Gemini API.');
        }
        
        const result = data.candidates[0].content.parts[0].text;
        
        if (useCache) {
            apiCache.set(cacheKey, result);
        }

        return result;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        // Возвращаем более дружелюбное сообщение об ошибке
        throw new Error("Sorry, I'm having trouble connecting to the AI service. Please check your connection and API key, then try again.");
    }
}

function showGeminiResponse(text) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content large">
      <span class="close">&times;</span>
      <h2><i class="fas fa-robot"></i> Gemini Response</h2>
      <div class="gemini-response">${marked.parse(text)}</div>
      <div class="modal-actions">
        <button id="copyGeminiResponse" class="primary-btn">
          <i class="fas fa-copy"></i> Copy to Clipboard
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = "block";
  
  modal.querySelector(".close").addEventListener("click", () => {
    modal.remove();
  });
  
  modal.querySelector("#copyGeminiResponse").addEventListener("click", () => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  });
  
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

async function generateWordsWithGemini(topic, count) {
    const loadingDiv = document.getElementById('gemini-loading');
    loadingDiv.style.display = 'block';

    const contents = getPrompt('wordGeneration', { COUNT: count, TOPIC: topic });

    try {
        const textResponse = await callGeminiAPI(contents, 'gemini-1.5-flash-latest');
        
        // Очистка ответа от Markdown и парсинг JSON
        const jsonStart = textResponse.indexOf('{');
        const jsonEnd = textResponse.lastIndexOf('}') + 1;
        const jsonString = textResponse.slice(jsonStart, jsonEnd);
        const data = JSON.parse(jsonString);

        if (data.words && Array.isArray(data.words)) {
            for (const wordData of data.words) {
                const newWord = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    word: wordData.word,
                    translation: wordData.translation,
                    partOfSpeech: wordData.partOfSpeech.toLowerCase(),
                    example: wordData.example,
                    mastery: 'new',
                    dateAdded: new Date().toISOString()
                };
                appData.words.push(newWord);
                await addData('words', newWord);
            }
            updateUI();
            alert(`${data.words.length} words have been successfully added!`);
        } else {
            throw new Error("Invalid JSON structure in API response.");
        }

    } catch (error) {
        console.error("Error generating words with Gemini:", error);
        alert("Failed to generate words. Please check the console for details.");
    } finally {
        loadingDiv.style.display = 'none';
        document.getElementById('gemini-generate-modal').style.display = 'none';
    }
}

// AI Tools функции
async function analyzeProgress() {
  try {
    // Собираем данные для анализа
    const progressData = {
      wordsLearned: appData.words.length,
      practiceHours: (calculateTotalPracticeMinutes() / 60).toFixed(1),
      streak: calculateStreak().currentStreak,
      grammarTopics: appData.grammarTopics.length,
      masteredGrammar: appData.grammarTopics.filter(t => t.status === 'mastered').length
    };
    
    const contents = getPrompt('analyzeProgress', { DATA: JSON.stringify(progressData) });
    
    const response = await callGeminiAPI(contents, 'gemini-1.5-flash-latest');
    
    showGeminiResponse(`### Your Learning Analysis\n\n${marked.parse(response)}`);
  } catch (error) {
    alert("Error analyzing progress: " + error.message);
  }
}

function startConversation() {
  elements.conversationMessages.innerHTML = `
    <div class="ai-message">
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div class="message-text">Hello! I'm your English practice partner. What would you like to talk about today?</div>
        <div class="message-time">Just now</div>
      </div>
    </div>
  `;
  
  elements.conversationModal.style.display = "block";
  elements.conversationInput.focus();
}

async function sendMessage() {
  const message = elements.conversationInput.value.trim();
  if (!message) return;
  
  // Добавляем сообщение пользователя
  const userMessage = document.createElement("div");
  userMessage.className = "user-message";
  userMessage.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-user"></i>
    </div>
    <div class="message-content">
      <div class="message-text">${message}</div>
      <div class="message-time">Just now</div>
    </div>
  `;
  elements.conversationMessages.appendChild(userMessage);
  
  // Сохраняем историю
  appData.conversationHistory.push({ role: "user", content: message });
  
  // Очищаем поле ввода
  elements.conversationInput.value = "";
  
  // Прокручиваем вниз
  elements.conversationMessages.scrollTop = elements.conversationMessages.scrollHeight;
  
  // Показываем индикатор загрузки
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "ai-message";
  loadingIndicator.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-spinner fa-spin"></i> Thinking...</div>
    </div>
  `;
  elements.conversationMessages.appendChild(loadingIndicator);
  elements.conversationMessages.scrollTop = elements.conversationMessages.scrollHeight;
  
  try {
    // Формируем промпт для Gemini
    const topic = elements.conversationTopic.value;
    const history = JSON.stringify(appData.conversationHistory.slice(-10)); // последние 10 сообщений
    const replacements = {
        TOPIC: topic,
        MESSAGE: message,
        HISTORY: history
    };
    const contents = getPrompt('sendMessage', replacements);
    
    // Получаем ответ от Gemini, отключаем кеш для диалогов
    const response = await callGeminiAPI(contents, 'gemini-1.5-flash-latest', false);
    
    // Удаляем индикатор загрузки
    elements.conversationMessages.removeChild(loadingIndicator);
    
    // Добавляем ответ AI
    const aiMessage = document.createElement("div");
    aiMessage.className = "ai-message";
    aiMessage.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div class="message-text">${marked.parse(response)}</div>
        <div class="message-time">Just now</div>
      </div>
    `;
    elements.conversationMessages.appendChild(aiMessage);
    
    // Сохраняем историю
    appData.conversationHistory.push({ role: "assistant", content: response });
    
    // Прокручиваем вниз
    elements.conversationMessages.scrollTop = elements.conversationMessages.scrollHeight;
  } catch (error) {
    // Удаляем индикатор загрузки
    elements.conversationMessages.removeChild(loadingIndicator);
    
    // Показываем сообщение об ошибке
    const errorMessage = document.createElement("div");
    errorMessage.className = "ai-message";
    errorMessage.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div class="message-text">Sorry, I'm having trouble responding right now. Please try again later.</div>
      </div>
    `;
    elements.conversationMessages.appendChild(errorMessage);
    
    elements.conversationMessages.scrollTop = elements.conversationMessages.scrollHeight;
  }
}

async function checkWriting() {
  const text = elements.writingInput.value.trim();
  if (!text) {
    alert("Please enter some text to check");
    return;
  }
  
  try {
    const contents = getPrompt('correction', { TEXT: text });
    const response = await callGeminiAPI(contents, 'gemini-1.5-flash-latest');
    
    showGeminiResponse(`### Writing Correction\n\n${response}`);
  } catch (error) {
    alert("Error checking writing: " + error.message);
  }
}

async function getPersonalizedTips() {
  try {
    // Собираем данные для анализа
    const progressData = {
      wordsLearned: appData.words.length,
      practiceHours: (calculateTotalPracticeMinutes() / 60).toFixed(1),
      streak: calculateStreak().currentStreak,
      grammarTopics: appData.grammarTopics.length,
      masteredGrammar: appData.grammarTopics.filter(t => t.status === 'mastered').length,
      lastWordsAdded: appData.words.slice(-5).map(w => w.word),
      lastPracticeSessions: appData.practiceSessions.slice(-3).map(s => s.activityType)
    };
    
    const contents = getPrompt('personalizedTips', { DATA: JSON.stringify(progressData) });
    
    const response = await callGeminiAPI(contents, 'gemini-1.5-flash-latest');
    
    showGeminiResponse(`### Personalized Learning Tips\n\n${marked.parse(response)}`);
  } catch (error) {
    alert("Error getting tips: " + error.message);
  }
}

// Вспомогательные функции
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatTime(timeString) {
  if (!timeString) return '';
  // Возвращаем время в 24-часовом формате
  return timeString;
}

function formatMonth(monthYear) {
  const [year, month] = monthYear.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}


// --- Новые функции для раздела "Grammar Practice" ---

// Инициализация и обновление профиля обучения
function initializeLearningProfile() {
  appData.settings[0].learningProfile = {
    strengths: [],
    weaknesses: [],
    preferredLearningStyles: ["visual", "auditory", "kinesthetic"],
    interests: ["technology", "travel", "business"],
    lastActiveTimes: {}
  };
  updateData('settings', appData.settings[0]);
}

async function updateLearningProfile() {
  const recentActivities = getRecentActivities();
  const data = {
    words: appData.words.length,
    practiceSessions: appData.practiceSessions.length,
    grammarTopics: appData.grammarTopics.length,
    recentActivities: recentActivities
  };
  
  const contents = getPrompt('updateProfile', { DATA: JSON.stringify(data) });
  
  try {
    const response = await callGeminiAPI(contents);
    // Очистка ответа от Markdown и парсинг JSON
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    const jsonString = response.slice(jsonStart, jsonEnd);
    const profileUpdate = JSON.parse(jsonString);
    Object.assign(appData.settings[0].learningProfile, profileUpdate);
    await updateData('settings', appData.settings[0]);
  } catch (error) {
    if (error.message.includes("API key is not set")) {
      console.warn("AI features disabled: " + error.message);
    } else {
      console.error("Failed to update learning profile:", error);
    }
  }
}

function getRecentActivities(limit = 10) {
  const activities = [
    ...appData.words.map(w => ({ type: 'wordAdded', date: w.dateAdded, detail: w.word })),
    ...appData.practiceSessions.map(s => ({ type: 'practiceCompleted', date: s.date, detail: s.activityType })),
    ...appData.grammarTopics.map(t => ({ type: 'grammarLearned', date: t.dateAdded, detail: t.title }))
  ];

  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  return activities.slice(0, limit);
}

function initEventSystem() {
  // Подписки на события между разделами
  eventBus.subscribe('wordAdded', (data) => {
    console.log('Событие: добавлено новое слово', data);
    // Здесь можно добавить логику для обновления Skill Tree или рекомендаций
  });
  eventBus.subscribe('sessionCompleted', (data) => {
    console.log('Событие: завершена практическая сессия', data);
    updateLearningProfile();
  });
  eventBus.subscribe('grammarTopicMastered', (data) => {
    console.log('Событие: освоена тема по грамматике', data);
    updateLearningProfile();
  });
}

async function getCrossSectionRecommendations() {
  const prompt = `Based on this comprehensive learning data, provide 3 personalized recommendations 
    that connect different learning areas (vocabulary, grammar, practice). Be specific.
    
    Learning Data: ${JSON.stringify({
      vocabulary: appData.words.slice(-10), // последние 10 слов
      grammar: appData.grammarTopics.filter(t => t.status === 'learning'),
      practice: appData.practiceSessions.slice(-5), // последние 5 сессий
      profile: appData.settings[0].learningProfile
    })}`;
  
  try {
    const response = await callGeminiAPI(prompt);
    return response;
  } catch (error) {
    console.error("Error getting cross-section recommendations:", error);
    return "Could not fetch recommendations.";
  }
}

function showRecommendationNotification(recommendations) {
  // Простая реализация с помощью alert. Можно заменить на более красивое модальное окно.
  alert("Daily Recommendations:\n\n" + recommendations);
}

async function generateSmartSchedule() {
  const prompt = `Create an optimal 1-week learning schedule based on:
    - User's available time: ${appData.settings[0].dailyPracticeGoal} minutes/day
    - Current level: ${appData.settings[0].defaultCurrentLevel}
    - Target level: ${appData.settings[0].defaultTargetLevel}
    - Learning profile: ${JSON.stringify(appData.settings[0].learningProfile)}
    - Recent activity: ${JSON.stringify(getRecentActivities())}
    
    Return as JSON with days and activities that connect vocabulary, grammar and practice.`;
  
  try {
    const response = await callGeminiAPI(prompt);
    const schedule = JSON.parse(response);
    // implementSchedule(schedule); // Предполагается, что эта функция будет создана
    console.log("Generated Schedule:", schedule);
    alert("Smart schedule generated! Check the console for details.");
  } catch (error) {
    console.error("Error generating smart schedule:", error);
  }
}

function setupContextualReminders() {
  // Напоминание о повторении слов
  const wordsToReview = appData.words.filter(w => 
    w.mastery === 'learning' && 
    new Date(w.dateAdded) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  );
  
  if (wordsToReview.length > 5) {
    showNotification(`Time to review ${wordsToReview.length} words you're learning!`);
  }
  
  // Напоминание о несбалансированных активностях
  const practiceDistribution = getPracticeDistribution(); // Предполагается, что эта функция будет создана
 
}

async function getPersonalizedExplanation(topic, currentContext) {
  const prompt = `Explain the ${topic} in English for a ${appData.settings[0].defaultCurrentLevel} learner.
    Focus on: ${currentContext}.
    The user's learning profile: ${JSON.stringify(appData.settings[0].learningProfile)}.
    Use ${appData.settings[0].aiFeedbackDetail} detail.
    Provide examples related to: ${appData.settings[0].learningProfile.interests.join(', ')}.`;
  
  return await callGeminiAPI(prompt);
}

async function generateAdaptiveExercise(topic, difficulty) {
  const prompt = `Create a ${difficulty} English exercise about ${topic}.
    For a ${appData.settings[0].defaultCurrentLevel} learner moving to ${appData.settings[0].defaultTargetLevel}.
    Preferred learning style: ${appData.settings[0].learningProfile.preferredLearningStyles[0]}.
    Make it engaging and relevant to: ${appData.settings[0].learningProfile.interests.join(', ')}.
    Format as JSON with question, options, answer and explanation.`;
  
  try {
    const response = await callGeminiAPI(prompt);
    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating adaptive exercise:", error);
    return null;
  }
}

// Вспомогательная функция для setupContextualReminders
function getPracticeDistribution() {
    const distribution = { listening: 0, speaking: 0, reading: 0, writing: 0, grammar: 0, other: 0 };
    let totalDuration = 0;

    appData.practiceSessions.forEach(session => {
        if (distribution.hasOwnProperty(session.activityType)) {
            distribution[session.activityType] += session.duration;
            totalDuration += session.duration;
        } else {
            distribution.other += session.duration;
            totalDuration += session.duration;
        }
    });

    if (totalDuration === 0) return distribution;

    // Нормализация
    for (const key in distribution) {
        distribution[key] = distribution[key] / totalDuration;
    }

    return distribution;
}

function showNotification(message) {
    // Простая реализация с помощью alert.
    alert(message);
}

async function analyzeComprehensiveProgress() {
  try {
    const lang = appData.settings[0].language || 'en';
    const langName = lang === 'en' ? 'English' : (lang === 'ru' ? 'Russian' : 'Tajik');

    // Собираем данные для анализа
    const progressData = {
      vocabularyGrowth: {
        totalWords: appData.words.length,
        masteredWords: appData.words.filter(w => w.mastery === 'mastered').length
      },
      grammarTopics: appData.grammarTopics.length,
      practiceConsistency: calculateStreak().currentStreak,
      skillBalance: getPracticeDistribution()
    };

    const contents = getPrompt('analyzeComprehensiveProgress', {
      DATA: JSON.stringify(progressData),
      LANG_NAME: langName
    });

    const analysis = await callGeminiAPI(contents);
    showGeminiResponse(marked.parse(analysis));
  } catch (error) {
    console.error("Error analyzing comprehensive progress:", error);
    alert("Could not analyze progress.");
  }
}

function visualizeKnowledgeGraph() {
  // Создаем граф знаний, связывающий слова, грамматику и практику
  const graphData = {
    nodes: [],
    links: []
  };
  
  // Добавляем слова
  appData.words.forEach(word => {
    graphData.nodes.push({
      id: word.word,
      group: 'vocabulary',
      mastery: word.mastery
    });
  });
  
  // Добавляем грамматические темы
  appData.grammarTopics.forEach(topic => {
    graphData.nodes.push({
      id: topic.title,
      group: 'grammar',
      status: topic.status
    });
  });
  
  // Добавляем связи (это можно автоматизировать с помощью ИИ)
  // Например, связь между словом "run" и темой "Present Continuous"
  
  // Визуализация с помощью D3.js
  // renderKnowledgeGraph(graphData); // Предполагается, что эта функция будет создана
  console.log("Knowledge Graph Data:", graphData);
  alert("Knowledge graph data generated! Check the console for details.");
}


// Настройка обработчиков событий
function setupEventListeners() {
  // Сохранение настроек профиля пользователя
  if (elements.defaultCurrentLevel) {
    elements.defaultCurrentLevel.addEventListener('change', () => {
      appData.settings[0].defaultCurrentLevel = elements.defaultCurrentLevel.value;
      updateData('settings', appData.settings[0]);
    });
  }

  if (elements.defaultTargetLevel) {
    elements.defaultTargetLevel.addEventListener('change', () => {
      appData.settings[0].defaultTargetLevel = elements.defaultTargetLevel.value;
      updateData('settings', appData.settings[0]);
    });
  }
  // Навигация по разделам
  elements.navLinks.forEach(link => {
    if (link) { // Проверка на null для каждого элемента в NodeList
      link.addEventListener('click', () => {
        // Удаление активного класса у всех ссылок
        elements.navLinks.forEach(l => l.classList.remove('active'));
        // Добавление активного класса к текущей ссылке
        link.classList.add('active');
      
        // Скрытие всех разделов
        elements.sections.forEach(section => section.classList.remove('active'));
        // Показ выбранного раздела
        const sectionId = link.getAttribute('data-section');
        document.getElementById(sectionId).classList.add('active');

        // Если активирован раздел заметок, пересчитываем их размеры
        if (sectionId === 'notes') {
          // Используем requestAnimationFrame, чтобы убедиться, что элементы уже отображены
          requestAnimationFrame(() => {
            resizeAllNotes();
          });
        }
      });
    }
  });
  
  // Переключение темы
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener('change', () => {
      if (elements.themeToggle.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        appData.settings[0].darkMode = true;
      } else {
        document.documentElement.removeAttribute('data-theme');
        appData.settings[0].darkMode = false;
      }
      updateData('settings', appData.settings[0]);
    });
  }
  
  if (elements.themeToggleSettings) {
    elements.themeToggleSettings.addEventListener('change', () => {
      if (elements.themeToggleSettings.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        appData.settings[0].darkMode = true;
      } else {
        document.documentElement.removeAttribute('data-theme');
        appData.settings[0].darkMode = false;
      }
      updateData('settings', appData.settings[0]);
    });
  }
  
  // Изменение акцентного цвета
  if (elements.accentColor) {
    elements.accentColor.addEventListener('change', (e) => {
      const color = e.target.value;
      document.documentElement.style.setProperty('--primary-color', color);
      appData.settings[0].accentColor = color;
      updateData('settings', appData.settings[0]);
    });
  }
  
  // Добавление слова (с Dashboard)
  if (elements.addWordBtnDashboard) {
    elements.addWordBtnDashboard.addEventListener('click', () => {
      elements.wordModalTitle.textContent = 'Add New Word';
      const existingIdField = document.getElementById('wordId');
      if (existingIdField) existingIdField.remove();
      elements.wordModal.style.display = 'block';
    });
  }
  
  // Добавление слова (с Vocabulary)
  if (elements.addWordBtn) {
    elements.addWordBtn.addEventListener('click', () => {
      elements.wordModalTitle.textContent = 'Add New Word';
      const existingIdField = document.getElementById('wordId');
      if (existingIdField) existingIdField.remove();
      elements.wordModal.style.display = 'block';
    });
  }

  // Генерация слов с Gemini
  const generateWordsBtn = document.getElementById('generateWordsBtn');
  if (generateWordsBtn) {
    generateWordsBtn.addEventListener('click', () => {
      document.getElementById('gemini-generate-modal').style.display = 'block';
    });
  }

  const geminiGenerateForm = document.getElementById('gemini-generate-form');
  if (geminiGenerateForm) {
    geminiGenerateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const topic = document.getElementById('gemini-topic').value;
      const count = document.getElementById('gemini-count').value;
      if (topic && count) {
          generateWordsWithGemini(topic, count);
      }
    });
  }
  
  // Обработка формы слова
  if (elements.wordForm) {
    elements.wordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const wordIdField = document.getElementById('wordId');
      const wordId = wordIdField ? wordIdField.value : null;
      const wordInput = document.getElementById('word');
      const translationInput = document.getElementById('translation');

      if (!wordInput.value.trim() || !translationInput.value.trim()) {
        alert('Word and Translation fields cannot be empty.');
        return; // Предотвращаем дальнейшее выполнение, если поля пусты
      }

      const wordData = {
        word: wordInput.value.trim(),
        translation: translationInput.value.trim(),
        partOfSpeech: document.getElementById('partOfSpeech').value,
        example: document.getElementById('example').value,
        mastery: document.getElementById('mastery').value,
      };
      
      if (wordId) {
        const existingWord = appData.words.find(w => w.id === wordId);
        const updatedWord = { ...existingWord, ...wordData };
        const index = appData.words.findIndex(w => w.id === wordId);
        if (index !== -1) appData.words[index] = updatedWord;
        await updateData('words', updatedWord);
      } else {
        const newWord = {
          ...wordData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dateAdded: new Date().toISOString()
        };
        appData.words.push(newWord);
        await addData('words', newWord);
      }
      
      updateUI();
      elements.wordModal.style.display = 'none';
      elements.wordForm.reset();
      if (wordIdField) wordIdField.remove();
    });
  }
  
  // Поиск и фильтрация слов
  if (elements.vocabSearch) {
    elements.vocabSearch.addEventListener('input', () => {
      updateVocabularyList();
    });
  }
  
  if (elements.vocabFilter) {
    elements.vocabFilter.addEventListener('change', () => {
      updateVocabularyList();
    });
  }
  
  if (elements.vocabPartOfSpeech) {
    elements.vocabPartOfSpeech.addEventListener('change', () => {
      updateVocabularyList();
    });
  }
  
  // Навигация по календарю
  if (elements.prevMonth) {
    elements.prevMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      updatePracticeCalendar();
    });
  }
  
  if (elements.nextMonth) {
    elements.nextMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      updatePracticeCalendar();
    });
  }
  
  // Добавление практического занятия
  if (elements.addPracticeBtn) {
    elements.addPracticeBtn.addEventListener('click', () => {
      elements.practiceModalTitle.textContent = 'Add Practice Session';
      elements.practiceDate.valueAsDate = new Date();
      elements.practiceTime.value = '18:00';
      const existingIdField = document.getElementById('practiceId');
      if (existingIdField) existingIdField.remove();
      elements.practiceModal.style.display = 'block';
    });
  }
  
  // Показать/скрыть поле для пользовательской активности
  if (elements.activityType) {
    elements.activityType.addEventListener('change', (e) => {
      if (elements.customActivity) {
        elements.customActivity.style.display = e.target.value === 'other' ? 'block' : 'none';
      }
    });
  }
  
  // Обработка формы практического занятия
  if (elements.practiceForm) {
    elements.practiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const practiceIdField = document.getElementById('practiceId');
      const practiceId = practiceIdField ? practiceIdField.value : null;
      
      const sessionData = {
        date: elements.practiceDate.value,
        time: elements.practiceTime.value,
        activityType: elements.activityType.value,
        duration: parseInt(elements.duration.value),
        reminder: document.getElementById('reminder').value,
        notes: document.getElementById('practiceNotes').value,
        customActivity: elements.activityType.value === 'other' ? elements.customActivity.value : undefined
      };
      
      if (practiceId) {
        const existingSession = appData.practiceSessions.find(s => s.id === practiceId);
        const updatedSession = { ...existingSession, ...sessionData };
        const index = appData.practiceSessions.findIndex(s => s.id === practiceId);
        if (index !== -1) appData.practiceSessions[index] = updatedSession;
        await updateData('practiceSessions', updatedSession);
      } else {
        const newSession = {
          ...sessionData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          completed: false,
          onTime: false,
          loggedAt: new Date().toISOString()
        };
        appData.practiceSessions.push(newSession);
        await addData('practiceSessions', newSession);
      }
      
      updateUI();
      elements.practiceModal.style.display = 'none';
      elements.practiceForm.reset();
      if (elements.customActivity) {
        elements.customActivity.style.display = 'none';
      }
      if (practiceIdField) practiceIdField.remove();
    });
  }
  
  // Добавление заметки
  if (elements.addNoteBtn) {
    elements.addNoteBtn.addEventListener('click', () => {
      elements.noteModalTitle.textContent = 'Create New Note';
      const existingIdField = document.getElementById('noteId');
      if (existingIdField) existingIdField.remove();
      elements.noteModal.style.display = 'block';
    });
  }
  
  // Обработка формы заметки
  if (elements.noteForm) {
    elements.noteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const noteIdField = document.getElementById('noteId');
      const noteId = noteIdField ? noteIdField.value : null;
      
      const noteData = {
        title: document.getElementById('noteTitle').value,
        content: document.getElementById('noteContent').value,
        dateUpdated: new Date().toISOString(),
      };

      if (noteId) {
        const existingNote = appData.notes.find(n => n.id === noteId);
        const updatedNote = { ...existingNote, ...noteData };
        const index = appData.notes.findIndex(n => n.id === noteId);
        if (index !== -1) appData.notes[index] = updatedNote;
        await updateData('notes', updatedNote);
      } else {
        const newNote = {
          ...noteData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dateCreated: new Date().toISOString(),
          bgIndex: Math.floor(Math.random() * noteBackgrounds.length),
          aspectRatio: noteAspectRatios[Math.floor(Math.random() * noteAspectRatios.length)].value
        };
        appData.notes.push(newNote);
        await addData('notes', newNote);
      }
      
      updateUI();
      elements.noteModal.style.display = 'none';
      elements.noteForm.reset();
      if (noteIdField) noteIdField.remove();
    });
  }
  
  // Закрытие модальных окон
  elements.closeButtons.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        elements.modals.forEach(modal => {
          if (modal) {
            modal.style.display = 'none';
          }
        });
      });
    }
  });
  
  window.addEventListener('click', (e) => {
    elements.modals.forEach(modal => {
      if (modal && e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Пересчет сетки заметок при изменении размера окна
  window.addEventListener('resize', resizeAllNotes);
  
  // Настройки
  if (elements.exportBtn) {
    elements.exportBtn.addEventListener('click', exportData);
  }
  
  if (elements.importBtn) {
    elements.importBtn.addEventListener('click', () => {
      if (elements.importInput) {
        elements.importInput.click();
      }
    });
  }
  
  if (elements.importInput) {
    elements.importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        importData(file);
      }
    });
  }
  
  if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', resetData);
  }
  
  if (elements.notificationsToggle) {
    elements.notificationsToggle.addEventListener('change', (e) => {
      appData.settings[0].notifications = e.target.checked;
      updateData('settings', appData.settings[0]);
      if (e.target.checked) {
        requestNotificationPermission();
      }
    });
  }
  
  if (elements.reminderTime) {
    elements.reminderTime.addEventListener('change', (e) => {
      appData.settings[0].reminderTime = e.target.value;
      updateData('settings', appData.settings[0]);
    });
  }
  
  if (elements.dailyWordsGoal) {
    elements.dailyWordsGoal.addEventListener('change', (e) => {
      appData.settings[0].dailyWordsGoal = parseInt(e.target.value);
      updateData('settings', appData.settings[0]);
    });
  }
  
  if (elements.dailyPracticeGoal) {
    elements.dailyPracticeGoal.addEventListener('change', (e) => {
      appData.settings[0].dailyPracticeGoal = parseInt(e.target.value);
      updateData('settings', appData.settings[0]);
    });
  }
  
  if (elements.aiAssistanceLevel) {
    elements.aiAssistanceLevel.addEventListener('change', (e) => {
      appData.settings[0].aiAssistanceLevel = e.target.value;
      updateData('settings', appData.settings[0]);
    });
  }
  
  if (elements.aiFeedbackDetail) {
    elements.aiFeedbackDetail.addEventListener('change', (e) => {
      appData.settings[0].aiFeedbackDetail = e.target.value;
      updateData('settings', appData.settings[0]);
    });
  }

  if (elements.language) {
    elements.language.addEventListener('change', async (e) => {
      appData.settings[0].language = e.target.value;
      await updateData('settings', appData.settings[0]);
      applyThemeSettings(); // Применяем сразу
      apiCache.clear(); // Очищаем кеш
      showNotification(`Language changed to ${e.target.options[e.target.selectedIndex].text}. AI responses will now be in this language.`);
    });
  }

  if (elements.defaultCurrentLevel) {
    elements.defaultCurrentLevel.addEventListener('change', (e) => {
      appData.settings[0].defaultCurrentLevel = e.target.value;
      updateData('settings', appData.settings[0]);
    });
  }

  if (elements.defaultTargetLevel) {
    elements.defaultTargetLevel.addEventListener('change', (e) => {
      appData.settings[0].defaultTargetLevel = e.target.value;
      updateData('settings', appData.settings[0]);
    });
  }
  
    // AI Tools
  if (elements.analyzeProgressBtn) {
    elements.analyzeProgressBtn.addEventListener('click', analyzeProgress);
  }
  if (elements.startConversationBtn) {
    elements.startConversationBtn.addEventListener('click', startConversation);
  }
  if (elements.sendMessageBtn) {
    elements.sendMessageBtn.addEventListener('click', sendMessage);
  }
  if (elements.conversationInput) {
    elements.conversationInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  if (elements.restartConversationBtn) {
    elements.restartConversationBtn.addEventListener('click', () => {
      appData.conversationHistory = [];
      startConversation();
    });
  }
  if (elements.checkWritingBtn) {
    elements.checkWritingBtn.addEventListener('click', checkWriting);
  }
  if (elements.getTipsBtn) {
    elements.getTipsBtn.addEventListener('click', getPersonalizedTips);
  }
  
  // --- Grammar Practice Event Listeners ---
  if (elements.grammarSearch) {
    elements.grammarSearch.addEventListener('input', updateGrammarTopicsList);
  }
  if (elements.grammarLevel) {
    elements.grammarLevel.addEventListener('change', updateGrammarTopicsList);
  }
  if (elements.grammarCategory) {
    elements.grammarCategory.addEventListener('change', updateGrammarTopicsList);
  }
  
  if (elements.addGrammarTopicBtn) {
    elements.addGrammarTopicBtn.addEventListener('click', () => {
      document.getElementById('grammarModalTitle').textContent = 'Add Grammar Topic';
      document.getElementById('grammarTopicForm').reset();
      const existingIdField = document.getElementById('grammarTopicId');
      if (existingIdField) existingIdField.remove();
      document.getElementById('grammarTopicModal').style.display = 'block';
    });
  }

  const grammarTopicForm = document.getElementById('grammarTopicForm');
  if (grammarTopicForm) {
    grammarTopicForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const topicIdField = document.getElementById('grammarTopicId');
      const topicId = topicIdField ? topicIdField.value : null;

      const topicData = {
        title: document.getElementById('grammarTopicTitle').value,
        category: document.getElementById('grammarTopicCategory').value,
        level: document.getElementById('grammarTopicLevel').value,
        status: document.getElementById('grammarTopicStatus').value,
      };

      if (topicId) {
        const existingTopic = appData.grammarTopics.find(t => t.id === topicId);
        const updatedTopic = { ...existingTopic, ...topicData };
        const index = appData.grammarTopics.findIndex(t => t.id === topicId);
        if (index !== -1) {
          appData.grammarTopics[index] = updatedTopic;
        }
        await updateData('grammarTopics', updatedTopic);
      } else {
        const newTopic = {
          ...topicData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dateAdded: new Date().toISOString(),
        };
        appData.grammarTopics.push(newTopic);
        await addData('grammarTopics', newTopic);
      }
      
      updateUI();
      document.getElementById('grammarTopicModal').style.display = 'none';
      grammarTopicForm.reset();
      if (topicIdField) topicIdField.remove();
    });
  }

  // Обработка формы конфигурации теста
  if (elements.grammarTestConfigForm) {
    elements.grammarTestConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const topicId = elements.testConfigTopicId.value;
      const questionCount = parseInt(elements.testQuestionCount.value);
      const questionTypes = Array.from(elements.testQuestionTypes.selectedOptions).map(option => option.value);
      const difficulty = elements.testDifficulty.value;

      const config = {
        questionCount,
        questionTypes,
        difficulty
      };
      generateGrammarTest(topicId, config);
    });
  }

  // Закрытие модального окна конфигурации теста
  if (elements.testConfigCloseBtn) {
    elements.testConfigCloseBtn.addEventListener('click', () => {
      elements.grammarTestConfigModal.style.display = 'none';
    });
  }

  // Генерация плана
  function openPlanModalWithDefaults() {
    const currentLevelElement = document.getElementById('currentLevel');
    const targetLevelElement = document.getElementById('targetLevel');
    if (currentLevelElement) {
      currentLevelElement.value = appData.settings[0].defaultCurrentLevel || 'B1';
    }
    if (targetLevelElement) {
      targetLevelElement.value = appData.settings[0].defaultTargetLevel || 'B2';
    }
    if (elements.planModal) {
      elements.planModal.style.display = 'block';
    }
  }

  if (elements.generatePlanBtnSkillTree) {
    elements.generatePlanBtnSkillTree.addEventListener('click', openPlanModalWithDefaults);
  }
  if (elements.generatePlanBtnAITools) {
    elements.generatePlanBtnAITools.addEventListener('click', openPlanModalWithDefaults);
  }

  const planDurationElement = document.getElementById('planDuration');
  if (planDurationElement) {
    planDurationElement.addEventListener('change', (e) => {
      const duration = e.target.value;
      const timePerWeekGroup = document.getElementById('timePerWeekGroup');
      const dayTimeGroup = document.getElementById('dayTimeGroup');
      const timePerWeekInput = document.getElementById('timePerWeek');

      if (timePerWeekGroup) {
        if (duration === 'day') {
          timePerWeekGroup.style.display = 'none';
          if (dayTimeGroup) dayTimeGroup.style.display = 'block';
          if (timePerWeekInput) timePerWeekInput.required = false;
        } else {
          timePerWeekGroup.style.display = 'block';
          if (dayTimeGroup) dayTimeGroup.style.display = 'none';
          if (timePerWeekInput) timePerWeekInput.required = true;
        }
      }
    });
  }

  if (elements.planForm) {
    elements.planForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = elements.planForm;
        const loader = document.querySelector('#planModal .loader-container');

        if (form) form.style.display = 'none';
        if (loader) loader.style.display = 'flex';

        const planDuration = document.getElementById('planDuration').value;
        const dailyRepetitions = document.getElementById('dailyRepetitions').value;
        const currentLevel = document.getElementById('currentLevel').value;
        const targetLevel = document.getElementById('targetLevel').value;
        const primaryGoal = document.getElementById('primaryGoal').value;
        const timePerWeek = document.getElementById('timePerWeek').value;
        const dayTimeInputs = document.querySelectorAll('.day-time-input');
        const dayTimes = Array.from(dayTimeInputs).map(input => input.value);
        const customSections = document.getElementById('customSections').value;

        const timePrompt = planDuration === 'day' 
          ? `The user can study at these times: ${dayTimes.join(', ')}.`
          : `Time per week: ${timePerWeek} hours.`;

        const replacements = {
          PRIMARY_GOAL: primaryGoal,
          PLAN_DURATION: planDuration,
          CURRENT_LEVEL: currentLevel || 'Not specified',
          TARGET_LEVEL: targetLevel || 'Not specified',
          TIME_PROMPT: timePrompt,
          DAILY_REPETITIONS: dailyRepetitions,
          CUSTOM_SECTIONS: customSections ? `The user also wants to include these custom sections: ${customSections}.` : ''
        };

        const contents = getPrompt('planGeneration', replacements);

        try {
            const response = await callGeminiAPI(contents, 'gemini-1.5-flash-latest');
            // Очистка ответа от Markdown и висячих запятых
            let jsonString = response.replace(/```json\n|```/g, '').trim();
            jsonString = jsonString.replace(/,\s*([}\]])/g, "$1");
            const planData = JSON.parse(jsonString);
            
            // Сохраняем новый план
            const newPlan = { id: 'main', ...planData };
            await updateData('progressTree', newPlan);
            
            const studyTimes = document.getElementById('planDuration').value === 'day'
              ? Array.from(document.querySelectorAll('.day-time-input')).map(input => input.value)
              : ['10:00'];

            // Парсим дерево и создаем сессии
            await parseTreeAndCreateSessions(planData, planDuration, dailyRepetitions, studyTimes);

            await loadData(); // Перезагружаем данные и обновляем UI
            
        } catch (error) {
            alert("Error generating plan: " + error.message);
            console.error(error);
        } finally {
            if (form) form.style.display = 'block';
            if (loader) loader.style.display = 'none';
            if (elements.planModal) elements.planModal.style.display = 'none';
        }
    });
  }

  // Обработчики для кнопок выбора периода диаграмм
  document.querySelectorAll('.chart-period-selector .period-btn').forEach(button => {
    if (button) {
      button.addEventListener('click', (e) => {
        const chartId = e.target.closest('.chart-period-selector').dataset.chart;
        const period = e.target.dataset.period;
        console.log(`Chart period button clicked: Chart ID - ${chartId}, Period - ${period}`);

        // Удаляем активный класс у всех кнопок в этом селекторе
        e.target.closest('.chart-period-selector').querySelectorAll('.period-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        // Добавляем активный класс к нажатой кнопке
        e.target.classList.add('active');

        // Обновляем соответствующий график
        if (chartId === 'goalChart') {
          updateGoalChart(period);
        } else if (chartId === 'vocabChart') {
          updateVocabChart(period);
        } else if (chartId === 'practiceChart') {
          updatePracticeChart(period);
        }
      });
    }
  });
}

// Добавьте эту функцию в script.js
async function initializeDefaultGrammarTopics() {
    // Проверяем, есть ли уже какие-либо темы в IndexedDB
  const lastRecommendationDate = localStorage.getItem('lastRecommendationDate');
  const today = new Date().toISOString().split('T')[0];
  
  if (lastRecommendationDate !== today) {
    try {
      const recommendations = await getCrossSectionRecommendations();
      showRecommendationNotification(recommendations);
      localStorage.setItem('lastRecommendationDate', today);
    } catch (error) {
      console.error("Could not show daily recommendations:", error);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  elements = {
    // Навигация
    sidebar: document.querySelector('.sidebar'),
    navLinks: document.querySelectorAll('.nav-links li'),
    sections: document.querySelectorAll('.section'),
    
    // Тема
    themeToggle: document.getElementById('themeToggle'),
    themeToggleSettings: document.getElementById('themeToggleSettings'),
    accentColor: document.getElementById('accentColor'),
    
    // Dashboard
    statsContainer: document.querySelector('.stats-container'),
    addWordBtnDashboard: document.getElementById('addWordBtnDashboard'),
    
    // Vocabulary
    addWordBtn: document.getElementById('addWordBtn'),
    vocabSearch: document.getElementById('vocabSearch'),
    vocabFilter: document.getElementById('vocabFilter'),
    vocabPartOfSpeech: document.getElementById('vocabPartOfSpeech'),
    vocabularyList: document.getElementById('vocabularyList'),
    
    // Practice Calendar
    addPracticeBtn: document.getElementById('addPracticeBtn'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    currentMonth: document.getElementById('currentMonth'),
    calendarGrid: document.getElementById('calendarGrid'),
    sessionsList: document.getElementById('sessionsList'),
    
    // Notes
    addNoteBtn: document.getElementById('addNoteBtn'),
    notesGrid: document.getElementById('notesGrid'),
    
    skillDetails: document.getElementById('skillDetails'),
    generatePlanBtnAITools: document.getElementById('generatePlanBtnAITools'),
    planModal: document.getElementById('planModal'),
    planForm: document.getElementById('planForm'),
    
    // Grammar Practice
    grammarSearch: document.getElementById('grammarSearch'),
    grammarLevel: document.getElementById('grammarLevel'),
    grammarCategory: document.getElementById('grammarCategory'),
    grammarTopicsList: document.getElementById('grammarTopicsList'),
    grammarContentArea: document.getElementById('grammarContentArea'),
    addGrammarTopicBtn: document.getElementById('addGrammarTopicBtn'),
    grammarTestConfigModal: document.getElementById('grammarTestConfigModal'),
    testQuestionCount: document.getElementById('testQuestionCount'),
    testQuestionTypes: document.getElementById('testQuestionTypes'),
    testDifficulty: document.getElementById('testDifficulty'),
    testConfigTopicId: document.getElementById('testConfigTopicId'),
    grammarTestConfigForm: document.getElementById('grammarTestConfigForm'),
    testConfigCloseBtn: document.getElementById('testConfigCloseBtn'),
    
    // AI Tools
    analyzeProgressBtn: document.getElementById('analyzeProgressBtn'),
    startConversationBtn: document.getElementById('startConversationBtn'),
    checkWritingBtn: document.getElementById('checkWritingBtn'),
    writingInput: document.getElementById('writingInput'),
    getTipsBtn: document.getElementById('getTipsBtn'),
    
    // Conversation Modal
    conversationModal: document.getElementById('conversationModal'),
    conversationMessages: document.getElementById('conversationMessages'),
    conversationInput: document.getElementById('conversationInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    conversationTopic: document.getElementById('conversationTopic'),
    restartConversationBtn: document.getElementById('restartConversationBtn'),
    
    // Settings
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importInput: document.getElementById('importInput'),
    resetBtn: document.getElementById('resetBtn'),
    notificationsToggle: document.getElementById('notificationsToggle'),
    reminderTime: document.getElementById('reminderTime'),
    dailyWordsGoal: document.getElementById('dailyWordsGoal'),
    dailyPracticeGoal: document.getElementById('dailyPracticeGoal'),
    aiAssistanceLevel: document.getElementById('aiAssistanceLevel'),
    aiFeedbackDetail: document.getElementById('aiFeedbackDetail'),
    language: document.getElementById('languageSelection'), // Обновлено для радиокнопок
    defaultCurrentLevel: document.getElementById('defaultCurrentLevel'),
    defaultTargetLevel: document.getElementById('defaultTargetLevel'),
    
    // Модальные окна
    modals: document.querySelectorAll('.modal'),
    closeButtons: document.querySelectorAll('.close, .close-modal'),
    wordModal: document.getElementById('wordModal'),
    practiceModal: document.getElementById('practiceModal'),
    noteModal: document.getElementById('noteModal'),
    noteViewModal: document.getElementById('noteViewModal'),
    confirmModal: document.getElementById('confirmModal'),
    wordForm: document.getElementById('wordForm'),
    practiceForm: document.getElementById('practiceForm'),
    noteForm: document.getElementById('noteForm'),
    wordModalTitle: document.getElementById('wordModalTitle'),
    practiceModalTitle: document.getElementById('practiceModalTitle'),
    noteModalTitle: document.getElementById('noteModalTitle'),
    noteViewTitle: document.getElementById('noteViewTitle'),
    noteViewContent: document.getElementById('noteViewContent'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmMessage: document.getElementById('confirmMessage'),
    confirmAction: document.getElementById('confirmAction'),
    confirmCancel: document.getElementById('confirmCancel'),
    editNoteBtn: document.getElementById('editNoteBtn'),
    deleteNoteBtn: document.getElementById('deleteNoteBtn'),
    
    // Элементы форм
    practiceDate: document.getElementById('practiceDate'),
    practiceTime: document.getElementById('practiceTime'),
    activityType: document.getElementById('activityType'),
    customActivity: document.getElementById('customActivity'),
    duration: document.getElementById('duration'),
    
    // Графики
    goalChart: document.getElementById('goalChart'),
    vocabChart: document.getElementById('vocabChart'),
    practiceChart: document.getElementById('practiceChart'),

    // Элементы формы слова (перемещены сюда для ранней инициализации)
    word: document.getElementById('word'),
    translation: document.getElementById('translation'),
    partOfSpeech: document.getElementById('partOfSpeech'),
    example: document.getElementById('example'),
    mastery: document.getElementById('mastery'),
    // Добавлены элементы для Creative Notes
    noteTitle: document.getElementById('noteTitle'),
    noteContent: document.getElementById('noteContent'),
  };

  // Инициализация Select2 для всех элементов, которые могут быть затронуты
  initSelect2(); 

  // Инициализация системы событий
  initEventSystem();
  
  // Загрузка и анализ профиля
  await loadData(); // Используем await здесь
  
  if (!appData.settings[0].learningProfile) {
    initializeLearningProfile();
  }

  // Перемещаем setupEventListeners() после loadData()
  setupEventListeners();
  
  // Выполняем функции, зависящие от AI, только если ключ API установлен
  if (GEMINI_API_KEY !== "YOUR_API_KEY") {
    updateLearningProfile();
  }
  
  // Проверка уведомлений каждые 5 минут
  setInterval(checkNotifications, 5 * 60 * 1000);
});

// Добавьте эту функцию в script.js
async function initializeDefaultGrammarTopics() {
    // Проверяем, есть ли уже какие-либо темы в IndexedDB
  const lastRecommendationDate = localStorage.getItem('lastRecommendationDate');
  const today = new Date().toISOString().split('T')[0];
  
  if (lastRecommendationDate !== today) {
    try {
      const recommendations = await getCrossSectionRecommendations();
      showRecommendationNotification(recommendations);
      localStorage.setItem('lastRecommendationDate', today);
    } catch (error) {
      console.error("Could not show daily recommendations:", error);
    }
  }
}
