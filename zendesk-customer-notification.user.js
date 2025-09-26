// ==UserScript==
// @name         Zendesk Superbet Notification Sound & Robust Timer (Idioma-agnóstico)
// @namespace    https://yourdomain.com
// @version      4.6
// @description  Notificação sonora e timer para última mensagem do cliente no Zendesk, agora sem depender de idioma!
// @author       Modificado
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
    let originalTitle = document.title;
    let hasUnreadMessage = false;
    let userViewedMessages = false;

    // CSS
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

    // Função robusta para encontrar o botão de notificações, independente de idioma
    function findNotificationButton() {
        // 1. Busca por botão com SVG de sino (ícone universal de notificações)
        let candidates = Array.from(document.querySelectorAll('button, [role="button"]'));

        for (let btn of candidates) {
            // SVG sino: path com 'M10 21h4a2 2 0 0 0 2-2v-1' ou viewBox típico
            const svg = btn.querySelector('svg');
            if (svg && svg.innerHTML.match(/bell|notifica/i)) return btn;
            // Contém badge típico de notificações (ponto/vermelho)
            if (btn.innerHTML.match(/badge|dot|notifi/i)) return btn;
            // Classes comuns Zendesk (pode variar, mas algumas são recorrentes)
            if (btn.className && btn.className.toLowerCase().includes("notification")) return btn;
            // ARIA role notification
            if (btn.getAttribute('role') === 'notification') return btn;
        }
        // 2. Fallback: botão visível no topo direito com SVG
        let navButtons = Array.from(document.querySelectorAll('nav button, nav [role="button"]'));
        for (let btn of navButtons) {
            if (btn.offsetWidth > 0 && btn.querySelector('svg')) return btn;
        }
        return null;
    }

    // Timer de exibição
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
        return `${minutes}m ${seconds < 10 ? '0'+seconds : seconds}s`;
    }

    // Atualiza timer e título
    function updateTimers() {
        if (lastCustomerMessageTime) {
            const now = Date.now();
            const diff = Math.floor((now - lastCustomerMessageTime.getTime()) / 1000);
            const timer = createTimerElement();
            timer.textContent = `Última mensagem: ${formatDiffSeconds(diff)} atrás`;
        }

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
            if (spans.length > 0)
                lastFullName = spans[spans.length - 1].textContent.trim();

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

    // Checa novas mensagens
    function checkForCustomerMessages() {
        const times = document.querySelectorAll('.iACaSM time');
        const notificationButton = findNotificationButton();

        if (times.length > 0) {
            const lastTimeElement = times[times.length - 1];
            const messageTime = new Date(lastTimeElement.dateTime);

            if (!lastCustomerMessageTime || messageTime.getTime() > lastCustomerMessageTime.getTime()) {
                lastCustomerMessageTime = messageTime;
                hasUnreadMessage = true;
                userViewedMessages = false;
                try { notificationSound.play().catch(()=>{}); } catch(e) {}
                if (notificationButton) notificationButton.classList.add("has-new-customer-messages");
            }
        } else {
            if (notificationButton) {
                notificationButton.classList.remove("has-new-customer-messages");
            }
        }
    }

    // Observador de mudanças
    function startObserver() {
        const observer = new MutationObserver(checkForCustomerMessages);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Timer e watchdog
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
