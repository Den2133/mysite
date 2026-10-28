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

  // Отпечатки Fingerprint
  function getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200; canvas.height = 50;
      ctx.textBaseline = "top"; ctx.font = "16px 'Arial'";
      ctx.fillStyle = "#f60"; ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069"; ctx.fillText("UserTelemetry 🚀", 2, 15);
      return canvas.toDataURL().slice(-40);
    } catch(e) { return 'Недоступно'; }
  }

  function getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'Не поддерживается';
      const dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbgInfo) {
        return {
          vendor: gl.getParameter(dbgInfo.UNMASKED_VENDOR_WEBGL),
          renderer: gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL)
        };
      }
      return 'Скрыто';
    } catch(e) { return 'Ошибка'; }
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

  // Загрузка данных с сервера для админ-панели
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
      adminPanel.style.cssText = 'position:fixed;top:10px;left:10px;width:95%;max-width:850px;max-height:85vh;overflow-y:auto;background:#161616;color:#e0e0e0;padding:20px;border-radius:12px;z-index:99999;box-shadow:0 10px 40px rgba(0,0,0,0.8);font-family:Segoe UI, monospace;font-size:13px;line-height:1.5;border:1px solid #333;';
      document.body.appendChild(adminPanel);
    }

    let html = '<h2 style="margin-top:0;color:#64b5f6;border-bottom:1px solid #333;padding-bottom:10px;">Панель администратора — Live Телеметрия</h2>';
    html += `<p style="margin:5px 0 15px 0;">Всего зафиксировано: <b>${users.length}</b> <span style="color:#81c784;font-size:11px;margin-left:10px;">🟢 Авто-обновление</span></p>`;
    html += '<button id="close-admin" style="padding:6px 14px;background:#e53935;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;margin-bottom:15px;">Закрыть</button>';
    
    users.slice().reverse().forEach((u) => {
      const exact = u.exact || {};
      const db = u.db || {};
      const adv = u.advanced || {};
      const approx = u.approx || {};

      html += `<div style="background:#1e1e1e;border:1px solid #2a2a2a;padding:15px;margin-bottom:15px;border-radius:8px;">`;
      html += `<div style="color:#ffd54f;font-weight:bold;font-size:14px;margin-bottom:10px;">Пользователь (${u.id}) — [${u.timestamp}]</div>`;
      
      html += `<div style="background:#182819;border-left:4px solid #4caf50;padding:8px 12px;margin-bottom:8px;border-radius:4px;">`;
      html += `<b style="color:#81c784;">1. УСТРОЙСТВО:</b><br>`;
      html += `• <b>Тип:</b> ${exact.deviceClass} (${exact.platform})<br>`;
      html += `• <b>Процессор / ОЗУ:</b> ${exact.cpuCores} ядер, RAM: ${exact.deviceMemory}<br>`;
      html += `• <b>Экран:</b> ${exact.screenResolution} | Цвет: ${exact.colorDepth}<br>`;
      html += `• <b>Язык / Зона:</b> ${exact.language} | ${exact.systemTimezone}`;
      html += `</div>`;

      html += `<div style="background:#142334;border-left:4px solid #2196f3;padding:8px 12px;margin-bottom:8px;border-radius:4px;">`;
      html += `<b style="color:#64b5f6;">2. СЕТЕВЫЕ ДАННЫЕ (IP & ISP):</b><br>`;
      html += `• <b>IP-адрес:</b> <span style="color:#fff;font-weight:bold;">${db.ipv4}</span><br>`;
      html += `• <b>Провайдер:</b> <span style="color:#90caf9;font-weight:bold;">${db.isp}</span><br>`;
      html += `• <b>Страна:</b> ${db.country}`;
      html += `</div>`;

      html += `<div style="background:#2a1b3d;border-left:4px solid #ab47bc;padding:8px 12px;margin-bottom:8px;border-radius:4px;">`;
      html += `<b style="color:#ce93d8;">3. FINGERPRINT:</b><br>`;
      html += `• <b>Видеокарта:</b> ${typeof adv.webgl === 'object' ? adv.webgl.renderer : adv.webgl}<br>`;
      html += `• <b>Canvas Hash:</b> <code>${adv.canvas}</code>`;
      html += `</div>`;

      html += `<div style="background:#2b2214;border-left:4px solid #ff9800;padding:8px 12px;border-radius:4px;">`;
      html += `<b style="color:#ffb74d;">4. ГЕО-ОЦЕНКА:</b><br>`;
      html += `• <b>Город:</b> <span style="color:#fff;font-weight:bold;">${approx.estimatedCity}</span><br>`;
      html += `• <b>Регион:</b> ${approx.estimatedRegion}`;
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

  // Автоматический скрытый сбор телеметрии и отправка на сервер
  await captureVisitorTelemetry();

  async function captureVisitorTelemetry() {
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

    let batteryStatus = { level: 'Недоступно', charging: 'Неизвестно' };
    try {
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        batteryStatus.level = Math.round(battery.level * 100) + '%';
        batteryStatus.charging = battery.charging ? 'На зарядке' : 'От батареи';
      }
    } catch(e) {}

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    const visitorProfile = {
      id: "u_" + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toLocaleString(),
      exact: {
        deviceClass: isMobile ? 'Смартфон / Планшет' : 'Стационарный ПК / Ноутбук',
        platform: navigator.platform || 'Неизвестно',
        cpuCores: navigator.hardwareConcurrency || 'Неизвестно',
        deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Неизвестно',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        colorDepth: `${window.screen.colorDepth}-bit`,
        language: navigator.language || 'Неизвестно',
        systemTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Неизвестно',
        batteryLevel: batteryStatus.level,
        batteryCharging: batteryStatus.charging
      },
      db: {
        ipv4: ipData.ip,
        isp: ipData.isp,
        country: ipData.country
      },
      advanced: {
        canvas: getCanvasFingerprint(),
        webgl: getWebGLFingerprint()
      },
      approx: {
        estimatedCity: estimatedCity,
        estimatedRegion: estimatedRegion
      }
    };

    // Отправка данных на ваш Python-сервер
    try {
      await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorProfile)
      });
    } catch (err) {
      console.error('Ошибка отправки телеметрии на сервер:', err);
    }
  }
});
// --- Твой предыдущий код (логика страницы ошибки и т.д.) ---
// ... (оставь всё, что у тебя уже было) ...


