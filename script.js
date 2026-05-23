(function() {
    // ========== STORAGE ==========
    const STORAGE_KEY = 'sabitov_family_users';
    
    function generateSabitovId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
        let id = 'SBT';
        for(let i = 0; i < 7; i++) id += chars[Math.floor(Math.random() * chars.length)];
        return id;
    }
    
    function getAllUsers() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
    function saveAllUsers(users) { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); }
    function findUserByUsername(username) { return getAllUsers().find(u => u.username.toLowerCase() === username.toLowerCase()); }
    function findUserById(id) { return getAllUsers().find(u => u.sabitovId === id); }
    
    function addUser(name, username, sabitovId, pin) {
        const users = getAllUsers();
        users.push({ name: name.trim(), username: username.trim().toLowerCase(), sabitovId, pin });
        saveAllUsers(users);
    }
    
    // ========== DOM Elements ==========
    let currentGeneratedId = null;
    let tempPin = null;
    let tempName = null;
    let tempUsername = null;
    
    // Screens
    const screens = {
        screen1: document.getElementById('screen1'),
        screen2: document.getElementById('screen2'),
        screen3: document.getElementById('screen3'),
        screen4: document.getElementById('screen4'),
        authChoice: document.getElementById('authChoiceScreen'),
        regUsername: document.getElementById('regUsernameScreen'),
        regName: document.getElementById('regNameScreen'),
        regShowId: document.getElementById('regShowIdScreen'),
        regPin: document.getElementById('regPinScreen'),
        regConfirmPin: document.getElementById('regConfirmPinScreen'),
        login: document.getElementById('loginScreen'),
        messenger: document.getElementById('messengerScreen')
    };
    
    function showScreen(screenName) {
        Object.keys(screens).forEach(key => { if(screens[key]) screens[key].style.display = 'none'; });
        if(screens[screenName]) screens[screenName].style.display = 'flex';
        else if(screens[screenName] === undefined) console.error('Screen not found:', screenName);
    }
    
    function showToast(msg, duration = 2000) {
        const toast = document.getElementById('toastMsg');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }
    
    // ========== Онбординг ==========
    document.getElementById('next1').onclick = () => showScreen('screen2');
    document.getElementById('next2').onclick = () => showScreen('screen3');
    document.getElementById('next3').onclick = () => showScreen('screen4');
    document.getElementById('next4').onclick = () => showScreen('authChoice');
    
    // Выбор регистрации/входа
    document.getElementById('registerChoiceBtn').onclick = () => showScreen('regUsername');
    document.getElementById('loginChoiceBtn').onclick = () => showScreen('login');
    document.getElementById('backToAuthBtn').onclick = () => showScreen('authChoice');
    
    // ========== Регистрация: Username ==========
    document.getElementById('regUsernameNext').onclick = () => {
        const username = document.getElementById('regUsernameInput').value.trim();
        const errorEl = document.getElementById('usernameError');
        if(!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
            errorEl.textContent = '3-20 символов (буквы, цифры, _)';
            return;
        }
        if(findUserByUsername(username)) {
            errorEl.textContent = 'Этот username уже занят';
            return;
        }
        tempUsername = username;
        errorEl.textContent = '';
        document.getElementById('regUsernameInput').value = '';
        showScreen('regName');
    };
    
    // ========== Регистрация: Имя ==========
    document.getElementById('regNameNext').onclick = () => {
        const name = document.getElementById('regNameInput').value.trim();
        const errorEl = document.getElementById('nameError');
        if(name.length < 1 || name.length > 50) {
            errorEl.textContent = 'Имя от 1 до 50 символов';
            return;
        }
        tempName = name;
        errorEl.textContent = '';
        document.getElementById('regNameInput').value = '';
        
        // Генерируем ID
        currentGeneratedId = generateSabitovId();
        while(findUserById(currentGeneratedId)) currentGeneratedId = generateSabitovId();
        document.getElementById('generatedId').textContent = currentGeneratedId;
        showScreen('regShowId');
        
        // Анимация иконки
        const techIcon = document.querySelector('#regShowIdScreen .tech-icon');
        techIcon.style.animation = 'none';
        setTimeout(() => techIcon.style.animation = 'techPulse 1s infinite', 10);
    };
    
    // ========== Копирование ID ==========
    document.getElementById('copyIdBtn').onclick = () => {
        navigator.clipboard.writeText(currentGeneratedId);
        showToast('✅ SabitovID скопирован!');
    };
    
    document.getElementById('idNextBtn').onclick = () => {
        showScreen('regPin');
    };
    
    // ========== Ввод PIN ==========
    document.getElementById('regPinNext').onclick = () => {
        const pin = document.getElementById('regPinInput').value;
        if(!pin.match(/^\d{4}$/)) {
            showToast('PIN должен быть 4 цифры', 1500);
            return;
        }
        tempPin = pin;
        document.getElementById('regPinInput').value = '';
        showScreen('regConfirmPin');
    };
    
    // ========== Подтверждение PIN и завершение ==========
    document.getElementById('regConfirmPinBtn').onclick = () => {
        const confirmPin = document.getElementById('regConfirmPinInput').value;
        if(confirmPin !== tempPin) {
            document.getElementById('pinError').textContent = 'PIN-коды не совпадают';
            return;
        }
        document.getElementById('pinError').textContent = '';
        // Сохраняем пользователя
        addUser(tempName, tempUsername, currentGeneratedId, tempPin);
        showToast('✅ Аккаунт создан!', 1500);
        
        // Автоматический вход
        setTimeout(() => {
            enterMessenger({ name: tempName, username: tempUsername, sabitovId: currentGeneratedId });
        }, 1000);
    };
    
    // ========== Вход ==========
    document.getElementById('loginSubmitBtn').onclick = () => {
        const sabitovId = document.getElementById('loginIdInput').value.trim();
        const pin = document.getElementById('loginPinInput').value;
        const user = findUserById(sabitovId);
        if(!user) {
            showToast('SabitovID не найден', 1500);
            return;
        }
        if(user.pin !== pin) {
            showToast('Неверный PIN-код', 1500);
            return;
        }
        enterMessenger(user);
    };
    
    // ========== Вход в мессенджер ==========
    function enterMessenger(user) {
        document.getElementById('msgAvatar').textContent = user.name.charAt(0).toUpperCase();
        document.getElementById('msgName').textContent = user.name;
        document.getElementById('displaySabitovId').textContent = user.sabitovId;
        showScreen('messenger');
    }
    
    // ========== Выход ==========
    document.getElementById('logoutBtnMain').onclick = () => {
        showScreen('authChoice');
        // Очистка полей
        document.getElementById('loginIdInput').value = '';
        document.getElementById('loginPinInput').value = '';
        document.getElementById('regUsernameInput').value = '';
        document.getElementById('regNameInput').value = '';
        document.getElementById('regPinInput').value = '';
        document.getElementById('regConfirmPinInput').value = '';
        tempPin = null;
        tempName = null;
        tempUsername = null;
        currentGeneratedId = null;
    };
    
    // Старт
    showScreen('screen1');
    
    // Анимация для точек онбординга (обновляем при смене экрана)
    function updateDots(screenId) {
        const dots = document.querySelectorAll('.onboarding-dots .dot');
        const screensOrder = ['screen1','screen2','screen3','screen4'];
        const idx = screensOrder.indexOf(screenId);
        if(idx !== -1) dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }
    
    // Перехватываем showScreen для обновления точек
    const origShow = showScreen;
    window.showScreen = function(s) { 
        origShow(s); 
        if(['screen1','screen2','screen3','screen4'].includes(s)) updateDots(s);
    };
    showScreen = window.showScreen;
    updateDots('screen1');
})();