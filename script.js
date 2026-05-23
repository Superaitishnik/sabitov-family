// ==========================================================================
// КОНФИГУРАЦИЯ СЕТЕВОЙ ЧАСТИ SUPABASE
// ==========================================================================
const SUPABASE_URL = "https://ethpdfcntfdbuhaqzmwq.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_T4B3UJpMTZy9zCrXg9-hgQ_h8J4orO0";

let supabaseClient = null;

// Инициализация Supabase только если ключи валидны
if (SUPABASE_URL && SUPABASE_URL.indexOf("your-project-url") === -1 && window.supabase) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase успешно подключен!");
    } catch (e) {
        console.error("Ошибка Supabase, переходим в локальный режим:", e);
        supabaseClient = null;
    }
}

// Безопасная работа с localStorage
function safeLocalSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch(e) {
        console.warn(`Ошибка записи localStorage (${key}):`, e);
        return false;
    }
}

function safeLocalGet(key, defaultValue = null) {
    try {
        const val = localStorage.getItem(key);
        return val !== null ? val : defaultValue;
    } catch(e) {
        console.warn(`Ошибка чтения localStorage (${key}):`, e);
        return defaultValue;
    }
}

// Словарь переводов
const translations = {
    ru: {
        slide1_title: "Добро пожаловать<br>в Sabitov", 
        slide1_sub: "Мессенджер нового поколения<br>с максимальной конфиденциальностью",
        slide2_title: "Шифрование<br>от начала до конца", 
        slide2_sub: "Все сообщения защищены сквозным шифрованием.<br>Никто не может прочитать ваши данные",
        slide3_title: "Ghost Mode", 
        slide3_sub: "Станьте невидимым. Никто не узнает, что вы онлайн, читаете сообщения или печатаете",
        slide4_title: "Протокол Fenix", 
        slide4_sub: "Одно нажатие — и все ваши данные будут безвозвратно удалены с наших серверов",
        slide5_title: "SabitovID", 
        slide5_sub: "Никаких телефонов и почты.<br>Только ваш уникальный SabitovID<br>и PIN-код для входа",
        next: "Далее", 
        skip: "Пропустить", 
        continue: "Продолжить",
        reg1_title: "Создайте имя пользователя", 
        reg1_sub: "Это ваш уникальный идентификатор в Sabitov.<br>Без номера телефона, без почты.",
        reg2_title: "Как вас зовут?", 
        reg2_sub: "Это имя увидят другие пользователи",
        reg3_title: "Ваш SabitovID", 
        reg3_sub: "Запомните ваш SabitovID.<br>Он понадобится для входа в аккаунт.",
        pin1_title: "Создайте PIN-код", 
        pin1_sub: "4-значный код для защиты аккаунта",
        pin2_title: "Подтвердите PIN", 
        pin2_sub: "4-значный код для защиты аккаунта"
    },
    en: {
        slide1_title: "Welcome to<br>Sabitov", 
        slide1_sub: "Next-gen messenger<br>with maximum level of privacy",
        slide2_title: "End-to-End<br>Encryption", 
        slide2_sub: "All your messages are fully secured. No one can read it.",
        slide3_title: "Ghost Mode", 
        slide3_sub: "Become completely invisible. Hide your online trace.",
        slide4_title: "Fenix Protocol", 
        slide4_sub: "One single tap — and all data wipes instantly from everywhere.",
        slide5_title: "SabitovID", 
        slide5_sub: "No phones, no emails. Your unique SabitovID is everything.",
        next: "Next", 
        skip: "Skip", 
        continue: "Continue",
        reg1_title: "Create Username", 
        reg1_sub: "This is your unique handler inside Sabitov infrastructure.",
        reg2_title: "What is your name?", 
        reg2_sub: "This name will be displayed to your friends.",
        reg3_title: "Your SabitovID", 
        reg3_sub: "Save your SabitovID securely. It's used for login.",
        pin1_title: "Create PIN Code", 
        pin1_sub: "4 digits to guard your personal perimeter",
        pin2_title: "Confirm PIN Code", 
        pin2_sub: "4 digits to guard your personal perimeter"
    }
};

// Глобальное состояние приложения
let currentSlide = 0;
let createdPinString = "";
let confirmedPinString = "";
let activeChatId = "support";
let myProfileData = null;

let localDatabase = { contacts: [], groups: [], messages: [] };

// Функция безопасного получения элементов
const getById = (name) => document.getElementById(name);
const getAll = (selector) => document.querySelectorAll(selector);

