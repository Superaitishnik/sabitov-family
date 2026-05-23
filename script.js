// Элементы онбординга и окон
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
const slidesWrapper = document.getElementById('slidesWrapper');
const dots = document.querySelectorAll('.dot');
const topBar = document.getElementById('topBar');
const sliderWindow = document.getElementById('sliderWindow');
const bottomArea = document.getElementById('bottomArea');

// Регистрация
const regScreen = document.getElementById('regScreen');
const usernameInput = document.getElementById('usernameInput');
const regNextBtn = document.getElementById('regNextBtn');
const backToSliderBtn = document.getElementById('backToSliderBtn');
const nameScreen = document.getElementById('nameScreen');
const nameInput = document.getElementById('nameInput');
const nameNextBtn = document.getElementById('nameNextBtn');
const backToRegBtn = document.getElementById('backToRegBtn');
const idScreen = document.getElementById('idScreen');
const backToNameBtn = document.getElementById('backToNameBtn');
const sabitovIdText = document.getElementById('sabitovIdText');
const generatedIdBox = document.getElementById('generatedIdBox');
const idNextBtn = document.getElementById('idNextBtn');
const toast = document.getElementById('toast');

// ПИН-коды
const createPinScreen = document.getElementById('createPinScreen');
const backToIdBtn = document.getElementById('backToIdBtn');
const createPinKeyboard = document.getElementById('createPinKeyboard');
const createPinDots = document.getElementById('createPinDots').querySelectorAll('.pin-dot');
const confirmPinScreen = document.getElementById('confirmPinScreen');
const backToCreatePinBtn = document.getElementById('backToCreatePinBtn');
const confirmPinKeyboard = document.getElementById('confirmPinKeyboard');
const confirmPinDots = document.getElementById('confirmPinDots').querySelectorAll('.pin-dot');

// Главный интерфейс и вкладки таббара
const mainAppScreen = document.getElementById('mainAppScreen');
const appSectionTitle = document.getElementById('appSectionTitle');
const tabButtons = document.querySelectorAll('.tab-item-btn');
const tabContents = document.querySelectorAll('.tab-content-block');
const profileUserTitle = document.getElementById('profileUserTitle');
const profileIdTitle = document.getElementById('profileIdTitle');

// ==========================================
// НОВЫЕ ЭЛЕМЕНТЫ ПЛЮСИКА, СЛУЖБЫ ПОДДЕРЖКИ И МИКРОФОНА
// ==========================================
const openSupportChatBlock = document.getElementById('openSupportChatBlock');
const chatRoomLayer = document.getElementById('chatRoomLayer');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatMessagesArea = document.getElementById('chatMessagesArea');
const chatMessageField = document.getElementById('chatMessageField');
const chatPlusBtn = document.getElementById('chatPlusBtn');
const attachMenu = document.getElementById('attachMenu');
const attachMediaBtn = document.getElementById('attachMediaBtn');
const attachFileBtn = document.getElementById('attachFileBtn');
const mediaInputHidden = document.getElementById('mediaInputHidden');
const fileInputHidden = document.getElementById('fileInputHidden');
const chatMicBtn = document.getElementById('chatMicBtn');
const micIconSvg = chatMicBtn.querySelector('.mic-icon-svg');
const stopRecordText = chatMicBtn.querySelector('.stop-record-text');
const chatListSubtext = document.getElementById('chatListSubtext');
const listUnreadCounter = document.getElementById('listUnreadCounter');
const tabUnreadCounter = document.getElementById('tabUnreadCounter');

let currentSlide = 0;
const totalSlides = 5;
let createdPinString = "";
let confirmedPinString = "";
let supportBotActivated = false; // Флаг отправки первого сообщения

// Состояние записи микрофона
let isClickRecording = false; 
let isHoldRecording = false;
let recordStartTime = 0;

// Слайдер логика
function updateSlider() {
    slidesWrapper.style.transform = `translateX(-${currentSlide * 20}%)`;
    dots.forEach((dot, index) => { dot.classList.toggle('active', index === currentSlide); });
    if (currentSlide > 0 && currentSlide < totalSlides - 1) { skipBtn.classList.add('visible'); } 
    else { skipBtn.classList.remove('visible'); }
    if (currentSlide === totalSlides - 1) { nextBtn.textContent = 'Начать'; } 
    else { nextBtn.textContent = 'Далее'; }
}

