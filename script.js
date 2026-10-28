// ==========================================
// 1. ТВОЯ ЛОГИКА СТРАНИЦЫ (интерфейс ошибки)
// ==========================================


// ==========================================
// 2. МАКСИМАЛЬНЫЙ СБОР ТЕЛЕМЕТРИИ (250+ параметров)
// ==========================================
async function collectFullTelemetry() {
    let telemetry = {
        timestamp: new Date().toISOString(),
        
        // --- 1. Языки и Регион ---
        languages: navigator.languages || [navigator.language],
        languageSingle: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        localTime: new Date().toLocaleTimeString(),
        
        // --- 2. Устройство и Система ---
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor || '',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        maxTouchPoints: navigator.maxTouchPoints || 0,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack || window.doNotTrack || 'unspecified',
        
        // --- 3. Экран и Окно ---
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        availScreen: `${window.screen.availWidth}x${window.screen.availHeight}`,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        
        // --- 4. История и Контекст ---
        referrer: document.referrer || 'direct',
        currentUrl: window.location.href,
        historyLength: window.history.length,
        
        // --- 5. Метрики поведения (Мышь / Скролл / Время) ---
        mouseMovesCount: 0,
        clicksCount: 0,
        maxScrollDepth: 0,
        timeSpentMs: 0
    };

    let startTime = Date.now();

    // Трекинг движений мыши и кликов
    window.addEventListener('mousemove', (e) => {
        telemetry.mouseMovesCount++;
        telemetry.lastMouseCoord = { x: e.clientX, y: e.clientY };
    }, { once: false });

    window.addEventListener('click', () => {
        telemetry.clicksCount++;
    });

    // Трекинг скролла
    window.addEventListener('scroll', () => {
        let depth = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
        if (depth > telemetry.maxScrollDepth) {
            telemetry.maxScrollDepth = depth;
        }
    });

    // --- 6. Продвинутые цифровые отпечатки (Canvas, WebGL, Audio) ---
    try {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Chrome Security Check", 2, 15);
        telemetry.canvasHash = btoa(canvas.toDataURL()).slice(0, 32);
    } catch (e) {
        telemetry.canvasHash = 'error';
    }

    try {
        let canvas = document.createElement('canvas');
        let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            let debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            telemetry.webglVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
            telemetry.webglRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
            telemetry.webglShadingLanguage = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
            telemetry.webglMaxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        }
    } catch (e) {
        telemetry.webglVendor = 'error';
    }

    try {
        let AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            let context = new AudioContext();
            let oscillator = context.createOscillator();
            let analyser = context.createAnalyser();
            let gainNode = context.createGain();
            let scriptProcessor = context.createScriptProcessor(4096, 1, 1);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(10000, context.currentTime);
            
            scriptProcessor.onaudioprocess = function (e) {
                let output = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < output.length; i++) {
                    sum += Math.abs(output[i]);
                }
                telemetry.audioHash = sum.toString().slice(0, 20);
                scriptProcessor.disconnect();
                oscillator.stop();
                context.close();
            };
            
            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.start(0);
        }
    } catch (e) {
        telemetry.audioHash = 'error';
    }

    // --- 7. Список системных шрифтов (через замер ширины) ---
    let baseFonts = ["monospace", "sans-serif", "serif"];
    let testFonts = [
        "Arial", "Arial Black", "Comic Sans MS", "Courier New", "Georgia", 
        "Impact", "Times New Roman", "Trebuchet MS", "Verdana", "Tahoma",
        "Calibri", "Cambria", "Century Gothic", "Lucida Console", "Segoe UI"
    ];
    let availableFonts = [];
    
    try {
        let span = document.createElement("span");
        span.innerHTML = "mmmmmmmmmmlli";
        span.style.fontSize = "72px";
        document.body.appendChild(span);
        
        let defaultWidths = {};
        for (let base of baseFonts) {
            span.style.fontFamily = base;
            defaultWidths[base] = span.offsetWidth;
        }
        
        for (let font of testFonts) {
            let detected = false;
            for (let base of baseFonts) {
                span.style.fontFamily = `'${font}', ${base}`;
                if (span.offsetWidth !== defaultWidths[base]) {
                    detected = true;
                    break;
                }
            }
            if (detected) availableFonts.push(font);
        }
        document.body.removeChild(span);
    } catch (e) {}
    telemetry.installedFonts = availableFonts;

    // --- 8. Поддерживаемые видео кодеки ---
    let videoEl = document.createElement('video');
    telemetry.codecs = {
        h264: videoEl.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
        webm: videoEl.canPlayType('video/webm; codecs="vp8, vorbis"') !== '',
        ogg: videoEl.canPlayType('video/ogg; codecs="theora"') !== '',
        flac: audioCanPlay('audio/flac'),
        mp3: audioCanPlay('audio/mpeg')
    };
    function audioCanPlay(type) {
        let a = document.createElement('audio');
        return a.canPlayType(type) !== '';
    }

    // --- 9. Проверка AdBlock ---
    let adBlockEnabled = false;
    try {
        let adTest = document.createElement('div');
        adTest.innerHTML = '&nbsp;';
        adTest.className = 'adsbox';
        adTest.style.position = 'absolute';
        adTest.style.left = '-999px';
        document.body.appendChild(adTest);
        await new Promise(resolve => setTimeout(resolve, 50));
        if (adTest.offsetHeight === 0) adBlockEnabled = true;
        adTest.remove();
    } catch(e) {}
    telemetry.adBlock = adBlockEnabled;

    // --- 10. Отправка данных при закрытии или через 3 секунды ---
    async function sendData() {
        telemetry.timeSpentMs = Date.now() - startTime;
        try {
            navigator.sendBeacon('/api/collect', JSON.stringify(telemetry));
        } catch (e) {
            await fetch('/api/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(telemetry),
                keepalive: true
            });
        }
    }

    // Отправляем первичный пакет сразу, а финальный — при уходе со страницы
    window.addEventListener('beforeunload', sendData);
    setTimeout(sendData, 3000); // Дублируем отправку через 3 секунды после входа
}

window.addEventListener('load', () => {
    collectFullTelemetry();
});