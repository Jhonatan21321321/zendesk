// ==UserScript==
// @name         Zendesk Customer Notification Sound & Timer with Tab Title Update
// @namespace    https://yourdomain.com
// @version      3.6
// @description  Play sound, show timer for last customer message in Zendesk and update tab title timer using .iACaSM time and last full name from .iACaSM span.kawtYt
// @author       Modified
// @match        *://*.zendesk.com/*
// @grant        GM_addStyle
// @downloadURL https://update.greasyfork.org/scripts/546829/Zendesk%20Customer%20Notification%20Sound%20%20Timer%20with%20Tab%20Title%20Update.user.js
// @updateURL https://update.greasyfork.org/scripts/546829/Zendesk%20Customer%20Notification%20Sound%20%20Timer%20with%20Tab%20Title%20Update.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const notificationSound = new Audio("https://zvukitop.com/wp-content/uploads/2021/03/zvuki-opovesheniya.mp3");
    let lastCustomerMessageTime = null;
    let timerElement = null;
    let originalTitle = document.title;

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

    function updateTimer() {
        if (!lastCustomerMessageTime) return;

        const now = new Date();
        const diff = Math.floor((now - lastCustomerMessageTime) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;

        const timer = createTimerElement();
        timer.textContent = `Última mensagem: ${minutes}m ${seconds}s atrás`;
    }

    function updateTabTimer() {
        const times = document.querySelectorAll('.iACaSM time');
        const spans = document.querySelectorAll('.iACaSM span.kawtYt');

        if (times.length === 0) {
            document.title = originalTitle;
            return;
        }

        const lastTimeElement = times[times.length - 1];
        const messageTime = new Date(lastTimeElement.dateTime);
        const now = new Date();
        const diff = Math.floor((now - messageTime) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;

        const timeString = `[${minutes}m ${seconds}s]`;

        let lastFullName = '';
        if (spans.length > 0) {
            lastFullName = spans[spans.length - 1].textContent.trim();
        }

        document.title = lastFullName
            ? `${timeString} ${lastFullName} - ${originalTitle}`
            : `${timeString} ${originalTitle}`;
    }

    function checkForCustomerMessages() {
        const times = document.querySelectorAll('.iACaSM time');
        const notificationButton = document.querySelector('button[aria-label="Notifications"]');

        if (times.length > 0 && notificationButton) {
            const lastTimeElement = times[times.length - 1];
            const messageTime = new Date(lastTimeElement.dateTime);

            if (!lastCustomerMessageTime || messageTime > lastCustomerMessageTime) {
                lastCustomerMessageTime = messageTime;
                notificationSound.play();
                notificationButton.classList.add("has-new-customer-messages");

                if (!window.timerInterval) {
                    window.timerInterval = setInterval(() => {
                        updateTimer();
                        updateTabTimer();
                    }, 1000);
                }
            }
        } else {
            if (notificationButton) {
                notificationButton.classList.remove("has-new-customer-messages");
            }
        }
    }

    function startObserver() {
        const observer = new MutationObserver(checkForCustomerMessages);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            startObserver();
            updateTabTimer();
            setInterval(updateTabTimer, 1000);
        }, 3000);
    });

})();