function hideAllScreens() {
    topBar.style.display = 'none'; sliderWindow.style.display = 'none'; bottomArea.style.display = 'none';
    regScreen.style.display = 'none'; nameScreen.style.display = 'none'; idScreen.style.display = 'none';
    createPinScreen.style.display = 'none'; confirmPinScreen.style.display = 'none';
    mainAppScreen.style.display = 'none';
}

function showUsernameScreen() { hideAllScreens(); regScreen.style.display = 'flex'; usernameInput.focus(); }
function showSliderScreen() { hideAllScreens(); topBar.style.display = 'flex'; sliderWindow.style.display = 'flex'; bottomArea.style.display = 'flex'; }
function showNameScreen() { hideAllScreens(); nameScreen.style.display = 'flex'; nameInput.focus(); }

function generateSabitovID() {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 8; i++) { result += chars[Math.floor(Math.random() * chars.length)]; }
    return `SID-${result}`;
}

function showIdScreen() {
    hideAllScreens();
    idScreen.style.display = 'flex';
    if(sabitovIdText.textContent === "SID-00000000") {
        sabitovIdText.textContent = generateSabitovID();
    }
}

function showCreatePinScreen() { hideAllScreens(); createdPinString = ""; updatePinDots(createPinDots, createdPinString); createPinScreen.style.display = 'flex'; }
function showConfirmPinScreen() { hideAllScreens(); confirmedPinString = ""; updatePinDots(confirmPinDots, confirmedPinString); confirmPinScreen.style.display = 'flex'; }

function showMainAppScreen() {
    hideAllScreens();
    profileUserTitle.textContent = nameInput.value.trim() || "Пользователь";
    profileIdTitle.textContent = sabitovIdText.textContent;
    mainAppScreen.style.display = 'flex';
}

function updatePinDots(dotsArray, pinString) {
    dotsArray.forEach((dot, index) => { dot.classList.toggle('filled', index < pinString.length); });
}

function showToast(message) {
    toast.textContent = message; toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 2200);
}

// Привязка кнопок онбординга
nextBtn.addEventListener('click', () => { if (currentSlide < totalSlides - 1) { currentSlide++; updateSlider(); } else { showUsernameScreen(); } });
skipBtn.addEventListener('click', () => { currentSlide = totalSlides - 1; updateSlider(); });
backToSliderBtn.addEventListener('click', showSliderScreen);
backToRegBtn.addEventListener('click', showUsernameScreen);
backToNameBtn.addEventListener('click', showNameScreen);
backToIdBtn.addEventListener('click', showIdScreen);
backToCreatePinBtn.addEventListener('click', showCreatePinScreen);
regNextBtn.addEventListener('click', showNameScreen);
nameNextBtn.addEventListener('click', showIdScreen);
idNextBtn.addEventListener('click', showCreatePinScreen);

usernameInput.addEventListener('input', () => {
    const isReady = usernameInput.value.trim().length > 0;
    regNextBtn.classList.toggle('disabled', !isReady); regNextBtn.disabled = !isReady;
});
nameInput.addEventListener('input', () => {
    const isReady = nameInput.value.trim().length > 0;
    nameNextBtn.classList.toggle('disabled', !isReady); nameNextBtn.disabled = !isReady;
});

generatedIdBox.addEventListener('click', () => {
    navigator.clipboard.writeText(sabitovIdText.textContent).then(() => { showToast('Успешно скопировано!'); });
});

// Логика клавиатуры PIN
createPinKeyboard.addEventListener('click', (e) => {
    const btn = e.target.closest('.key-btn'); if (!btn) return;
    const value = btn.dataset.val;
    if (value === 'back') { createdPinString = createdPinString.slice(0, -1); } 
    else if (createdPinString.length < 4) { createdPinString += value; }
    updatePinDots(createPinDots, createdPinString);
    if (createdPinString.length === 4) { setTimeout(showConfirmPinScreen, 200); }
});

confirmPinKeyboard.addEventListener('click', (e) => {
    const btn = e.target.closest('.key-btn'); if (!btn) return;
    const value = btn.dataset.val;
    if (value === 'back') { confirmedPinString = confirmedPinString.slice(0, -1); } 
    else if (confirmedPinString.length < 4) { confirmedPinString += value; }
    updatePinDots(confirmPinDots, confirmedPinString);

    if (confirmedPinString.length === 4) {
        if (confirmedPinString === createdPinString) {
            setTimeout(() => {
                showToast('Регистрация успешно завершена!');
                setTimeout(showMainAppScreen, 600);
            }, 200);
        } else {
            setTimeout(() => {
                showToast('PIN-коды не совпадают! Попробуйте еще раз.');
                confirmedPinString = ""; updatePinDots(confirmPinDots, confirmedPinString);
            }, 300);
        }
    }
});