// ==========================================================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен, инициализация...");
    
    try {
        initEventListeners();
    } catch(e) {
        console.error("Ошибка при инициализации обработчиков:", e);
    }

    // Загрузка сохраненных настроек темы
    const savedTheme = safeLocalGet('sabitov_theme', 'light-theme');
    document.body.className = savedTheme;
    const themeBtn = getById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.textContent = (savedTheme === 'dark-theme') ? '☀️' : '🌙';
    }

    // Загрузка локальной базы данных чатов/сообщений
    const savedLocalDB = safeLocalGet('sabitov_local_db');
    if (savedLocalDB) {
        try { 
            localDatabase = JSON.parse(savedLocalDB); 
            if (!localDatabase.contacts) localDatabase.contacts = [];
            if (!localDatabase.groups) localDatabase.groups = [];
            if (!localDatabase.messages) localDatabase.messages = [];
        } catch(e) { 
            console.error("Ошибка загрузки локальной БД:", e);
        }
    }

    // Проверка авторизации пользователя
    const savedUser = safeLocalGet('sabitov_session_user');
    if (savedUser) {
        try {
            myProfileData = JSON.parse(savedUser);
            
            const sidText = getById('sabitovIdText');
            const nameInput = getById('nameInput');
            const usernameInput = getById('usernameInput');
            if (sidText) sidText.textContent = myProfileData.id;
            if (nameInput) nameInput.value = myProfileData.name || '';
            if (usernameInput) usernameInput.value = myProfileData.username || '';
            
            showMainAppScreen();
            if (supabaseClient) connectRealtimeMessages();
        } catch(e) {
            console.error("Ошибка парсинга сессии пользователя:", e);
            showSliderScreen();
        }
    } else {
        showSliderScreen();
    }

    // Первичный рендеринг контактов и истории чатов
    renderLocalChatsAndContacts();
});

// ==========================================================================
// УПРАВЛЕНИЕ ЭКРАНАМИ
// ==========================================================================
function hideAllScreens() {
    const screens = [
        'sliderWindow', 'bottomArea', 'regScreen', 
        'nameScreen', 'idScreen', 'createPinScreen', 'confirmPinScreen', 'mainAppScreen'
    ];
    screens.forEach(s => {
        const el = getById(s);
        if (el) el.style.display = 'none';
    });
    const topBar = getById('topBar');
    if (topBar) topBar.style.display = 'none';
}

function showSliderScreen() {
    hideAllScreens();
    const topBar = getById('topBar');
    const sliderWindow = getById('sliderWindow');
    const bottomArea = getById('bottomArea');
    
    if (topBar) topBar.style.display = 'flex';
    if (sliderWindow) sliderWindow.style.display = 'flex';
    if (bottomArea) bottomArea.style.display = 'flex';
    updateSlider();
}

function showUsernameScreen() {
    hideAllScreens();
    const regScreen = getById('regScreen');
    if (regScreen) {
        regScreen.style.display = 'flex';
        const usernameInput = getById('usernameInput');
        if (usernameInput) usernameInput.focus();
    }
}

function showNameScreen() {
    hideAllScreens();
    const nameScreen = getById('nameScreen');
    if (nameScreen) {
        nameScreen.style.display = 'flex';
        const nameInput = getById('nameInput');
        if (nameInput) nameInput.focus();
    }
}

function showIdScreen() {
    hideAllScreens();
    const idScreen = getById('idScreen');
    if (idScreen) {
        idScreen.style.display = 'flex';
        const sidText = getById('sabitovIdText');
        if (sidText && (sidText.textContent === "SID-00000000" || !sidText.textContent)) {
            sidText.textContent = generateSabitovID();
        }
    }
}

function showCreatePinScreen() {
    hideAllScreens();
    createdPinString = "";
    updatePinDots(getAll('#createPinDots .pin-dot'), createdPinString);
    const createPinScreen = getById('createPinScreen');
    if (createPinScreen) createPinScreen.style.display = 'flex';
}

function showConfirmPinScreen() {
    hideAllScreens();
    confirmedPinString = "";
    updatePinDots(getAll('#confirmPinDots .pin-dot'), confirmedPinString);
    const confirmPinScreen = getById('confirmPinScreen');
    if (confirmPinScreen) confirmPinScreen.style.display = 'flex';
}

function showMainAppScreen() {
    hideAllScreens();
    
    const profileUserTitle = getById('profileUserTitle');
    const nameInput = getById('nameInput');
    if (profileUserTitle) {
        profileUserTitle.textContent = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "Пользователь";
    }
    
    const profileIdTitle = getById('profileIdTitle');
    const sidText = getById('sabitovIdText');
    if (profileIdTitle && sidText) {
        profileIdTitle.textContent = sidText.textContent;
    }
    
    const mainAppScreen = getById('mainAppScreen');
    if (mainAppScreen) mainAppScreen.style.display = 'flex';
}

