// ==UserScript==
// @name         Valida Nome em div.cjmZAi e mostra Email (Superbet Zendesk) - Sem Dados Locais
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Clica no div.value.groups e valida emails em span.email-text exibindo dados no div.cjmZAi - Versão Google Sheets (sem fallback local)
// @author       Você
// @match        https://superbetbr.zendesk.com/agent/*
// @grant        GM_xmlhttpRequest
// @connect      docs.google.com
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Jhonatan21321321/zendesk/main/supermop.user.js
// @downloadURL  https://raw.githubusercontent.com/Jhonatan21321321/zendesk/main/supermop.user.js
// ==/UserScript==
(function () {
    'use strict';
    let contatos = {};
    let intervaloAtivo = null;
    let grupoClicado = false;
    // Criar botão
    const btn = document.createElement('button');
    btn.innerHTML = '🔄';
    btn.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:99999;padding:8px 12px;background:#667eea;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:16px;';
    btn.onclick = () => {
        btn.innerHTML = '⏳';
        if (intervaloAtivo) clearInterval(intervaloAtivo);
        document.querySelectorAll('.email-injetado').forEach(el => el.remove());
        grupoClicado = false;
        carregarDadosSheets(() => btn.innerHTML = '🔄');
    };
    document.body.appendChild(btn);
    // Função para carregar dados do Google Sheets
    function carregarDadosSheets(callback) {
        const sheetId = '1Mg4oqCx8CIyHKnSk7Nq7fGbrztoD6e-pa2fPgmPNO_I';
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText.substring(47).slice(0, -2));
                    processarDadosSheets(data);
                    if (callback) callback();
                } catch (e) {
                    console.error('Erro ao processar dados do Sheets:', e);
                }
            },
            onerror: function(error) {
                console.error('Erro ao carregar dados do Sheets:', error);
            }
        });
    }
    function processarDadosSheets(data) {
        contatos = {};
        data.table.rows.forEach(row => {
            const email = row.c[0]?.v;
            const supervisor = row.c[1]?.v;
            const canal = row.c[2]?.v;
            if (email && supervisor && canal) {
                contatos[email] = [supervisor, canal];
            }
        });
        console.log('Dados carregados do Sheets:', contatos);
        iniciarMonitoramento();
    }
    function iniciarMonitoramento() {
        if (intervaloAtivo) clearInterval(intervaloAtivo);
        intervaloAtivo = setInterval(() => {
            const el = document.querySelector("div.value.groups");
            if (el && !grupoClicado) {
                el.click();
                grupoClicado = true;
            }
            const emailEl = document.querySelector("span.email-text");
            const target = document.querySelector("div.cjmZAi");
            if (emailEl && target && !target.querySelector(".email-injetado")) {
                const email = emailEl.innerText.trim();
                for (const emailKey in contatos) {
                    if (email.includes(emailKey)) {
                        const span = document.createElement("span");
                        span.className = "email-injetado";
                        span.style.cssText = "margin-left:8px;font-weight:bold;color:green;";
                        span.textContent = `${contatos[emailKey][0]} - ${contatos[emailKey][1]}`;
                        target.appendChild(span);
                        break;
                    }
                }
            }
        }, 1000);
    }
    carregarDadosSheets();
})();
