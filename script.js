// ==========================================================================
// КОНФИГУРАЦИЯ СЕТЕВОЙ ЧАСТИ SUPABASE
// ==========================================================================
const SUPABASE_URL = "https://ethpdfcntfdbuhaqzmwq.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_T4B3UJpMTZy9zCrXg9-hgQ_h8J4orO0";

let supabase = null;

// Инициализация Supabase только если ключи валидны
if (SUPABASE_URL && SUPABASE_URL.indexOf("your-project-url") === -1 && window.supabase) {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase успешно подключен!");
    } catch (e) {
        console.error("Ошибка Supabase, переходим в локальный режим:", e);
        supabase = null;
    }
}

// Словарь переводов
const translations = {
    ru: {
        slide1_title: "Добро пожаловать<br>в Sabitov", 
        slide1_sub: "Мессенджер нового поколения<br>с максимальной конфиденциальностью",
        slide2_title: "Шифрование<br>от начала до конца", 
        slide2_sub: "Все сообщения защищены сквозным шифрованием.",
        slide3_title: "Ghost Mode", 
        slide3_sub: "Станьте невидимым. Никто не узнает, что вы онлайн.",
        slide4_title: "Протокол Fenix", 
        slide4_sub: "Одно нажатие — и все данные будут безвозвратно удалены.",
        slide5_title: "SabitovID", 
        slide5_sub: "Никаких телефонов и почты. Только ваш уникальный SabitovID.",
        next: "Далее", 
        skip: "Пропустить", 
        continue: "Продолжить",
        reg1_title: "Создайте имя пользователя", 
        reg1_sub: "Это ваш уникальный идентификатор в Sabitov.",
        reg2_title: "Как вас зовут?", 
        reg2_sub: "Это имя увидят другие пользователи",
        reg3_title: "Ваш SabitovID", 
        reg3_sub: "Запомните ваш SabitovID. Он нужен для входа.",
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

// Глобальное состояние
let currentSlide = 0;
let createdPinString = "";
let confirmedPinString = "";
let activeChatId = "support";
let myProfileData = null;

let localDatabase = { contacts: [], groups: [], messages: [] };

// Функция безопасного получения элементов
const getById = (name) => document.getElementById(name);
const getAll = (selector) => document.querySelectorAll(selector);

// Инициализация интерфейса после загрузки DOM
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен, инициализация...");
    
    // Загрузка сохраненных данных
    const savedUser = localStorage.getItem('sabitov_session_user');
    const savedTheme = localStorage.getItem('sabitov_theme') || 'light-theme';
    document.body.className = savedTheme;
    
    const themeBtn = getById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.textContent = (savedTheme === 'dark-theme') ? '☀️' : '🌙';
    }

    const savedLocalDB = localStorage.getItem('sabitov_local_db');
    if (savedLocalDB) {
        try { 
            localDatabase = JSON.parse(savedLocalDB); 
            // Убедимся, что структура корректна
            if (!localDatabase.contacts) localDatabase.contacts = [];
            if (!localDatabase.groups) localDatabase.groups = [];
            if (!localDatabase.messages) localDatabase.messages = [];
        } catch(e) { 
            console.error("Ошибка загрузки БД:", e);
            localDatabase = { contacts: [], groups: [], messages: [] };
        }
    }

    // Если пользователь уже вошел — сразу пускаем в приложение
    if (savedUser) {
        try {
            myProfileData = JSON.parse(savedUser);
            const sidText = getById('sabitovIdText');
            const nameInput = getById('nameInput');
            const usernameInput = getById('usernameInput');
            
            if (sidText) sidText.textContent = myProfileData.id;
            if (nameInput) nameInput.value = myProfileData.name;
            if (usernameInput) usernameInput.value = myProfileData.username;
            
            hideAllScreens();
            showMainAppScreen();
            if (supabase) connectRealtimeMessages();
        } catch(e) {
            console.error("Ошибка загрузки пользователя:", e);
            showSliderScreen();
        }
    } else {
        // Иначе показываем онбординг слайдер
        showSliderScreen();
    }

    // Инициализируем обработчики ПОСЛЕ того как DOM готов
    initEventListeners();
    renderLocalChatsAndContacts();
});