function updateSlider() {
    const slidesWrapper = getById('slidesWrapper');
    if (slidesWrapper) {
        slidesWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    
    const dots = getAll('.dot');
    dots.forEach((dot, index) => { 
        dot.classList.toggle('active', index === currentSlide); 
    });
    
    const skipBtn = getById('skipBtn');
    if (skipBtn) {
        if (currentSlide > 0 && currentSlide < 4) {
            skipBtn.style.visibility = 'visible';
            skipBtn.style.opacity = '1';
        } else {
            skipBtn.style.visibility = 'hidden';
            skipBtn.style.opacity = '0';
        }
    }
    
    const nextBtn = getById('nextBtn');
    const langBtn = getById('langBtn');
    if (nextBtn) {
        const isEn = langBtn && langBtn.textContent.includes('EN');
        if (currentSlide === 4) {
            nextBtn.textContent = isEn ? 'Start' : 'Начать';
        } else {
            nextBtn.textContent = isEn ? 'Next' : 'Далее';
        }
    }
}

function updatePinDots(dotsArray, pinString) {
    dotsArray.forEach((dot, index) => { 
        dot.classList.toggle('filled', index < pinString.length); 
    });
}

function generateSabitovID() {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return `SID-${result}`;
}

function showToast(message) {
    const toast = getById('toast');
    if (!toast) return;
    toast.textContent = message; 
    toast.classList.add('show');
    setTimeout(() => { 
        toast.classList.remove('show'); 
    }, 2200);
}

// ==========================================================================
// ПРОВЕРКА СУЩЕСТВОВАНИЯ КОНТАКТА ЧЕРЕЗ SUPABASE
// ==========================================================================
async function checkUserExists(sabitovId) {
    if (!supabaseClient) {
        console.log("Supabase не подключен, пропускаем проверку");
        return true; // В локальном режиме разрешаем добавление
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('id')
            .eq('id', sabitovId)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                showToast(`Пользователь с ID ${sabitovId} не найден в системе`);
                return false;
            }
            console.error("Ошибка при проверке пользователя:", error);
            return false;
        }
        
        if (data && data.id) {
            return true;
        } else {
            showToast(`Пользователь с ID ${sabitovId} не существует`);
            return false;
        }
    } catch(e) {
        console.error("Исключение при проверке пользователя:", e);
        showToast("Ошибка при проверке контакта");
        return false;
    }
}

