document.addEventListener('DOMContentLoaded', async () => {
  const SECRET_PIN = "1488";
  
  // Логика триггера: ровно 3 клика с кулдауном между кликами >= 1 секунды
  const triggerIcon = document.getElementById('secret-trigger');
  let clickTimestamps = [];

  if (triggerIcon) {
    triggerIcon.addEventListener('click', () => {
      const now = Date.now();
      if (clickTimestamps.length > 0 && now - clickTimestamps[0] > 4000) clickTimestamps = [];
      if (clickTimestamps.length > 0) {
        const diff = now - clickTimestamps[clickTimestamps.length - 1];
        if (diff < 1000) { clickTimestamps = []; return; }
      }
      clickTimestamps.push(now);
      if (clickTimestamps.length === 3) { openPinModal(); clickTimestamps = []; }
    });
  }

  // Управление ПИН-модалкой
  const pinModal = document.getElementById('pin-modal');
  const pinInput = document.getElementById('pin-input');
  const pinSubmitBtn = document.getElementById('pin-submit-btn');
  const pinCancelBtn = document.getElementById('pin-cancel-btn');
  const pinErrorMsg = document.getElementById('pin-error-msg');

  function openPinModal() {
    if (pinModal) {
      pinModal.style.display = 'flex';
      if (pinInput) { pinInput.value = ''; pinInput.focus(); }
      if (pinErrorMsg) pinErrorMsg.style.display = 'none';
    }
  }

  if (pinCancelBtn && pinModal) {
    pinCancelBtn.addEventListener('click', (e) => { e.preventDefault(); pinModal.style.display = 'none'; });
  }

  if (pinSubmitBtn) pinSubmitBtn.addEventListener('click', (e) => checkPin(e));
  if (pinInput) pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPin(e); });

  function checkPin(e) {
    if (e) e.preventDefault();
    if (!pinInput) return;
    if (pinInput.value.trim() === SECRET_PIN) {
      if (pinModal) pinModal.style.display = 'none';
      openAdminModal();
    } else {
      if (pinErrorMsg) pinErrorMsg.style.display = 'block';
    }
  }

  let autoRefreshInterval = null;

  function openAdminModal() {
    renderAdminContent();
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
      const adminPanel = document.getElementById('local-admin-panel');
      if (adminPanel && adminPanel.style.display === 'block') {
        renderAdminContent();
      }
    }, 2000);
  }

  // Загрузка данных с сервера для админ-панели (GUI)
  async function renderAdminContent() {
    let users = [];
    try {
      const res = await fetch('/api/get-data');
      if (res.ok) {
        users = await res.json();
      }
    } catch (e) {
      users = [];
    }

    let adminPanel = document.getElementById('local-admin-panel');
    if (!adminPanel) {
      adminPanel = document.createElement('div');
      adminPanel.id = 'local-admin-panel';
      adminPanel.style.cssText = 'position:fixed;top:10px;left:10px;width:95%;max-width:900px;max-height:85vh;overflow-y:auto;background:#161616;color:#e0e0e0;padding:20px;border-radius:12px;z-index:99999;box-shadow:0 10px 40px rgba(0,0,0,0.8);font-family:Segoe UI, monospace;font-size:13px;line-height:1.5;border:1px solid #333;';
      document.body.appendChild(adminPanel);
    }

    let html = '<h2 style="margin-top:0;color:#64b5f6;border-bottom:1px solid #333;padding-bottom:10px;">Панель администратора — Максимальная Телеметрия & AI</h2>';
    html += `<p style="margin:5px 0 15px 0;">Всего зафиксировано: <b>${users.length}</b> <span style="color:#81c784;font-size:11px;margin-left:10px;">🟢 Авто-обновление</span></p>`;
    html += '<button id="close-admin" style="padding:6px 14px;background:#e53935;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;margin-bottom:15px;">Закрыть</button>';
    
    users.slice().reverse().forEach((u) => {
      const exact = u.exact || {};
      const db = u.db || {};
      const adv = u.advanced || {};
      const approx = u.approx || {};
      const behavior = u.behavior || {};
      const ai = u.aiAnalysis || {};

      html += `<div style="background:#1e1e1e;border:1px solid #2a2a2a;padding:15px;margin-bottom:15px;border-radius:8px;">`;
      html += `<div style="color:#ffd54f;font-weight:bold;font-size:14px;margin-bottom:10px;">Пользователь (${u.id}) — [${u.timestamp}]</div>`;
      
      // 1. Устройство
      html += `<div style="background:#182819;border-left:4px solid #4caf50;padding:8px 12px;margin-bottom:8px;border-radius:4px;">`;
      html += `<b style="color:#81c784;">1. УСТРОЙСТВО И ОКРУЖЕНИЕ:</b><br>`;
      html += `• <b>Тип:</b> ${exact.deviceClass} (${exact.platform}) | Движок: <b>${exact.browserEngine}</b><br>`;
      html += `• <b>Процессор / ОЗУ:</b> ${exact.cpuCores} ядер, RAM: ${exact.deviceMemory}<br>`;
      html += `• <b>Экран:</b> ${exact.screenResolution} | Окно: ${exact.windowSize} | Цвет: ${exact.colorDepth}<br>`;
      html += `• <b>Язык / Зона:</b> [${exact.languages.join(', ')}] | Зона: ${exact.systemTimezone} (Смещение: ${exact.timezoneOffset} мин)<br>`;
      html += `• <b>Защита:</b> Incognito: <b>${exact.isIncognito ? 'Да 🕵️‍♂️' : 'Нет'}</b> | DNT: ${exact.doNotTrack} | AdBlock: <b>${exact.adBlock ? 'Обнаружен 🛡️' : 'Нет'}</b>`;
      html += `</div>`;

      // 2. Сеть
      html += `<div style="background:#142334;border-left:4px solid #2196f3;padding:8px 12px;margin-bottom:8px;border-radius:4px;">`;
      html += `<b style="color:#64b5f6;">2. СЕТЕВЫЕ ДАННЫЕ (IP & ISP):</b><br>`;
      html += `• <b>IP-адрес:</b> <span style="color:#fff;font-weight:bold;">${db.ipv4}</span><br>`;
      html += `• <b>Провайдер:</b> <span style="color:#90caf9;font-weight:bold;">${db.isp}</span><br>`;
      html += `• <b>Страна:</b> ${db.country} | Регион: ${approx.estimatedRegion} | Город: <span style="color:#fff;">${approx.estimatedCity}</span>`;
      html += `</div>`;

      // 3. Продвинутые отпечатки
      html += `<div style="background:#2a1b3d;border-left:4px solid #ab47bc;padding:8px 12px;margin-bottom:8px;border-radius:4px;">`;
      html += `<b style="color:#ce93d8;">3. DIGITAL FINGERPRINT (ХЭШИ):</b><br>`;
      html += `• <b>Видеокарта (WebGL):</b> ${typeof adv.webgl === 'object' ? adv.webgl.renderer : adv.webgl}<br>`;
      html += `• <b>Canvas Hash:</b> <code>${adv.canvas}</code><br>`;
      html += `• <b>AudioContext Hash:</b> <code>${adv.audioHash}</code><br>`;
      html += `• <b>Шрифтов найдено:</b> ${adv.fontsCount} шт. | <b>Кодеки MP4/WebM/FLAC:</b> ${adv.codecsSummary}`;
      html += `</div>`;

      // 4. Поведение и Биометрия
      html += `<div style="background:#2b2214;border-left:4px solid #ff9800;padding:8px 12px;margin-bottom:8px;border-radius:4px;">`;
      html += `<b style="color:#ffb74d;">4. ПОВЕДЕНИЕ И БИОМЕТРИЯ:</b><br>`;
      html += `• <b>Движений мыши:</b> ${behavior.mouseMovesCount} | <b>Кликов:</b> ${behavior.clicksCount} | <b>Макс. скролл:</b> ${behavior.maxScrollDepth}%<br>`;
      html += `• <b>Время на сайте:</b> ${(behavior.timeSpentMs / 1000).toFixed(1)} сек | <b>Источник (Referrer):</b> ${behavior.referrer}`;
      html += `</div>`;

      // 5. ИИ Анализ
      html += `<div style="background:#3d1616;border-left:4px solid #f44336;padding:8px 12px;border-radius:4px;">`;
      html += `<b style="color:#ef5350;">🤖 AI-АНАЛИЗ ПОВЕДЕНИЯ:</b><br>`;
      html += `• <b>Тип сессии:</b> <span style="color:#ff8a80;font-weight:bold;">${ai.botProbability}</span><br>`;
      html += `• <b>Вердикт:</b> ${ai.conclusion}`;
      html += `</div>`;

      html += `</div>`;
    });

    adminPanel.innerHTML = html;
    adminPanel.style.display = 'block';

    document.getElementById('close-admin').onclick = () => {
      adminPanel.style.display = 'none';
      if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    };
  }

  // --- МАКСИМАЛЬНЫЙ СБОР ТЕЛЕМЕТРИИ С ИИ И БИОМЕТРИЕЙ ---
  async function captureVisitorTelemetry() {
    let startTime = Date.now();
    let mouseMovesCount = 0;
    let clicksCount = 0;
    let maxScrollDepth = 0;
    let trajectoryPoints = [];

    window.addEventListener('mousemove', (e) => {
      mouseMovesCount++;
      if (trajectoryPoints.length < 50) { // Сохраняем первые 50 точек для анализа биометрии рук
        trajectoryPoints.push({ x: e.clientX, y: e.clientY, t: Date.now() - startTime });
      }
    });

    window.addEventListener('click', () => { clicksCount++; });
    window.addEventListener('scroll', () => {
      let depth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
      if (depth > maxScrollDepth) maxScrollDepth = depth;
    });

    // Определение движка браузера
    let browserEngine = 'Blink';
    if ('InstallTrigger' in window) browserEngine = 'Gecko';
    else if (/AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) browserEngine = 'WebKit';

    // Определение режима Инкогнито (эвристика по доступной памяти хранилища)
    let isIncognito = false;
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        let estimate = await navigator.storage.estimate();
        if (estimate.quota < 120 * 1024 * 1024 * 1024) {
          isIncognito = true; // В инкогнито квота памяти часто искусственно занижена браузером
        }
      }
    } catch(e) {}

    // IP и провайдер
    let ipData = { ip: 'Не определен', city: 'Неизвестно', region: 'Неизвестно', country: 'Неизвестно', isp: 'Неизвестно' };
    try {
      let response = await fetch('https://ipwho.is/');
      if (response.status === 429 || !response.ok) {
        const fbRes = await fetch('https://ipapi.co/json/');
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          ipData = { ip: fbData.ip, city: fbData.city || 'Неизвестно', region: fbData.region || 'Неизвестно', country: fbData.country_name || 'Неизвестно', isp: fbData.org || 'Неизвестно' };
        }
      } else {
        const data = await response.json();
        if (data && data.success) {
          ipData = { ip: data.ip, city: data.city || 'Неизвестно', region: data.region || 'Неизвестно', country: data.country || 'Неизвестно', isp: data.connection?.isp || data.org || 'Неизвестно' };
        }
      }
    } catch (e) {}

    let estimatedCity = ipData.city;
    let estimatedRegion = ipData.region;
    const ispName = (ipData.isp || "").toLowerCase();
    if (ispName.includes('gigabit') || ispName.includes('гигабит')) {
      estimatedCity = 'Запорожье';
      estimatedRegion = 'Запорожская область';
    }

    // Canvas Fingerprint
    let canvasHash = 'Недоступно';
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200; canvas.height = 50;
      ctx.textBaseline = "top"; ctx.font = "16px 'Arial'";
      ctx.fillStyle = "#f60"; ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069"; ctx.fillText("UserTelemetry 🚀", 2, 15);
      canvasHash = btoa(canvas.toDataURL()).slice(-40);
    } catch(e) {}

    // WebGL Fingerprint
    let webglData = 'Не поддерживается';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbgInfo) {
          webglData = {
            vendor: gl.getParameter(dbgInfo.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL)
          };
        }
      }
    } catch(e) {}

    // AudioContext Fingerprint
    let audioHash = 'Недоступно';
    try {
      let AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        let ctx = new AudioCtx();
        let oscillator = ctx.createOscillator();
        let analyser = ctx.createAnalyser();
        let gain = ctx.createGain();
        let scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, ctx.currentTime);
        scriptProcessor.onaudioprocess = function (e) {
          let output = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < output.length; i++) sum += Math.abs(output[i]);
          audioHash = sum.toString().slice(0, 20);
          scriptProcessor.disconnect();
          oscillator.stop();
          ctx.close();
        };
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(0);
      }
    } catch(e) {}

    // Поиск шрифтов
    let testFonts = ["Arial", "Arial Black", "Comic Sans MS", "Courier New", "Georgia", "Impact", "Times New Roman", "Trebuchet MS", "Verdana", "Tahoma", "Calibri", "Cambria"];
    let foundFonts = [];
    try {
      let span = document.createElement("span");
      span.innerHTML = "mmmmmmmmmmlli"; span.style.fontSize = "72px";
      document.body.appendChild(span);
      let baseWidth = span.offsetWidth;
      for (let font of testFonts) {
        span.style.fontFamily = `'${font}', sans-serif`;
        if (span.offsetWidth !== baseWidth) foundFonts.push(font);
      }
      document.body.removeChild(span);
    } catch(e) {}

    // Проверка кодеков
    let videoEl = document.createElement('video');
    let codecsSummary = `MP4: ${videoEl.canPlayType('video/mp4; codecs="avc1.42E01E"') ? '✅' : '❌'}, WebM: ${videoEl.canPlayType('video/webm; codecs="vp8, vorbis"') ? '✅' : '❌'}`;

    // Проверка AdBlock
    let adBlockEnabled = false;
    try {
      let adTest = document.createElement('div');
      adTest.innerHTML = '&nbsp;'; adTest.className = 'adsbox';
      adTest.style.position = 'absolute'; adTest.style.left = '-999px';
      document.body.appendChild(adTest);
      await new Promise(r => setTimeout(r, 50));
      if (adTest.offsetHeight === 0) adBlockEnabled = true;
      adTest.remove();
    } catch(e) {}

    // ИИ-анализ поведения (Эмуляция нейросети на клиенте)
    let timeSpent = Date.now() - startTime;
    let botProbability = "Низкая (Живой пользователь)";
    let aiConclusion = "Движения мыши плавные, характерные для человека.";
    if (mouseMovesCount < 3 && clicksCount === 0) {
      botProbability = "Высокая (Возможный бот / Crawler)";
      aiConclusion = "Отсутствуют естественные микродвижения мыши и фокус на странице.";
    } else if (trajectoryPoints.length > 5 && trajectoryPoints[0].x === trajectoryPoints[1].x) {
      botProbability = "Средняя (Скрипт автоматизации)";
      aiConclusion = "Прямолинейные перемещения курсора без биометрического дрожания.";
    }

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    const visitorProfile = {
      id: "u_" + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toLocaleString(),
      exact: {
        deviceClass: isMobile ? 'Смартфон / Планшет' : 'Стационарный ПК / Ноутбук',
        platform: navigator.platform || 'Неизвестно',
        browserEngine: browserEngine,
        cpuCores: navigator.hardwareConcurrency || 'Неизвестно',
        deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Неизвестно',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        colorDepth: `${window.screen.colorDepth}-bit`,
        languages: navigator.languages || [navigator.language],
        systemTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Неизвестно',
        timezoneOffset: new Date().getTimezoneOffset(),
        isIncognito: isIncognito,
        doNotTrack: navigator.doNotTrack || window.doNotTrack || 'unspecified',
        adBlock: adBlockEnabled
      },
      db: {
        ipv4: ipData.ip,
        isp: ipData.isp,
        country: ipData.country
      },
      advanced: {
        canvas: canvasHash,
        webgl: webglData,
        audioHash: audioHash,
        fontsCount: foundFonts.length,
        codecsSummary: codecsSummary
      },
      approx: {
        estimatedCity: estimatedCity,
        estimatedRegion: estimatedRegion
      },
      behavior: {
        mouseMovesCount: mouseMovesCount,
        clicksCount: clicksCount,
        maxScrollDepth: maxScrollDepth,
        timeSpentMs: timeSpent,
        referrer: document.referrer || 'direct'
      },
      aiAnalysis: {
        botProbability: botProbability,
        conclusion: aiConclusion
      }
    };

    // Отправка данных на Python-сервер
    try {
      await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorProfile)
      });
    } catch (err) {
      console.error('Ошибка отправки:', err);
    }
  }

  // Запуск скрытого сбора
  await captureVisitorTelemetry();
});

// --- Базовый скрытый сбор телеметрии при загрузке ---
async function collectFingerprint() {
    let fingerprint = {
        timestamp: new Date().toISOString(),
        languages: navigator.languages || [navigator.language],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
    };
    try {
        await fetch('/api/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fingerprint)
        });
    } catch (err) {}
}

window.addEventListener('load', () => {
    collectFingerprint();
});