// Функция полного скрытия всех экранов
function hideAllScreens() {
    const screens = [
        'topBar', 'sliderWindow', 'bottomArea', 'regScreen', 
        'nameScreen', 'idScreen', 'createPinScreen', 'confirmPinScreen', 'mainAppScreen'
    ];
    screens.forEach(s => {
        const el = getById(s);
        if (el) el.style.display = 'none';
    });
}

// Показ конкретных экранов
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

// Экран юзернейма
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
        if (sidText && sidText.textContent === "SID-00000000") {
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
    if (profileUserTitle && nameInput) {
        profileUserTitle.textContent = nameInput.value.trim() || "Пользователь";
    }
    
    const profileIdTitle = getById('profileIdTitle');
    const sidText = getById('sabitovIdText');
    if (profileIdTitle && sidText) {
        profileIdTitle.textContent = sidText.textContent;
    }
    
    const mainAppScreen = getById('mainAppScreen');
    if (mainAppScreen) mainAppScreen.style.display = 'flex';
}

// Обновление состояния слайдера
function updateSlider() {
    const slidesWrapper = getById('slidesWrapper');
    if (slidesWrapper) {
        slidesWrapper.style.transform = `translateX(-${currentSlide * 20}%)`;
    }
    
    const dots = getAll('.dot');
    dots.forEach((dot, index) => { dot.classList.toggle('active', index === currentSlide); });
    
    const skipBtn = getById('skipBtn');
    if (skipBtn) {
        if (currentSlide > 0 && currentSlide < 4) skipBtn.classList.add('visible');
        else skipBtn.classList.remove('visible');
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

// Инициализация всех обработчиков событий
function initEventListeners() {
    console.log("Инициализация обработчиков событий...");
    
    // Выбор языка (Дропдаун)
    const langBtn = getById('langBtn');
    const langMenu = getById('langMenu');
    
    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isFlex = langMenu.style.display === 'flex';
            langMenu.style.display = isFlex ? 'none' : 'flex';
        });
    }

    document.addEventListener('click', () => { 
        if (langMenu) langMenu.style.display = 'none'; 
    });

    if (langMenu) {
        langMenu.addEventListener('click', (e) => {
            const targetLang = e.target.dataset.lang;
            if (!targetLang) return;
            if (langBtn) langBtn.textContent = `🌐 ${targetLang.toUpperCase()}`;
            applyLanguage(targetLang);
        });
    }

    // Кнопка смены темы
    const themeToggleBtn = getById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (document.body.classList.contains('light-theme')) {
                document.body.classList.replace('light-theme', 'dark-theme');
                themeToggleBtn.textContent = '☀️';
                localStorage.setItem('sabitov_theme', 'dark-theme');
            } else {
                document.body.classList.replace('dark-theme', 'light-theme');
                themeToggleBtn.textContent = '🌙';
                localStorage.setItem('sabitov_theme', 'light-theme');
            }
        });
    }

    // Кнопки онбординга
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
    }

    const skipBtn = getById('skipBtn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => { 
            currentSlide = 4; 
            updateSlider(); 
        });
    }

    // Стрелочки назад
    const backToSliderBtn = getById('backToSliderBtn');
    if (backToSliderBtn) backToSliderBtn.addEventListener('click', showSliderScreen);
    
    const backToRegBtn = getById('backToRegBtn');
    if (backToRegBtn) backToRegBtn.addEventListener('click', showUsernameScreen);
    
    const backToNameBtn = getById('backToNameBtn');
    if (backToNameBtn) backToNameBtn.addEventListener('click', showNameScreen);
    
    const backToIdBtn = getById('backToIdBtn');
    if (backToIdBtn) backToIdBtn.addEventListener('click', showIdScreen);
    
    const backToCreatePinBtn = getById('backToCreatePinBtn');
    if (backToCreatePinBtn) backToCreatePinBtn.addEventListener('click', showCreatePinScreen);

    // Кнопки переходов регистрации
    const regNextBtn = getById('regNextBtn');
    if (regNextBtn) regNextBtn.addEventListener('click', showNameScreen);
    
    const nameNextBtn = getById('nameNextBtn');
    if (nameNextBtn) nameNextBtn.addEventListener('click', showIdScreen);
    
    const idNextBtn = getById('idNextBtn');
    if (idNextBtn) idNextBtn.addEventListener('click', showCreatePinScreen);

    // Валидация полей ввода
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

    // Клавиатура создания PIN
    const createPinKeyboard = getById('createPinKeyboard');
    if (createPinKeyboard) {
        createPinKeyboard.addEventListener('click', (e) => {
            const btn = e.target.closest('.key-btn'); 
            if (!btn) return;
            const value = btn.dataset.val;
            if (value === 'back') { 
                createdPinString = createdPinString.slice(0, -1); 
            } 
            else if (createdPinString.length < 4) { 
                createdPinString += value; 
            }
            updatePinDots(getAll('#createPinDots .pin-dot'), createdPinString);
            if (createdPinString.length === 4) { 
                setTimeout(showConfirmPinScreen, 200); 
            }
        });
    }

    // Клавиатура подтверждения PIN
    const confirmPinKeyboard = getById('confirmPinKeyboard');
    if (confirmPinKeyboard) {
        confirmPinKeyboard.addEventListener('click', (e) => {
            const btn = e.target.closest('.key-btn'); 
            if (!btn) return;
            const value = btn.dataset.val;
            if (value === 'back') { 
                confirmedPinString = confirmedPinString.slice(0, -1); 
            } 
            else if (confirmedPinString.length < 4) { 
                confirmedPinString += value; 
            }
            updatePinDots(getAll('#confirmPinDots .pin-dot'), confirmedPinString);

            if (confirmedPinString.length === 4) {
                if (confirmedPinString === createdPinString) {
                    setTimeout(() => {
                        const sidText = getById('sabitovIdText');
                        const nameInputVal = getById('nameInput');
                        const usernameInputVal = getById('usernameInput');
                        
                        myProfileData = {
                            id: sidText ? sidText.textContent : 'SID-UNKNOWN',
                            name: nameInputVal ? nameInputVal.value.trim() : 'User',
                            username: usernameInputVal ? usernameInputVal.value.trim() : 'username'
                        };
                        localStorage.setItem('sabitov_session_user', JSON.stringify(myProfileData));
                        
                        if (supabase) {
                            try { 
                                supabase.from('users').insert([myProfileData]).then(r => {
                                    console.log("Пользователь сохранен в Supabase");
                                }).catch(err => console.error(err));
                            } catch(err) { console.error(err); }
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

    // Переключение вкладок приложения
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

    // Действия Telegram-Style меню
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

    // Сохранить новый контакт
    const saveContactModalBtn = getById('saveContactModalBtn');
    if (saveContactModalBtn) {
        saveContactModalBtn.addEventListener('click', async () => {
            const modalContactId = getById('modalContactId');
            const modalContactName = getById('modalContactName');
            
            const id = modalContactId ? modalContactId.value.trim() : '';
            const name = modalContactName ? modalContactName.value.trim() : '';
            
            if (!id || !name) return;

            const newContact = { id, name, isGroup: false };
            localDatabase.contacts.push(newContact);
            localStorage.setItem('sabitov_local_db', JSON.stringify(localDatabase));

            if (supabase) {
                try { 
                    await supabase.from('contacts').insert([{ user_id: myProfileData?.id, contact_sid: id, contact_name: name }]); 
                } catch(e){console.error(e);}
            }

            if (modalContactId) modalContactId.value = '';
            if (modalContactName) modalContactName.value = '';
            if (contactModal) contactModal.style.display = 'none';
            renderLocalChatsAndContacts();
            showToast('Контакт сохранен!');
        });
    }

    // Кнопка открытия модалки новой группы
    const tgNewGroupBtn = getById('tgNewGroupBtn');
    const groupModal = getById('groupModal');
    if (tgNewGroupBtn && groupModal) {
        tgNewGroupBtn.addEventListener('click', () => {
            const modalGroupContactsList = getById('modalGroupContactsList');
            if (!modalGroupContactsList) return;
            
            modalGroupContactsList.innerHTML = '';
            localDatabase.contacts.forEach(c => {
                const item = document.createElement('label');
                item.className = 'modal-checkbox-item';
                item.innerHTML = `<input type="checkbox" value="${c.id}"> ${c.name}`;
                modalGroupContactsList.appendChild(item);
            });
            groupModal.style.display = 'flex';
        });
    }
    
    const closeGroupModalBtn = getById('closeGroupModalBtn');
    if (closeGroupModalBtn && groupModal) {
        closeGroupModalBtn.addEventListener('click', () => { 
            groupModal.style.display = 'none'; 
        });
    }

    // Сохранить новую группу
    const saveGroupModalBtn = getById('saveGroupModalBtn');
    if (saveGroupModalBtn) {
        saveGroupModalBtn.addEventListener('click', async () => {
            const modalGroupName = getById('modalGroupName');
            const groupName = modalGroupName ? modalGroupName.value.trim() : '';
            if (!groupName) return;

            const checkedBoxes = getAll('#modalGroupContactsList input:checked');
            const members = [myProfileData ? myProfileData.id : 'me'];
            checkedBoxes.forEach(b => members.push(b.value));

            const newGroup = { id: 'GROUP-' + Date.now(), name: groupName, isGroup: true, members: members };
            localDatabase.groups.push(newGroup);
            localStorage.setItem('sabitov_local_db', JSON.stringify(localDatabase));

            if (supabase) {
                try { 
                    await supabase.from('groups').insert([{ group_id: newGroup.id, group_name: groupName, members_list: members }]); 
                } catch(e){console.error(e);}
            }

            if (modalGroupName) modalGroupName.value = '';
            if (groupModal) groupModal.style.display = 'none';
            renderLocalChatsAndContacts();
            showToast('Группа успешно создана!');
        });
    }

    // Дефолтный клик на техподдержку
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

    const closeChatBtn = getById('closeChatBtn');
    const chatRoomLayer = getById('chatRoomLayer');
    if (closeChatBtn && chatRoomLayer) {
        closeChatBtn.addEventListener('click', () => { 
            chatRoomLayer.style.display = 'none'; 
        });
    }

    // Отправка сообщений по Enter
    const chatMessageField = getById('chatMessageField');
    if (chatMessageField) {
        chatMessageField.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const txt = chatMessageField.value.trim();
                if (!txt) return;

                const localMsg = { chatId: activeChatId, senderId: myProfileData ? myProfileData.id : 'me', text: txt, isVoice: false };
                localDatabase.messages.push(localMsg);
                localStorage.setItem('sabitov_local_db', JSON.stringify(localDatabase));
                
                appendChatMessage(txt, 'sender');
                chatMessageField.value = '';
                renderLocalChatsAndContacts();

                if (supabase && myProfileData) {
                    try { 
                        await supabase.from('messages').insert([{ chat_id: activeChatId, sender_id: myProfileData.id, message_text: txt }]); 
                    } catch(err){console.error(err);}
                }

                // Эмуляция ответа поддержки
                if (activeChatId === "support") {
                    setTimeout(() => {
                        const guideHtml = `
                            <div class="chat-msg-text" style="text-align: left; max-width: 85%;">
                                <b>SABITOV EXECUTIVE GUIDE</b><br><br>
                                Приветствуем в премиальной экосистеме. Ваши операционные принципы:<br><br>
                                • <b>Автономия данных:</b> Авторизация идет только по вашему SabitovID.<br><br>
                                • <b>Сквозное шифрование:</b> Обмен пакетами напрямую исключает перехват данных.<br><br>
                                • <b>Голосовые волны:</b> Записывайте аудио в одно касание или удерживая микрофон.<br><br>
                                <i>Инфраструктура стабильна. Спасибо, что вы с нами.</i>
                            </div>
                        `;
                        localDatabase.messages.push({ chatId: 'support', senderId: 'bot', text: 'GUIDE', specialHtml: guideHtml });
                        localStorage.setItem('sabitov_local_db', JSON.stringify(localDatabase));
                        appendChatMessage('', 'receiver', guideHtml);
                        renderLocalChatsAndContacts();
                    }, 800);
                }
            }
        });
    }

    // Плюсик контекстное меню файлов
    const chatPlusBtn = getById('chatPlusBtn');
    const attachMenu = getById('attachMenu');
    if (chatPlusBtn && attachMenu) {
        chatPlusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isFlex = attachMenu.style.display === 'flex';
            attachMenu.style.display = isFlex ? 'none' : 'flex';
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
            localStorage.setItem('sabitov_local_db', JSON.stringify(localDatabase));
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
            localStorage.setItem('sabitov_local_db', JSON.stringify(localDatabase));
            appendChatMessage('', 'sender', html); 
            renderLocalChatsAndContacts();
            fileInputHidden.value = '';
        });
    }

    // Голосовые сообщения
    const chatMicBtn = getById('chatMicBtn');
    if (chatMicBtn) {
        let isClickRecording = false;
        chatMicBtn.addEventListener('click', () => {
            if (!isClickRecording) {
                isClickRecording = true;
                chatMicBtn.classList.add('recording');
                const chatMessageFieldLocal = getById('chatMessageField');
                if (chatMessageFieldLocal) { 
                    chatMessageFieldLocal.placeholder = "Запись премиум-аудио..."; 
                    chatMessageFieldLocal.disabled = true; 
                }
                
                // Автоматически останавливаем через 4 секунды
                setTimeout(() => {
                    if (isClickRecording) {
                        isClickRecording = false;
                        chatMicBtn.classList.remove('recording');
                        if (chatMessageFieldLocal) { 
                            chatMessageFieldLocal.placeholder = "Сообщение..."; 
                            chatMessageFieldLocal.disabled = false; 
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
                        localStorage.setItem('sabitov_local_db', JSON.stringify(localDatabase));
                        appendChatMessage('', 'sender', voiceHtml);
                        renderLocalChatsAndContacts();
                    }
                }, 4000);
            } else {
                isClickRecording = false;
                chatMicBtn.classList.remove('recording');
                const chatMessageFieldLocal = getById('chatMessageField');
                if (chatMessageFieldLocal) { 
                    chatMessageFieldLocal.placeholder = "Сообщение..."; 
                    chatMessageFieldLocal.disabled = false; 
                }
            }
        });
    }
}

// Применение языков интерфейса
function applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
}

// Перерисовка контактов в слоях
function renderLocalChatsAndContacts() {
    // Рендерим контакты в меню нового чата
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

    // Рендерим динамические чаты (личные и группы)
    const dynamicChatsList = getById('dynamicChatsList');
    if (dynamicChatsList) {
        dynamicChatsList.innerHTML = '';
        
        // Личные контакты
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

        // Группы
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
            dynamicChatsList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Нет чатов</div>';
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
    
    // Приветственное сообщение для поддержки
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
    if (!supabase) return;
    try {
        supabase.channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', pattern: 'messages' }, payload => {
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
                    localStorage.setItem('sabitov_local_db', JSON.stringify(localDatabase));
                    if (activeChatId === incoming.chatId) {
                        appendChatMessage(incoming.text || '', incoming.senderId === myProfileData.id ? 'sender' : 'receiver', incoming.specialHtml);
                    }
                    renderLocalChatsAndContacts();
                }
            }).subscribe();
    } catch(e) { console.error("Realtime ошибка:", e); }
}

// Воспроизведение аудио-волн (делегирование событий)
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