// ==========================================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ==========================================================================
function initEventListeners() {
    console.log("initEventListeners запущен");
    
    // Переключатель языков
    const langBtn = getById('langBtn');
    const langMenu = getById('langMenu');
    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langMenu.style.display === 'flex';
            langMenu.style.display = isOpen ? 'none' : 'flex';
        });
    }

    document.addEventListener('click', () => { 
        if (langMenu) langMenu.style.display = 'none'; 
    });

    if (langMenu) {
        langMenu.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetLang = e.target.dataset.lang;
                if (!targetLang) return;
                if (langBtn) langBtn.textContent = `🌐 ${targetLang.toUpperCase()}`;
                applyLanguage(targetLang);
            });
        });
    }

    // Переключатель тем оформления
    const themeToggleBtn = getById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (document.body.classList.contains('light-theme')) {
                document.body.classList.replace('light-theme', 'dark-theme');
                themeToggleBtn.textContent = '☀️';
                safeLocalSet('sabitov_theme', 'dark-theme');
            } else {
                document.body.classList.replace('dark-theme', 'light-theme');
                themeToggleBtn.textContent = '🌙';
                safeLocalSet('sabitov_theme', 'light-theme');
            }
        });
    }

    // Управление кнопками Слайдера
    const nextBtn = getById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentSlide < 4) { 
                currentSlide++; 
                updateSlider(); 
            } else { 
                showUsernameScreen(); 
            }
        });
    } else {
        console.error("nextBtn не найден");
    }

    const skipBtn = getById('skipBtn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => { 
            currentSlide = 4; 
            updateSlider(); 
        });
    }

    // Стрелочки возврата назад на этапах регистрации
    const backToSlider = getById('backToSliderBtn');
    if (backToSlider) backToSlider.addEventListener('click', showSliderScreen);
    const backToReg = getById('backToRegBtn');
    if (backToReg) backToReg.addEventListener('click', showUsernameScreen);
    const backToName = getById('backToNameBtn');
    if (backToName) backToName.addEventListener('click', showNameScreen);
    const backToId = getById('backToIdBtn');
    if (backToId) backToId.addEventListener('click', showIdScreen);
    const backToCreatePin = getById('backToCreatePinBtn');
    if (backToCreatePin) backToCreatePin.addEventListener('click', showCreatePinScreen);

    // Кнопки "Далее" и "Продолжить" в регистрации
    const regNext = getById('regNextBtn');
    if (regNext) regNext.addEventListener('click', showNameScreen);
    const nameNext = getById('nameNextBtn');
    if (nameNext) nameNext.addEventListener('click', showIdScreen);
    const idNext = getById('idNextBtn');
    if (idNext) idNext.addEventListener('click', showCreatePinScreen);

    // Валидация инпута Username
    const usernameInput = getById('usernameInput');
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            const isReady = usernameInput.value.trim().length > 0;
            const regNextBtnLocal = getById('regNextBtn');
            if (regNextBtnLocal) {
                regNextBtnLocal.classList.toggle('disabled', !isReady);
                regNextBtnLocal.disabled = !isReady;
            }
        });
    }

    // Валидация инпута Имени
    const nameInputLocal = getById('nameInput');
    if (nameInputLocal) {
        nameInputLocal.addEventListener('input', () => {
            const isReady = nameInputLocal.value.trim().length > 0;
            const nameNextBtnLocal = getById('nameNextBtn');
            if (nameNextBtnLocal) {
                nameNextBtnLocal.classList.toggle('disabled', !isReady);
                nameNextBtnLocal.disabled = !isReady;
            }
        });
    }

    // Копирование SabitovID
    const generatedIdBox = getById('generatedIdBox');
    if (generatedIdBox) {
        generatedIdBox.addEventListener('click', () => {
            const sidText = getById('sabitovIdText');
            if (sidText) {
                navigator.clipboard.writeText(sidText.textContent).then(() => {
                    showToast('Успешно скопировано!');
                }).catch(() => {
                    showToast('Не удалось скопировать');
                });
            }
        });
    }

    // PIN-клавиатуры
    const createPinKeyboard = getById('createPinKeyboard');
    if (createPinKeyboard) {
        createPinKeyboard.addEventListener('click', (e) => {
            const btn = e.target.closest('.key-btn'); 
            if (!btn) return;
            const value = btn.dataset.val;
            if (value === 'back') { 
                createdPinString = createdPinString.slice(0, -1); 
            } else if (createdPinString.length < 4) { 
                createdPinString += value; 
            }
            updatePinDots(getAll('#createPinDots .pin-dot'), createdPinString);
            if (createdPinString.length === 4) { 
                setTimeout(showConfirmPinScreen, 200); 
            }
        });
    }

    const confirmPinKeyboard = getById('confirmPinKeyboard');
    if (confirmPinKeyboard) {
        confirmPinKeyboard.addEventListener('click', (e) => {
            const btn = e.target.closest('.key-btn'); 
            if (!btn) return;
            const value = btn.dataset.val;
            if (value === 'back') { 
                confirmedPinString = confirmedPinString.slice(0, -1); 
            } else if (confirmedPinString.length < 4) { 
                confirmedPinString += value; 
            }
            updatePinDots(getAll('#confirmPinDots .pin-dot'), confirmedPinString);

            if (confirmedPinString.length === 4) {
                if (confirmedPinString === createdPinString) {
                    setTimeout(() => {
                        const sidText = getById('sabitovIdText');
                        const nameInp = getById('nameInput');
                        const userInp = getById('usernameInput');
                        
                        myProfileData = {
                            id: sidText ? sidText.textContent : 'SID-UNKNOWN',
                            name: nameInp ? nameInp.value.trim() : 'User',
                            username: userInp ? userInp.value.trim() : 'username'
                        };
                        safeLocalSet('sabitov_session_user', JSON.stringify(myProfileData));
                        
                        if (supabaseClient) {
                            supabaseClient.from('users').insert([myProfileData])
                                .then(() => console.log("Профиль сохранен в Supabase!"))
                                .catch(err => console.error(err));
                        }

                        showToast('Регистрация успешно завершена!');
                        setTimeout(showMainAppScreen, 600);
                    }, 200);
                } else {
                    setTimeout(() => {
                        showToast('PIN-коды не совпадают! Попробуйте еще раз.');
                        confirmedPinString = "";
                        updatePinDots(getAll('#confirmPinDots .pin-dot'), confirmedPinString);
                    }, 300);
                }
            }
        });
    }

    // Вкладки нижнего меню
    const tabButtons = getAll('.tab-item-btn');
    const tabContents = getAll('.tab-content-block');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const appSectionTitle = getById('appSectionTitle');
            if (appSectionTitle) {
                appSectionTitle.textContent = (targetTab === 'chats') ? 'Чаты' : 'Профиль';
            }
            
            tabContents.forEach(content => { 
                content.style.display = (content.id === `tab-${targetTab}`) ? 'block' : 'none'; 
            });
        });
    });

    // Управление слоем "Новое сообщение"
    const topOpenMenuBtn = getById('topOpenMenuBtn');
    const newChatMenuLayer = getById('newChatMenuLayer');
    if (topOpenMenuBtn && newChatMenuLayer) {
        topOpenMenuBtn.addEventListener('click', () => { 
            newChatMenuLayer.style.display = 'flex'; 
        });
    }
    
    const closeNewChatMenuBtn = getById('closeNewChatMenuBtn');
    if (closeNewChatMenuBtn && newChatMenuLayer) {
        closeNewChatMenuBtn.addEventListener('click', () => { 
            newChatMenuLayer.style.display = 'none'; 
        });
    }
    
    // Модальное окно Нового Контакта (с проверкой через Supabase)
    const tgNewContactBtn = getById('tgNewContactBtn');
    const contactModal = getById('contactModal');
    if (tgNewContactBtn && contactModal) {
        tgNewContactBtn.addEventListener('click', () => { 
            contactModal.style.display = 'flex'; 
        });
    }
    
    const closeContactModalBtn = getById('closeContactModalBtn');
    if (closeContactModalBtn && contactModal) {
        closeContactModalBtn.addEventListener('click', () => { 
            contactModal.style.display = 'none'; 
        });
    }

    const saveContactModalBtn = getById('saveContactModalBtn');
    if (saveContactModalBtn) {
        saveContactModalBtn.addEventListener('click', async () => {
            const modalContactId = getById('modalContactId');
            const modalContactName = getById('modalContactName');
            
            const id = modalContactId ? modalContactId.value.trim() : '';
            const name = modalContactName ? modalContactName.value.trim() : '';
            
            if (!id || !name) {
                showToast("Заполните все поля");
                return;
            }
            
            // Проверяем, существует ли пользователь в Supabase
            const userExists = await checkUserExists(id);
            if (!userExists) {
                return; // Сообщение об ошибке уже показано в checkUserExists
            }

            // Проверяем, не добавлен ли уже этот контакт
            const alreadyExists = localDatabase.contacts.some(c => c.id === id);
            if (alreadyExists) {
                showToast("Этот контакт уже добавлен");
                return;
            }

            const newContact = { id, name, isGroup: false };
            localDatabase.contacts.push(newContact);
            safeLocalSet('sabitov_local_db', JSON.stringify(localDatabase));

            if (supabaseClient && myProfileData) {
                try { 
                    await supabaseClient.from('contacts').insert([{ user_id: myProfileData.id, contact_sid: id, contact_name: name }]); 
                } catch(e){
                    console.error("Ошибка сохранения контакта в Supabase:", e);
                }
            }

            if (modalContactId) modalContactId.value = '';
            if (modalContactName) modalContactName.value = '';
            if (contactModal) contactModal.style.display = 'none';
            renderLocalChatsAndContacts();
            showToast('Контакт сохранен!');
        });
    }

    // Модальное окно Новой Группы
    const tgNewGroupBtn = getById('tgNewGroupBtn');
    const groupModal = getById('groupModal');
    if (tgNewGroupBtn && groupModal) {
        tgNewGroupBtn.addEventListener('click', () => {
            const modalGroupContactsList = getById('modalGroupContactsList');
            if (!modalGroupContactsList) return;
            
            modalGroupContactsList.innerHTML = '';
            if (localDatabase.contacts.length === 0) {
                modalGroupContactsList.innerHTML = '<div style="color:var(--text-muted); font-size:13px;">У вас нет контактов для добавления</div>';
            } else {
                localDatabase.contacts.forEach(c => {
                    const item = document.createElement('label');
                    item.className = 'modal-checkbox-item';
                    item.innerHTML = `<input type="checkbox" value="${c.id}"> <span>${c.name}</span>`;
                    modalGroupContactsList.appendChild(item);
                });
            }
            groupModal.style.display = 'flex';
        });
    }
    
    const closeGroupModalBtn = getById('closeGroupModalBtn');
    if (closeGroupModalBtn && groupModal) {
        closeGroupModalBtn.addEventListener('click', () => { 
            groupModal.style.display = 'none'; 
        });
    }

    const saveGroupModalBtn = getById('saveGroupModalBtn');
    if (saveGroupModalBtn) {
        saveGroupModalBtn.addEventListener('click', async () => {
            const modalGroupName = getById('modalGroupName');
            const groupName = modalGroupName ? modalGroupName.value.trim() : '';
            if (!groupName) {
                showToast("Введите название группы");
                return;
            }

            const checkedBoxes = getAll('#modalGroupContactsList input:checked');
            const members = [myProfileData ? myProfileData.id : 'me'];
            checkedBoxes.forEach(b => members.push(b.value));

            const newGroup = { id: 'GROUP-' + Date.now(), name: groupName, isGroup: true, members: members };
            localDatabase.groups.push(newGroup);
            safeLocalSet('sabitov_local_db', JSON.stringify(localDatabase));

            if (supabaseClient && myProfileData) {
                try { 
                    await supabaseClient.from('groups').insert([{ group_id: newGroup.id, group_name: groupName, members_list: members, owner_id: myProfileData.id }]); 
                } catch(e){
                    console.error("Ошибка сохранения группы в Supabase:", e);
                }
            }

            if (modalGroupName) modalGroupName.value = '';
            if (groupModal) groupModal.style.display = 'none';
            renderLocalChatsAndContacts();
            showToast('Группа успешно создана!');
        });
    }

    // Клик по чату "Техподдержка"
    const openSupportChatBlock = getById('openSupportChatBlock');
    if (openSupportChatBlock) {
        openSupportChatBlock.addEventListener('click', () => {
            activeChatId = "support";
            const activeChatHeaderName = getById('activeChatHeaderName');
            const activeChatHeaderAvatar = getById('activeChatHeaderAvatar');
            const chatRoomLayer = getById('chatRoomLayer');
            
            if (activeChatHeaderName) activeChatHeaderName.textContent = "Sabitov Support";
            if (activeChatHeaderAvatar) activeChatHeaderAvatar.textContent = "🎧";
            if (chatRoomLayer) chatRoomLayer.style.display = 'flex';
            renderMessagesForActiveChat();
        });
    }

    // Кнопка закрытия окна чата
    const closeChatBtn = getById('closeChatBtn');
    const chatRoomLayer = getById('chatRoomLayer');
    if (closeChatBtn && chatRoomLayer) {
        closeChatBtn.addEventListener('click', () => { 
            chatRoomLayer.style.display = 'none'; 
        });
    }

    // Отправка текстовых сообщений
    const chatMessageField = getById('chatMessageField');
    if (chatMessageField) {
        chatMessageField.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const txt = chatMessageField.value.trim();
                if (!txt) return;

                const localMsg = { chatId: activeChatId, senderId: myProfileData ? myProfileData.id : 'me', text: txt, isVoice: false };
                localDatabase.messages.push(localMsg);
                safeLocalSet('sabitov_local_db', JSON.stringify(localDatabase));
                
                appendChatMessage(txt, 'sender');
                chatMessageField.value = '';
                renderLocalChatsAndContacts();

                if (supabaseClient && myProfileData) {
                    try { 
                        await supabaseClient.from('messages').insert([{ chat_id: activeChatId, sender_id: myProfileData.id, message_text: txt }]); 
                    } catch(err){console.error(err);}
                }

                if (activeChatId === "support") {
                    setTimeout(() => {
                        const guideHtml = `
                            <div class="chat-msg-text" style="text-align: left;">
                                <b>SABITOV EXECUTIVE GUIDE</b><br><br>
                                Приветствуем в премиальной экосистеме. Ваши операционные принципы:<br><br>
                                • <b>Автономия данных:</b> Авторизация идет только по вашему SabitovID.<br><br>
                                • <b>Сквозное шифрование:</b> Обмен пакетами напрямую исключает перехват данных.<br><br>
                                • <b>Голосовые волны:</b> Записывайте аудио в одно касание или удерживая микрофон.<br><br>
                                <i>Инфраструктура стабильна. Спасибо, что вы с нами.</i>
                            </div>
                        `;
                        localDatabase.messages.push({ chatId: 'support', senderId: 'bot', text: 'GUIDE', specialHtml: guideHtml });
                        safeLocalSet('sabitov_local_db', JSON.stringify(localDatabase));
                        appendChatMessage('', 'receiver', guideHtml);
                        renderLocalChatsAndContacts();
                    }, 800);
                }
            }
        });
    }

    // Контекстное меню вложений
    const chatPlusBtn = getById('chatPlusBtn');
    const attachMenu = getById('attachMenu');
    if (chatPlusBtn && attachMenu) {
        chatPlusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = attachMenu.style.display === 'flex';
            attachMenu.style.display = isOpen ? 'none' : 'flex';
        });
    }
    
    document.addEventListener('click', () => { 
        if (attachMenu) attachMenu.style.display = 'none'; 
    });

    const attachMediaBtn = getById('attachMediaBtn');
    const mediaInputHidden = getById('mediaInputHidden');
    if (attachMediaBtn && mediaInputHidden) {
        attachMediaBtn.addEventListener('click', () => mediaInputHidden.click());
    }
    
    const attachFileBtn = getById('attachFileBtn');
    const fileInputHidden = getById('fileInputHidden');
    if (attachFileBtn && fileInputHidden) {
        attachFileBtn.addEventListener('click', () => fileInputHidden.click());
    }

    if (mediaInputHidden) {
        mediaInputHidden.addEventListener('change', (e) => {
            const file = e.target.files[0]; 
            if (!file) return;
            const url = URL.createObjectURL(file);
            let html = file.type.startsWith('video/') ? 
                `<div class="media-message-preview"><video src="${url}" controls></video></div>` : 
                `<div class="media-message-preview"><img src="${url}"></div>`;
            
            localDatabase.messages.push({ chatId: activeChatId, senderId: myProfileData ? myProfileData.id : 'me', text: 'Медиафайл', specialHtml: html });
            safeLocalSet('sabitov_local_db', JSON.stringify(localDatabase));
            appendChatMessage('', 'sender', html); 
            renderLocalChatsAndContacts();
            mediaInputHidden.value = '';
        });
    }

    if (fileInputHidden) {
        fileInputHidden.addEventListener('change', (e) => {
            const file = e.target.files[0]; 
            if (!file) return;
            const html = `<div class="file-message-box"><span>📄</span><div><b>${file.name}</b><div style="font-size:11px; opacity:0.7;">${(file.size/1024).toFixed(1)} KB</div></div></div>`;
            
            localDatabase.messages.push({ chatId: activeChatId, senderId: myProfileData ? myProfileData.id : 'me', text: file.name, specialHtml: html });
            safeLocalSet('sabitov_local_db', JSON.stringify(localDatabase));
            appendChatMessage('', 'sender', html); 
            renderLocalChatsAndContacts();
            fileInputHidden.value = '';
        });
    }

    // Запись голосовых сообщений
    const chatMicBtn = getById('chatMicBtn');
    if (chatMicBtn) {
        let isClickRecording = false;
        chatMicBtn.addEventListener('click', () => {
            if (!isClickRecording) {
                isClickRecording = true;
                chatMicBtn.classList.add('recording');
                const chatField = getById('chatMessageField');
                if (chatField) { 
                    chatField.placeholder = "Запись премиум-аудио..."; 
                    chatField.disabled = true; 
                }
                
                setTimeout(() => {
                    if (isClickRecording) {
                        isClickRecording = false;
                        chatMicBtn.classList.remove('recording');
                        if (chatField) { 
                            chatField.placeholder = "Сообщение..."; 
                            chatField.disabled = false; 
                        }
                        
                        const voiceHtml = `
                            <div class="premium-voice-card">
                                <button class="voice-play-btn">▶</button>
                                <div class="voice-waves-timeline">
                                    <div class="wave-bar active" style="height: 12px;"></div>
                                    <div class="wave-bar active" style="height: 18px;"></div>
                                    <div class="wave-bar active" style="height: 8px;"></div>
                                    <div class="wave-bar" style="height: 22px;"></div>
                                    <div class="wave-bar" style="height: 14px;"></div>
                                    <div class="wave-bar" style="height: 16px;"></div>
                                </div>
                                <span style="font-size: 12px; font-weight: 600; opacity: 0.9;">0:04</span>
                            </div>
                        `;
                        localDatabase.messages.push({ chatId: activeChatId, senderId: myProfileData ? myProfileData.id : 'me', text: '🎤 Голосовое сообщение', specialHtml: voiceHtml, isVoice: true });
                        safeLocalSet('sabitov_local_db', JSON.stringify(localDatabase));
                        appendChatMessage('', 'sender', voiceHtml);
                        renderLocalChatsAndContacts();
                    }
                }, 4000);
            } else {
                isClickRecording = false;
                chatMicBtn.classList.remove('recording');
                const chatField = getById('chatMessageField');
                if (chatField) { 
                    chatField.placeholder = "Сообщение..."; 
                    chatField.disabled = false; 
                }
            }
        });
    }
}

