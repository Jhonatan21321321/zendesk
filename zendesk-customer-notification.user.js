// ==UserScript==
// @name         Zendesk Superbet Notification Sound & Robust Timer
// @namespace    https://yourdomain.com
// @version      4.5
// @description  Play sound, show timer for last customer message in Zendesk and update tab title timer robustly even in inactive tabs
// @author       Modified
// @match        *://*.zendesk.com/*
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/Jhonatan21321321/zendesk/main/zendesk-customer-notification.user.js
// @downloadURL  https://raw.githubusercontent.com/Jhonatan21321321/zendesk/main/zendesk-customer-notification.user.js
// ==/UserScript==

(function() {
    'use strict';

    const notificationSound = new Audio("https://zvukitop.com/wp-content/uploads/2021/03/zvuki-opovesheniya.mp3");
    let lastCustomerMessageTime = null;
    let timerElement = null;
    const originalTitle = document.title;
    let hasUnreadMessage = false;
    let userViewedMessages = false;

    // Estilos
    GM_addStyle(`
        .customer-notification-timer {
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 10px 15px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 9999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
        }
        .has-new-customer-messages {
            background-color: #ffeb3b !important;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { background-color: #ffeb3b; }
            50% { background-color: #ffc107; }
            100% { background-color: #ffeb3b; }
        }
    `);

    function createTimerElement() {
        if (!timerElement) {
            timerElement = document.createElement('div');
            timerElement.className = 'customer-notification-timer';
            document.body.appendChild(timerElement);
        }
        return timerElement;
    }

    function formatDiffSeconds(diffSeconds) {
        if (diffSeconds < 0) diffSeconds = 0;
        const minutes = Math.floor(diffSeconds / 60);
        const seconds = diffSeconds % 60;
        return `${minutes}m ${seconds}s`;
    }

    function updateTimers() {
        if (lastCustomerMessageTime) {
            const now = Date.now();
            const diff = Math.floor((now - lastCustomerMessageTime.getTime()) / 1000);
            createTimerElement().textContent = `Última mensagem: ${formatDiffSeconds(diff)} atrás`;
        }

        // Atualizar título
        const times = document.querySelectorAll('.iACaSM time');
        const spans = document.querySelectorAll('.iACaSM span.kawtYt');

        if (times.length > 0) {
            const lastTimeElement = times[times.length - 1];
            const messageTime = new Date(lastTimeElement.dateTime);
            const now = Date.now();
            const diff = Math.floor((now - messageTime.getTime()) / 1000);
            const timeString = `[${formatDiffSeconds(diff)}]`;
            const statusIndicator = hasUnreadMessage ? (userViewedMessages ? '🟢 ' : '🔴 ') : '';

            let lastFullName = '';
            if (spans.length > 0) {
                lastFullName = spans[spans.length - 1].textContent.trim();
            }

            if (!document.hidden && hasUnreadMessage && !userViewedMessages) {
                userViewedMessages = true;
            }

            document.title = lastFullName
                ? `${statusIndicator}${timeString} ${lastFullName} - ${originalTitle}`
                : `${statusIndicator}${timeString} ${originalTitle}`;
        } else {
            document.title = originalTitle;
        }
    }

    function checkForCustomerMessages() {
        const times = document.querySelectorAll('.iACaSM time');

        // Encontrar botão de notificações de forma mais robusta
        const notificationButton = findNotificationButton();

        if (times.length > 0 && notificationButton) {
            const lastTimeElement = times[times.length - 1];
            const messageTime = new Date(lastTimeElement.dateTime);

            if (!lastCustomerMessageTime || messageTime.getTime() > lastCustomerMessageTime.getTime()) {
                lastCustomerMessageTime = messageTime;
                hasUnreadMessage = true;
                userViewedMessages = false;
                try { notificationSound.play().catch(()=>{}); } catch(e) {}
                notificationButton.classList.add("has-new-customer-messages");
            }
        } else if (notificationButton) {
            notificationButton.classList.remove("has-new-customer-messages");
        }
    }

    // Função para encontrar botão de notificações
    function findNotificationButton() {
        // Estratégia 1: procurar por elementos com classes comuns
        const candidates = document.querySelectorAll('button, div, span');
        for (const el of candidates) {
            // Verificar atributos comuns
            if (el.getAttribute && el.getAttribute('aria-label')) {
                const label = el.getAttribute('aria-label').toLowerCase();
                // Procurar por palavras relacionadas a notificações
                if (label.includes('notification') || label.includes('notificações') || label.includes('alert')) {
                    return el;
                }
            }
            // Verificar classes que possam indicar botão de notificação
            if (el.className && typeof el.className === 'string') {
                const classNames = el.className.toLowerCase();
                if (classNames.includes('notification') || classNames.includes('alert') || classNames.includes('notify')) {
                    return el;
                }
            }
            // Pode expandir com outros critérios
        }
        // Caso não encontre, retorna null
        return null;
    }

    function startObserver() {
        const observer = new MutationObserver(checkForCustomerMessages);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Timer robusto
    let mainTimer = null;
    let lastTick = Date.now();

    function tick() {
        lastTick = Date.now();
        updateTimers();
    }

    function startMainTimer() {
        if (mainTimer) clearInterval(mainTimer);
        mainTimer = setInterval(tick, 1000);
        tick();
    }

    function startWatchdog() {
        const WATCHDOG_THRESHOLD_MS = 15000;
        setInterval(() => {
            const now = Date.now();
            if (now - lastTick > WATCHDOG_THRESHOLD_MS) {
                console.log('Watchdog: atraso detectado, reiniciando timer.');
                startMainTimer();
            }
        }, 5000);
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            tick();
            if (hasUnreadMessage) userViewedMessages = true;
        }
    });

    window.addEventListener('load', () => {
        setTimeout(() => {
            startObserver();
            checkForCustomerMessages();
            startMainTimer();
            startWatchdog();
        }, 2500);
    });

})();