// АНИМАЦИОННОЕ И ПЛАВНОЕ ПЕРЕКЛЮЧЕНИЕ ТАББАРА С ИЗМЕНЕНИЕМ ПРОЗРАЧНОСТИ
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        if (targetTab === 'chats') appSectionTitle.textContent = 'Чаты';
        if (targetTab === 'profile') appSectionTitle.textContent = 'Профиль';
        
        tabContents.forEach(content => {
            content.style.display = (content.id === `tab-${targetTab}`) ? 'block' : 'none';
        });
    });
});


// ==========================================================================
// ЛОГИКА ФУНКЦИОНАЛА НОВОГО ЭКРАНА ЧАТА И ПОДДЕРЖКИ БИЗНЕС-БОТА
// ==========================================================================

// Открыть / Закрыть окно чата
openSupportChatBlock.addEventListener('click', () => {
    chatRoomLayer.style.display = 'flex';
    // Обнуляем уведомления
    listUnreadCounter.style.display = 'none';
    tabUnreadCounter.style.display = 'none';
    scrollChatToBottom();
});

closeChatBtn.addEventListener('click', () => {
    chatRoomLayer.style.display = 'none';
});

// Скролл вниз
function scrollChatToBottom() {
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
}

// Конструктор вставки сообщений
function appendChatMessage(text, type = 'sender', specialLayoutHtml = null) {
    const wrapper = document.createElement('div');
    wrapper.className = `msg-bubble-wrapper item-${type}`;
    
    if (specialLayoutHtml) {
        wrapper.innerHTML = specialLayoutHtml;
    } else {
        wrapper.innerHTML = `<div class="chat-msg-text">${text}</div>`;
    }
    
    chatMessagesArea.appendChild(wrapper);
    scrollChatToBottom();
}

// Отправка текстовых сообщений по Enter
chatMessageField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const rawText = chatMessageField.value.trim();
        if (!rawText) return;
        
        // Рендерим сообщение пользователя
        appendChatMessage(rawText, 'sender');
        chatListSubtext.textContent = rawText;
        chatMessageField.value = '';
        
        // Активация Бизнес-инструкции поддержки
        if (!supportBotActivated) {
            supportBotActivated = true;
            setTimeout(() => {
                sendBusinessGuide();
            }, 800);
        }
    }
});

// Бизнес-руководство от поддержки
function sendBusinessGuide() {
    const guideHtml = `
        <div class="chat-msg-text" style="text-align: left; max-width: 85%;">
            <b>SABITOV EXECUTIVE GUIDE</b><br><br>
            Приветствуем вас в экосистеме премиальной конфиденциальности. Ниже представлены базовые операционные принципы мессенджера:<br><br>
            • <b>Автономия данных:</b> Ваш аккаунт привязан исключительно к сгенерированному SabitovID. Никаких телефонных номеров или почтовых ящиков.<br><br>
            • <b>Сквозное шифрование:</b> Обмен пакетами данных происходит напрямую между конечными узлами. Доступ провайдеров и третьих лиц полностью исключен.<br><br>
            • <b>Управление мультимедиа:</b> Используйте интерфейс <b>«+»</b> для мгновенной передачи документов и фотоматериалов в исходном качестве без сжатия.<br><br>
            • <b>Протокол Fenix:</b> В случае необходимости экстренной очистки, вы можете инициировать полное удаление следов сессии в настройках профиля.<br><br>
            <i>Система готова к стабильной работе. Благодарим за доверие.</i>
        </div>
    `;
    appendChatMessage('', 'receiver', guideHtml);
    chatListSubtext.textContent = 'SABITOV EXECUTIVE GUIDE';
}

// Меню вложений (Плюсик)
chatPlusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    attachMenu.style.display = (attachMenu.style.display === 'flex') ? 'none' : 'flex';
});

// Скрытие меню при клике по экрану
document.addEventListener('click', () => {
    attachMenu.style.display = 'none';
});

// Привязка триггеров нативных инпутов
attachMediaBtn.addEventListener('click', () => mediaInputHidden.click());
attachFileBtn.addEventListener('click', () => fileInputHidden.click());