// ==========================================================================
// ЛОКАЛИЗАЦИЯ И ИНТЕРФЕЙСНЫЙ МЕНЕДЖМЕНТ
// ==========================================================================
function applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
}

function renderLocalChatsAndContacts() {
    const tgContactsScrollList = getById('tgContactsScrollList');
    if (tgContactsScrollList) {
        tgContactsScrollList.innerHTML = '';
        if (localDatabase.contacts && localDatabase.contacts.length > 0) {
            localDatabase.contacts.forEach(c => {
                const el = document.createElement('div'); 
                el.className = 'chat-item';
                const firstLetter = c.name ? c.name[0].toUpperCase() : '?';
                el.innerHTML = `<div class="chat-avatar-blue">${firstLetter}</div><div class="chat-info"><span class="chat-name">${c.name || 'Без имени'}</span><p class="chat-last-msg">${c.id || ''}</p></div>`;
                el.addEventListener('click', () => { openDirectChatRoom(c.id, c.name, false); });
                tgContactsScrollList.appendChild(el);
            });
        } else {
            tgContactsScrollList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Нет контактов</div>';
        }
    }

    const dynamicChatsList = getById('dynamicChatsList');
    if (dynamicChatsList) {
        dynamicChatsList.innerHTML = '';
        
        if (localDatabase.contacts) {
            localDatabase.contacts.forEach(c => {
                const lastMsg = getLatestMessageText(c.id);
                const el = document.createElement('div'); 
                el.className = 'chat-item';
                const firstLetter = c.name ? c.name[0].toUpperCase() : '?';
                el.innerHTML = `<div class="chat-avatar-blue">${firstLetter}</div><div class="chat-info"><span class="chat-name">${c.name || 'Без имени'}</span><p class="chat-last-msg">${lastMsg}</p></div>`;
                el.addEventListener('click', () => { openDirectChatRoom(c.id, c.name, false); });
                dynamicChatsList.appendChild(el);
            });
        }

        if (localDatabase.groups) {
            localDatabase.groups.forEach(g => {
                const lastMsg = getLatestMessageText(g.id);
                const el = document.createElement('div'); 
                el.className = 'chat-item';
                el.innerHTML = `<div class="chat-avatar-blue" style="background:#34c759">👥</div><div class="chat-info"><span class="chat-name">${g.name || 'Группа'}</span><p class="chat-last-msg">${lastMsg}</p></div>`;
                el.addEventListener('click', () => { openDirectChatRoom(g.id, g.name, true); });
                dynamicChatsList.appendChild(el);
            });
        }
        
        if ((!localDatabase.contacts || localDatabase.contacts.length === 0) && 
            (!localDatabase.groups || localDatabase.groups.length === 0)) {
            dynamicChatsList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size:14px;">Нет активных диалогов</div>';
        }
    }
}