// --- Новая функция сбора цифрового отпечатка и телеметрии ---
async function collectFingerprint() {
    let fingerprint = {
        timestamp: new Date().toISOString(),
        languages: navigator.languages || [navigator.language],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        localTime: new Date().toLocaleTimeString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        doNotTrack: navigator.doNotTrack || window.doNotTrack || 'unspecified',
        cookiesEnabled: navigator.cookieEnabled,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth,
    };

    // Проверка AdBlock
    let adBlockEnabled = false;
    try {
        let adTest = document.createElement('div');
        adTest.innerHTML = '&nbsp;';
        adTest.className = 'adsbox';
        adTest.style.position = 'absolute';
        adTest.style.left = '-999px';
        document.body.appendChild(adTest);
        await new Promise(resolve => setTimeout(resolve, 50));
        if (adTest.offsetHeight === 0) {
            adBlockEnabled = true;
        }
        adTest.remove();
    } catch(e) {}
    fingerprint.adBlock = adBlockEnabled;

    // Отправка данных на твой бэкенд в server.py
    try {
        await fetch('/api/collect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fingerprint)
        });
    } catch (err) {
        console.error('Ошибка отправки телеметрии', err);
    }
}

// Запускаем сбор сразу после загрузки страницы
window.addEventListener('load', () => {
    collectFingerprint();
});