// Обработка отправки Медиа (Photo/Video)
mediaInputHidden.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileUrl = URL.createObjectURL(file);
    let layout = "";
    
    if (file.type.startsWith('video/')) {
        layout = `<div class="media-message-preview"><video src="${fileUrl}" controls></video></div>`;
    } else {
        layout = `<div class="media-message-preview"><img src="${fileUrl}"></div>`;
    }
    
    appendChatMessage('', 'sender', layout);
    chatListSubtext.textContent = '🖼️ Изображение/Видео';
    mediaInputHidden.value = '';
});

// Обработка отправки Файлов (File)
fileInputHidden.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const layout = `
        <div class="file-message-box">
            <span>📄</span>
            <div style="word-break: break-all;">
                <div><b>${file.name}</b></div>
                <div style="font-size: 11px; opacity: 0.7;">${(file.size / 1024).toFixed(1)} KB</div>
            </div>
        </div>
    `;
    
    appendChatMessage('', 'sender', layout);
    chatListSubtext.textContent = `📁 Document: ${file.name}`;
    fileInputHidden.value = '';
});


// ==========================================================================
// ИННОВАЦИОННАЯ ДВУХРЕЖИМНАЯ ЗАПИСЬ ГОЛОСОВЫХ (КЛИК / ЗАЖАТИЕ)
// ==========================================================================

function startRecordingUI() {
    chatMicBtn.classList.add('recording');
    micIconSvg.style.display = 'none';
    stopRecordText.style.display = 'block';
    chatMessageField.placeholder = "Идет запись аудио...";
    chatMessageField.disabled = true;
    recordStartTime = Date.now();
}

function stopAndSendRecordingUI() {
    chatMicBtn.classList.remove('recording');
    micIconSvg.style.display = 'block';
    stopRecordText.style.display = 'none';
    chatMessageField.placeholder = "Сообщение...";
    chatMessageField.disabled = false;
    
    const duration = Math.max(1, Math.round((Date.now() - recordStartTime) / 1000));
    
    // Рендерим красивую кастомную плашку голосового
    const voiceHtml = `
        <div class="chat-msg-text" style="display:flex; align-items:center; gap:12px; min-width:160px;">
            <span style="font-size:20px;">▶️</span>
            <div style="flex-grow:1; height:4px; background:rgba(0,0,0,0.1); border-radius:2px; position:relative;">
                <div style="position:absolute; left:0; top:0; height:100%; width:35%; background:#007aff; border-radius:2px;"></div>
            </div>
            <span style="font-size:12px; font-weight:600;">0:${duration < 10 ? '0' + duration : duration}</span>
        </div>
    `;
    
    appendChatMessage('', 'sender', voiceHtml);
    chatListSubtext.textContent = '🎤 Голосовое сообщение';
}

// --- РЕЖИМ 1: РАБОТА ПО КЛИКУ ---
chatMicBtn.addEventListener('click', (e) => {
    if (isHoldRecording) return; // Игнорируем клик, если работает зажатие
    
    if (!isClickRecording) {
        isClickRecording = true;
        startRecordingUI();
    } else {
        isClickRecording = false;
        stopAndSendRecordingUI();
    }
});

// --- РЕЖИМ 2: РАБОТА ПО ЗАЖАТИЮ (ДЛЯ ДЕСКТОПА И МОБИЛОК) ---
let holdTimer = null;

function handleHoldStart(e) {
    if (isClickRecording) return;
    e.preventDefault();
    
    holdTimer = setTimeout(() => {
        isHoldRecording = true;
        startRecordingUI();
    }, 200); // Считаем зажатием после 200мс удержания
}

function handleHoldEnd(e) {
    if (holdTimer) clearTimeout(holdTimer);
    if (isHoldRecording) {
        isHoldRecording = false;
        stopAndSendRecordingUI();
    }
}

// Мышь (Десктоп)
chatMicBtn.addEventListener('mousedown', handleHoldStart);
chatMicBtn.addEventListener('mouseup', handleHoldEnd);
chatMicBtn.addEventListener('mouseleave', handleHoldEnd);

// Тач (Смартфоны)
chatMicBtn.addEventListener('touchstart', handleHoldStart, { passive: false });
chatMicBtn.addEventListener('touchend', handleHoldEnd);
chatMicBtn.addEventListener('touchcancel', handleHoldEnd);