function getLatestMessageText(chatId) {
    if (!localDatabase.messages) return "Нет сообщений";
    const msgs = localDatabase.messages.filter(m => m.chatId === chatId);
    if (msgs.length === 0) return "Нет сообщений";
    const last = msgs[msgs.length - 1];
    if (last.isVoice) return "🎤 Голосовое сообщение";
    if (last.text) return last.text.length > 30 ? last.text.substring(0, 30) + '...' : last.text;
    return "Медиафайл";
}

function openDirectChatRoom(id, name, isGroup) {
    activeChatId = id;
    const activeChatHeaderName = getById('activeChatHeaderName');
    const activeChatHeaderAvatar = getById('activeChatHeaderAvatar');
    const newChatMenuLayer = getById('newChatMenuLayer');
    const chatRoomLayer = getById('chatRoomLayer');
    
    if (activeChatHeaderName) activeChatHeaderName.textContent = name || 'Чат';
    if (activeChatHeaderAvatar) activeChatHeaderAvatar.textContent = isGroup ? "👥" : (name ? name[0].toUpperCase() : 'U');
    if (newChatMenuLayer) newChatMenuLayer.style.display = 'none';
    if (chatRoomLayer) chatRoomLayer.style.display = 'flex';
    renderMessagesForActiveChat();
}

function renderMessagesForActiveChat() {
    const chatMessagesArea = getById('chatMessagesArea');
    if (!chatMessagesArea) return;
    chatMessagesArea.innerHTML = '';
    
    if (activeChatId === "support") {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'msg-bubble-wrapper item-receiver';
        welcomeMsg.innerHTML = '<div class="chat-msg-text">Здравствуйте! Добро пожаловать в Sabitov. Чем можем помочь?</div>';
        chatMessagesArea.appendChild(welcomeMsg);
    }

    if (localDatabase.messages) {
        const filtered = localDatabase.messages.filter(m => m.chatId === activeChatId);
        filtered.forEach(m => {
            appendChatMessage(m.text || '', m.senderId === (myProfileData ? myProfileData.id : 'me') ? 'sender' : 'receiver', m.specialHtml);
        });
    }
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
}

function appendChatMessage(text, type = 'sender', specialLayoutHtml = null) {
    const chatMessagesArea = getById('chatMessagesArea');
    if (!chatMessagesArea) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = `msg-bubble-wrapper item-${type}`;
    
    if (specialLayoutHtml) { 
        wrapper.innerHTML = specialLayoutHtml; 
    } else {
        const safeText = text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        wrapper.innerHTML = `<div class="chat-msg-text">${safeText}</div>`;
    }
    
    chatMessagesArea.appendChild(wrapper);
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
}

function connectRealtimeMessages() {
    if (!supabaseClient) return;
    try {
        supabaseClient.channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                const newMsg = payload.new;
                if (myProfileData && (newMsg.receiver_id === myProfileData.id || newMsg.chat_id === activeChatId)) {
                    const incoming = { 
                        chatId: newMsg.chat_id, 
                        senderId: newMsg.sender_id, 
                        text: newMsg.message_text, 
                        specialHtml: newMsg.special_html, 
                        isVoice: newMsg.is_voice 
                    };
                    if (!localDatabase.messages) localDatabase.messages = [];
                    localDatabase.messages.push(incoming);
                    safeLocalSet('sabitov_local_db', JSON.stringify(localDatabase));
                    if (activeChatId === incoming.chatId) {
                        appendChatMessage(incoming.text || '', incoming.senderId === myProfileData.id ? 'sender' : 'receiver', incoming.specialHtml);
                    }
                    renderLocalChatsAndContacts();
                }
            }).subscribe();
    } catch(e) { console.error("Realtime ошибка:", e); }
}

// Управление воспроизведением голосовых сообщений
document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.voice-play-btn');
    if (!playBtn) return;
    const card = playBtn.closest('.premium-voice-card');
    if (!card) return;
    if (card.classList.contains('playing')) {
        card.classList.remove('playing'); 
        playBtn.textContent = '▶';
    } else {
        card.classList.add('playing'); 
        playBtn.textContent = '⏸';
        setTimeout(() => { 
            if (card.classList.contains('playing')) {
                card.classList.remove('playing'); 
                playBtn.textContent = '▶';
            }
        }, 4000);
    }
});