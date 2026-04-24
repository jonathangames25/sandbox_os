document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    const clock = document.getElementById('clock');
    const desktop = document.getElementById('desktop');
    const captionBar = document.getElementById('gemini-captions');
    const captionContent = document.getElementById('caption-content');
    const loginScreen = document.getElementById('login-screen');
    const bootScreen = document.getElementById('boot-screen');
    const loginOk = document.getElementById('login-ok');
    const loginCancel = document.getElementById('login-cancel');
    const startupAudio = document.getElementById('startup-audio');

    // Simulate Boot Process
    setTimeout(() => {
        if (bootScreen) bootScreen.style.display = 'none';
        if (loginScreen) loginScreen.style.display = 'flex';
    }, 4000); // 4 second boot animation

    if (loginOk) {
        loginOk.onclick = () => {
            loginScreen.style.display = 'none';
            if (startupAudio) {
                startupAudio.currentTime = 0;
                startupAudio.play().catch(e => console.warn("Audio playback failed:", e));
            }
            // Run startup apps after login
            setTimeout(runStartupApps, 2000);
        };
    }

    if (loginCancel) {
        loginCancel.onclick = () => {
            loginScreen.style.display = 'none';
            if (startupAudio) {
                startupAudio.currentTime = 0;
                startupAudio.play().catch(e => console.warn("Audio playback failed:", e));
            }
            setTimeout(runStartupApps, 2000);
        };
    }

    // Icon Fallback Logic
    window.handleIconError = function (img, initial) {
        img.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'icon-placeholder';
        placeholder.textContent = initial;
        img.parentNode.insertBefore(placeholder, img);
        img.onerror = null;
    };

    // Toggle Start Menu
    startButton.addEventListener('click', (e) => {
        console.log('Start button clicked');
        e.stopPropagation();
        startMenu.classList.toggle('show');
        startButton.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        startMenu.classList.remove('show');
        startButton.classList.remove('active');
    });

    // Update Clock
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        clock.textContent = `${hours}:${minutes} ${ampm}`;
    }

    setInterval(updateClock, 1000);
    updateClock();

    // Desktop Icons Selection
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            icons.forEach(i => i.style.backgroundColor = 'transparent');
            icons.forEach(i => i.style.outline = 'none');
            icon.style.backgroundColor = 'rgba(0, 0, 128, 0.5)';
            icon.style.outline = '1px dotted white';
        });
    });

    // Window Management
    let focusedWindow = null;
    let windowCount = 0;

    window.createWindow = function (title, content, options = {}) {
        const { width = 400, height = 300, responsive = true } = options;
        const win = document.createElement('div');
        win.className = 'window';
        win.style.left = (50 + (windowCount * 20)) + 'px';
        win.style.top = (50 + (windowCount * 20)) + 'px';
        win.style.width = width + 'px';
        win.style.height = height + 'px';
        win.dataset.responsive = responsive;
        
        windowCount++;
        win.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">${title}</div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize"></button>
                    <button aria-label="Maximize"></button>
                    <button aria-label="Close"></button>
                </div>
            </div>
            <div class="window-body">${content}</div>
            <div class="resizer"></div>
        `;
        document.body.appendChild(win);
        
        makeDraggable(win);
        makeResizable(win);

        const closeBtn = win.querySelector('button[aria-label="Close"]');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            win.remove();
        });

        const maxBtn = win.querySelector('button[aria-label="Maximize"]');
        maxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMaximize(win);
        });

        const minBtn = win.querySelector('button[aria-label="Minimize"]');
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            win.style.display = 'none';
        });

        win.querySelector('.title-bar').addEventListener('dblclick', () => {
            toggleMaximize(win);
        });

        win.addEventListener('mousedown', () => focusWindow(win));
        focusWindow(win);
        addTaskbarButton(title, win);
    };

    function toggleMaximize(win) {
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            win.style.width = win.dataset.oldWidth || '400px';
            win.style.height = win.dataset.oldHeight || '300px';
        } else {
            win.dataset.oldWidth = win.style.width;
            win.dataset.oldHeight = win.style.height;
            win.classList.add('maximized');
        }
    }

    function makeResizable(win) {
        const resizer = win.querySelector('.resizer');
        resizer.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (win.classList.contains('maximized')) return;

            let startWidth = parseInt(document.defaultView.getComputedStyle(win).width, 10);
            let startHeight = parseInt(document.defaultView.getComputedStyle(win).height, 10);
            let startX = e.clientX;
            let startY = e.clientY;

            const onMouseMove = (e) => {
                let width = startWidth + e.clientX - startX;
                let height = startHeight + e.clientY - startY;
                
                // Minimum window size
                const MIN_WIDTH = 200;
                const MIN_HEIGHT = 150;
                if (width < MIN_WIDTH) width = MIN_WIDTH;
                if (height < MIN_HEIGHT) height = MIN_HEIGHT;

                win.style.width = width + 'px';
                win.style.height = height + 'px';

                // Handle non-responsive content or "very small" threshold
                const isResponsive = win.dataset.responsive === 'true';
                const body = win.querySelector('.window-body');
                const content = body.firstElementChild;
                
                if (content) {
                    if (!isResponsive || width < 250 || height < 200) {
                        // If not responsive or very small, keep content at its "intended" size
                        // For iframes, we might want to set a min-width/min-height or just let overflow happen
                        if (content.tagName === 'IFRAME') {
                            if (!isResponsive) {
                                // If not responsive, iframe stays fixed size
                                // (We'll set these in launchApp, but here we ensure they don't change)
                            } else {
                                // If responsive but "very small", maybe set a minimum size for the content
                                content.style.minWidth = '400px';
                                content.style.minHeight = '300px';
                            }
                        }
                    } else {
                        // Back to normal responsive
                        if (content.tagName === 'IFRAME') {
                            content.style.minWidth = '';
                            content.style.minHeight = '';
                        }
                    }
                }
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
    }

    function addTaskbarButton(title, win) {
        const btn = document.createElement('div');
        btn.className = 'win-button taskbar-button active';
        btn.innerHTML = `<span>${title}</span>`;
        document.getElementById('active-apps').appendChild(btn);
        btn.addEventListener('click', () => {
            win.style.display = 'block';
            focusWindow(win);
        });

        const observer = new MutationObserver(() => {
            if (!document.body.contains(win)) { btn.remove(); observer.disconnect(); }
        });
        observer.observe(document.body, { childList: true });
    }

    function focusWindow(win) {
        if (focusedWindow) focusedWindow.classList.remove('focused');
        focusedWindow = win;
        focusedWindow.classList.add('focused');
        const taskButtons = document.querySelectorAll('#active-apps .win-button');
        taskButtons.forEach(btn => btn.classList.remove('active'));
        const allWins = document.querySelectorAll('.window');
        let maxZ = 10;
        allWins.forEach(w => {
            const z = parseInt(w.style.zIndex) || 0;
            if (z > maxZ) maxZ = z;
        });
        win.style.zIndex = maxZ + 1;
    }

    function makeDraggable(win) {
        const titleBar = win.querySelector('.title-bar');
        titleBar.onmousedown = (e) => {
            if (e.button !== 0) return;
            if (win.classList.contains('maximized')) return;
            
            let pos3 = e.clientX, pos4 = e.clientY;
            document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
            document.onmousemove = (e) => {
                let pos1 = pos3 - e.clientX, pos2 = pos4 - e.clientY;
                pos3 = e.clientX; pos4 = e.clientY;
                win.style.top = (win.offsetTop - pos2) + "px";
                win.style.left = (win.offsetLeft - pos1) + "px";
            };
            focusWindow(win);
        };
    }

    // Launchers

    // --- GEMINI LIVE ---
    const geminiTrayIcon = document.getElementById('gemini-tray-icon');
    let geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    let isGeminiLiveActive = false;
    let ws = null;
    let audioContext = null;
    let processor = null;
    let microphone = null;
    let userSpeechBuffer = "";
    let aiSpeechBuffer = "";
    let isProcessing = false;

    function setCaption(text, isError = false) {
        if (!captionContent) return;
        captionContent.innerText = text;
        captionContent.className = isError ? 'caption-text caption-error' : 'caption-text';
        captionBar.classList.add('show');
    }

    function updateGeminiTray() {
        if (!geminiApiKey) {
            geminiTrayIcon.className = 'inactive';
            geminiTrayIcon.style.color = '#808080';
        } else if (isGeminiLiveActive) {
            geminiTrayIcon.className = 'active';
            geminiTrayIcon.style.color = '#000080';
        } else {
            geminiTrayIcon.className = 'inactive';
            geminiTrayIcon.style.color = '#000';
        }
    }

    updateGeminiTray();

    // --- APP MAKER HELPERS ---
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const { ipcRenderer } = require('electron');

    let appsRoot = localStorage.getItem('apps_root_path') || path.join(os.homedir(), 'Documents', 'SandboxOSApps');
    if (!fs.existsSync(appsRoot)) {
        try { fs.mkdirSync(appsRoot, { recursive: true }); } catch (e) { }
    }

    function getAppsRegistry() {
        const registryPath = path.join(appsRoot, 'apps.json');
        if (fs.existsSync(registryPath)) {
            try { 
                let apps = JSON.parse(fs.readFileSync(registryPath, 'utf-8')); 
                let changed = false;
                apps = apps.map((app, index) => {
                    if (!app.id) {
                        app.id = Date.now() + index;
                        changed = true;
                    }
                    if (!app.path && app.folder) {
                        app.path = path.join(appsRoot, app.folder);
                        changed = true;
                    }
                    return app;
                });
                if (changed) {
                    fs.writeFileSync(registryPath, JSON.stringify(apps, null, 2));
                }
                return apps;
            } catch (e) { return []; }
        }
        return [];
    }

    function updateAppsRegistry(appInfo) {
        const registryPath = path.join(appsRoot, 'apps.json');
        let apps = getAppsRegistry();
        let appId;
        const idx = apps.findIndex(a => a.name === appInfo.name);
        if (idx > -1) {
            apps[idx] = { ...apps[idx], ...appInfo };
            appId = apps[idx].id;
        } else {
            appId = Date.now();
            apps.push({ id: appId, showOnDesktop: true, ...appInfo });
        }
        fs.writeFileSync(registryPath, JSON.stringify(apps, null, 2));
        refreshProgramsMenu();
        refreshDesktop();
        return appId;
    }

    function refreshDesktop() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;
        
        // Remove existing shortcuts (keep the main App Maker icon if it exists)
        const appMaker = document.getElementById('app-maker-desktop');
        desktop.innerHTML = '';
        if (appMaker) desktop.appendChild(appMaker);

        const apps = getAppsRegistry().filter(app => app.showOnDesktop !== false);
        apps.forEach(app => {
            const icon = document.createElement('div');
            icon.className = 'desktop-icon app-shortcut';
            icon.dataset.id = app.id;
            icon.innerHTML = `
                <i class="fas ${app.icon || 'fa-window-maximize'} win-icon"></i>
                <span>${app.name}</span>
            `;
            
            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                window.launchApp(app.id);
            });

            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.desktop-icon').forEach(i => {
                    i.style.backgroundColor = 'transparent';
                    i.style.outline = 'none';
                });
                icon.style.backgroundColor = 'rgba(0, 0, 128, 0.5)';
                icon.style.outline = '1px dotted white';
            });

            icon.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e.clientX, e.clientY, app.id);
            });

            desktop.appendChild(icon);
        });
    }

    let contextMenuTargetId = null;
    function showContextMenu(x, y, appId) {
        const menu = document.getElementById('context-menu');
        if (!menu) return;
        contextMenuTargetId = appId;
        menu.style.display = 'block';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
    }

    document.addEventListener('click', () => {
        const menu = document.getElementById('context-menu');
        if (menu) menu.style.display = 'none';
    });

    const menuDelete = document.getElementById('menu-delete');
    if (menuDelete) {
        menuDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            if (contextMenuTargetId) {
                window.deleteShortcut(contextMenuTargetId);
            }
            const menu = document.getElementById('context-menu');
            if (menu) menu.style.display = 'none';
        });
    }

    const menuUninstall = document.getElementById('menu-uninstall');
    if (menuUninstall) {
        menuUninstall.addEventListener('click', (e) => {
            e.stopPropagation();
            if (contextMenuTargetId) {
                window.uninstallApp(contextMenuTargetId);
            }
            const menu = document.getElementById('context-menu');
            if (menu) menu.style.display = 'none';
        });
    }

    window.deleteShortcut = function(appId) {
        const apps = getAppsRegistry();
        const app = apps.find(a => a.id && a.id.toString() === appId.toString());
        if (app) {
            app.showOnDesktop = false;
            const registryPath = path.join(appsRoot, 'apps.json');
            fs.writeFileSync(registryPath, JSON.stringify(apps, null, 2));
            refreshDesktop();
        }
    };

    function refreshProgramsMenu() {
        const programsSubmenu = document.getElementById('programs-submenu');
        if (!programsSubmenu) return;

        const apps = getAppsRegistry();
        const categories = {
            'Accessories': { icon: 'fa-file-alt', items: [] },
            'Games': { icon: 'fa-gamepad', items: [] },
            'Development': { icon: 'fa-code', items: [] },
            'Tools': { icon: 'fa-wrench', items: [] },
            'Multimedia': { icon: 'fa-film', items: [] },
            'Other': { icon: 'fa-folder', items: [] }
        };

        // Populate items
        apps.forEach(app => {
            const cat = app.category || 'Other';
            if (!categories[cat]) categories[cat] = { icon: 'fa-folder', items: [] };
            categories[cat].items.push(app);
        });

        // Generate HTML
        let html = '';
        
        // Dynamic Categories
        Object.keys(categories).forEach(catName => {
            const cat = categories[catName];
            if (cat.items.length === 0) return;

            html += `
                <div class="start-menu-item">
                    <span>${catName}</span>
                    <span class="arrow">▶</span>
                    <div class="submenu">
                        ${cat.items.map(app => `
                            <div class="start-menu-item" onclick="window.launchApp('${app.id}')">
                                <i class="fas ${app.icon || 'fa-window-maximize'} win-icon-small"></i>
                                <span>${app.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        html += `
            <div class="start-menu-item" onclick="window.openStartupManager()">
                <i class="fas fa-play win-icon-small"></i>
                <span>Startup Apps</span>
            </div>
        `;

        programsSubmenu.innerHTML = html;
    }

    window.launchApp = function(appId) {
        const apps = getAppsRegistry();
        const app = apps.find(a => a.id && a.id.toString() === appId.toString());
        if (!app) return;

        const indexPath = path.join(app.path, 'index.html');
        if (fs.existsSync(indexPath)) {
            const isResponsive = app.responsive !== undefined ? app.responsive : true;
            const width = app.width || 640;
            const height = app.height || 480;
            
            const iframeStyle = isResponsive 
                ? "width:100%; height:100%; border:none; background:white;" 
                : `width:${width}px; height:${height}px; border:none; background:white;`;
                
            const content = `<iframe src="file://${indexPath}" style="${iframeStyle}"></iframe>`;
            
            window.createWindow(app.name, content, {
                width: width,
                height: height,
                responsive: isResponsive
            });
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        } else {
            alert("App index.html not found!");
        }
    };

    window.openUninstaller = function() {
        const apps = getAppsRegistry();
        let listHtml = apps.map(app => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:5px; border-bottom:1px solid #808080;">
                <div>
                    <i class="fas ${app.icon || 'fa-window-maximize'}" style="margin-right:10px;"></i>
                    <b>${app.name}</b> (${app.category || 'Other'})
                </div>
                <button class="win-button" style="width:80px;" onclick="window.uninstallApp('${app.id}')">Uninstall</button>
            </div>
        `).join('');

        if (apps.length === 0) listHtml = '<div style="padding:20px; text-align:center;">No apps installed.</div>';

        window.createWindow('Add/Remove Programs', `
            <div style="padding:15px; width:100%; height:100%; display:flex; flex-direction:column;">
                <p>To uninstall a program, select it from the list and click Uninstall.</p>
                <div style="flex:1; overflow-y:auto; background:white; border:2px inset #fff; padding:5px;" id="uninstaller-list">
                    ${listHtml}
                </div>
                <div style="margin-top:10px; display:flex; justify-content:flex-end;">
                    <button class="win-button" onclick="this.closest('.window').remove()" style="width:80px;">Close</button>
                </div>
            </div>
        `, { width: 450, height: 400 });
    };

    window.uninstallApp = function(appId) {
        if (!confirm("Are you sure you want to uninstall this app? This will delete all its files.")) return;
        
        const apps = getAppsRegistry();
        const appIdx = apps.findIndex(a => a.id && a.id.toString() === appId.toString());
        if (appIdx === -1) return;

        const app = apps[appIdx];
        try {
            // Delete folder recursively
            if (fs.existsSync(app.path)) {
                fs.rmSync(app.path, { recursive: true, force: true });
            }
            apps.splice(appIdx, 1);
            const registryPath = path.join(appsRoot, 'apps.json');
            fs.writeFileSync(registryPath, JSON.stringify(apps, null, 2));
            
            alert("App uninstalled successfully.");
            refreshProgramsMenu();
            refreshDesktop();
            // Refresh uninstaller list if window is open
            const list = document.getElementById('uninstaller-list');
            if (list) {
                window.openUninstaller(); // Re-open/refresh
                // Close the old one
                const wins = document.querySelectorAll('.window');
                if (wins.length > 1) wins[wins.length-2].remove(); 
            }
        } catch (e) {
            alert("Error uninstalling app: " + e.message);
        }
    };

    async function startGeminiLive() {
        if (!geminiApiKey) {
            alert('Please set your Google API Key in Settings first!');
            openSettingsApp();
            return;
        }

        setCaption("Establishing secure link...");

        try {
            const MODEL_NAME = "gemini-3.1-flash-live-preview"; // Reverting to stable model to avoid 1011 internal error
            const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`;

            ws = new WebSocket(WS_URL);

            ws.onopen = async () => {
                console.log('Gemini Live: WebSocket Connected');
                const configMessage = {
                    setup: {
                        model: `models/${MODEL_NAME}`,
                        generation_config: {
                            response_modalities: ['TEXT', 'AUDIO'],
                            speech_config: {
                                voice_config: { prebuilt_voice_config: { voice_name: 'Aoede' } }
                            }
                        },
                        system_instruction: {
                            parts: [{
                                text: `You are a helpful, enthusiastic, and youthful assistant living inside a Windows 95 computer. You respond with audio and text. You have a friendly, high-energy personality like a young girl. Stay in character.
                            
                            CURRENT APPS INSTALLED ON THIS OS:
                            ${JSON.stringify(getAppsRegistry(), null, 2)}
                            ` }]
                        }
                    }
                };
                ws.send(JSON.stringify(configMessage));

                const audioSuccess = await initAudio();
                if (audioSuccess) {
                    isGeminiLiveActive = true;
                    updateGeminiTray();
                    setCaption("Ready. Speak now.");

                    // Initial nudge will be sent in onmessage after setupComplete
                } else {
                    stopGeminiLive();
                }
            };

            ws.onmessage = async (event) => {
                let data = event.data;
                if (data instanceof Blob) {
                    data = await data.text();
                }

                try {
                    const response = JSON.parse(data);
                    console.log('Gemini Live: Message received', response);

                    if (response.setupComplete || response.setup_complete) {
                        console.log('Gemini Live: Setup Complete');
                        // Send a turn complete message to force a response now that setup is complete
                        sendTextMessage("Hello! Are you there?");
                        return;
                    }

                    const serverContent = response.server_content || response.serverContent;
                    if (serverContent) {
                        const modelTurn = serverContent.model_turn || serverContent.modelTurn;
                        if (modelTurn?.parts) {
                            for (const part of modelTurn.parts) {
                                const inlineData = part.inline_data || part.inlineData;
                                if (inlineData) {
                                    playAudioChunk(inlineData.data);
                                }
                                if (part.text) {
                                    aiSpeechBuffer += part.text;
                                    setCaption("Assistant: " + aiSpeechBuffer.trim());
                                    isProcessing = false;
                                }
                            }
                        }

                        const inputTranscription = serverContent.input_transcription || serverContent.inputTranscription;
                        if (inputTranscription) {
                            userSpeechBuffer += (inputTranscription.text + " ");
                            setCaption("You: " + userSpeechBuffer.trim());
                            isProcessing = true;
                        }

                        const outputTranscription = serverContent.output_transcription || serverContent.outputTranscription;
                        if (outputTranscription) {
                            aiSpeechBuffer += outputTranscription.text;
                            setCaption("Assistant: " + aiSpeechBuffer.trim());
                            isProcessing = false;
                        }
                    }

                    if (isProcessing) {
                        const trayIcon = document.getElementById('gemini-tray-icon');
                        trayIcon.style.opacity = "0.5";
                        if (captionContent.innerText.startsWith("Ready")) {
                            setCaption("Processing...");
                        }
                    } else {
                        document.getElementById('gemini-tray-icon').style.opacity = "1";
                    }

                    if (response.error) {
                        setCaption("AI Error: " + response.error.message, true);
                        console.error('Server Error:', response.error);
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e, data);
                }
            };

            ws.onerror = (e) => {
                setCaption("WebSocket communication failed.", true);
                stopGeminiLive();
            };

            ws.onclose = (event) => {
                if (event.code !== 1000) {
                    setCaption(`Link closed (${event.code}). Reason: ${event.reason || 'Network'}`, true);
                } else {
                    captionBar.classList.remove('show');
                }
                stopGeminiLive();
            };
        } catch (e) {
            setCaption("Link failure: " + e.message, true);
            stopGeminiLive();
        }
    }

    function sendTextMessage(text) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const msg = {
                realtimeInput: {
                    text: text
                }
            };
            ws.send(JSON.stringify(msg));
            console.log('Sent text input:', text);
        }
    }

    function sendAudioChunk(base64Data) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                realtimeInput: {
                    audio: {
                        data: base64Data,
                        mimeType: 'audio/pcm;rate=16000'
                    }
                }
            }));
        }
    }

    function stopGeminiLive() {
        isGeminiLiveActive = false;
        if (ws) { ws.close(); ws = null; }
        if (processor) { processor.disconnect(); processor = null; }
        if (microphone) { microphone.getTracks().forEach(track => track.stop()); microphone = null; }
        if (audioContext) {
            if (audioContext.state !== 'closed') audioContext.close();
            audioContext = null;
        }
        updateGeminiTray();
    }

    async function initAudio() {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCaption("Hardware Error: Microphone access denied.", true);
                return false;
            }
            audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            if (audioContext.state === 'suspended') await audioContext.resume();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphone = stream;
            const source = audioContext.createMediaStreamSource(stream);

            processor = audioContext.createScriptProcessor(2048, 1, 1);

            processor.onaudioprocess = (e) => {
                if (!isGeminiLiveActive || !ws || ws.readyState !== WebSocket.OPEN) return;

                const inputData = e.inputBuffer.getChannelData(0);

                let hasSound = false;
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i] * 3.0));
                    if (Math.abs(s) > 0.05) hasSound = true;
                    pcmData[i] = s * 0x7FFF;
                }

                if (hasSound) {
                    if (aiSpeechBuffer) {
                        aiSpeechBuffer = ""; // Clear AI buffer when user starts speaking
                        userSpeechBuffer = "";
                    }
                    const base64Data = arrayBufferToBase64(pcmData.buffer);
                    sendAudioChunk(base64Data);

                    if (!isProcessing) {
                        isProcessing = true;
                        setCaption("Listening...");
                    }
                } else if (Math.random() > 0.98) {
                    // Send very occasional silence to keep connection warm
                    const base64Data = arrayBufferToBase64(pcmData.buffer);
                    sendAudioChunk(base64Data);
                }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
            return true;
        } catch (err) {
            setCaption("Mic Error: " + err.message, true);
            return false;
        }
    }

    let nextStartTime = 0;
    function playAudioChunk(base64Data) {
        if (!audioContext || audioContext.state === 'closed') return;
        try {
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Int16Array(len / 2);
            for (let i = 0; i < len; i += 2) {
                bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
            }
            const floatData = new Float32Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) { floatData[i] = bytes[i] / 32768.0; }

            // The Gemini Live API sends audio at 24kHz
            const buffer = audioContext.createBuffer(1, floatData.length, 24000);
            buffer.getChannelData(0).set(floatData);

            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);

            const currentTime = audioContext.currentTime;
            // Add a small buffer to avoid jitter
            if (nextStartTime < currentTime) nextStartTime = currentTime + 0.05;
            source.start(nextStartTime);
            nextStartTime += buffer.duration;
        } catch (e) {
            console.error("Playback error:", e);
        }
    }

    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
        return window.btoa(binary);
    }

    geminiTrayIcon.addEventListener('click', () => {
        if (isGeminiLiveActive) stopGeminiLive(); else startGeminiLive();
    });


    // --- GESTURE CONTROLS ---
    const gestureTrayIcon = document.getElementById('gesture-tray-icon');
    let isGestureActive = false;
    let gestureHands = null;
    let gestureCamera = null;
    let gestureWin = null;
    let virtualCursor = null;
    let isPinching = false;
    let lastHandX = 0.5;
    let lastHandY = 0.5;

    // Smart Pinch Variables
    let pinchStartTime = 0;
    let pinchStartPos = { x: 0.5, y: 0.5 };
    let isPinchPending = false;
    let isDragging = false;
    const CLICK_MAX_DURATION = 300; // ms
    const DRAG_MOVE_THRESHOLD = 0.03; // screen normalized distance

    // Native Mouse Integration
    const { spawn } = require('child_process');
    let mouseProc = null;

    function startNativeMouse() {
        if (!mouseProc) {
            try {
                mouseProc = spawn(path.join(__dirname, 'mouse_controller.exe'));
                console.log("Native mouse controller started.");
            } catch (e) {
                console.error("Failed to start mouse controller:", e);
            }
        }
    }

    function stopNativeMouse() {
        if (mouseProc) {
            mouseProc.kill();
            mouseProc = null;
        }
    }

    function sendNativeMouse(command, x = 0, y = 0) {
        if (mouseProc && mouseProc.stdin) {
            if (command === 'MOVE') {
                mouseProc.stdin.write(`MOVE ${x} ${y}\n`);
            } else {
                mouseProc.stdin.write(`${command}\n`);
            }
        }
    }

    function initGestureSystem() {
        if (!virtualCursor) {
            virtualCursor = document.createElement('div');
            virtualCursor.id = 'virtual-cursor';
            virtualCursor.innerHTML = '<i class="fas fa-mouse-pointer" style="color: white; font-size: 24px;"></i>';
            document.body.appendChild(virtualCursor);
        }

        if (typeof Hands !== 'undefined' && !gestureHands) {
            gestureHands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            gestureHands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.6
            });

            gestureHands.onResults(onGestureResults);
        }
    }

    function onGestureResults(results) {
        const canvas = document.getElementById('gesture-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Mirror the entire drawing context for natural feel
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Draw gizmo (connectors and landmarks)
            // Safely access drawing utils from window
            const drawConn = window.drawConnectors;
            const drawLand = window.drawLandmarks;
            const handConn = window.HAND_CONNECTIONS || (window.Hands ? window.Hands.HAND_CONNECTIONS : null);

            if (drawConn && drawLand && handConn) {
                drawConn(ctx, landmarks, handConn, { color: '#00FF00', lineWidth: 3 });
                drawLand(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });
            }
        }
        ctx.restore();

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];

            // Heuristics to check if the user is pointing or pinching
            // (distance to wrist)
            const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            const indexExtended = dist(landmarks[8], landmarks[0]) > dist(landmarks[6], landmarks[0]);
            const middleCurled = dist(landmarks[12], landmarks[0]) < dist(landmarks[10], landmarks[0]);
            const isPointing = indexExtended && middleCurled;

            // Detect Pinch (Distance between thumb and index)
            const distance = dist(indexTip, thumbTip);
            const PINCH_THRESHOLD = 0.08;
            const isPinchingNow = distance < PINCH_THRESHOLD;

            const statusEl = document.querySelector('.gesture-status');

            if (isPointing || isPinchingNow) {
                // Only update position if pointing or pinching
                const targetX = 1 - indexTip.x; // Mirroring for cursor
                const targetY = indexTip.y;

                // Heavier smoothing during dragging for stability
                const lerpFactor = isDragging ? 0.85 : 0.6;
                lastHandX = lastHandX * lerpFactor + targetX * (1 - lerpFactor);
                lastHandY = lastHandY * lerpFactor + targetY * (1 - lerpFactor);

                // LOCK: Prevent cursor movement during the initial pinch phase 
                // to avoid jitter when the user is trying to Click.
                if (!isPinchPending) {
                    // Move Native OS Cursor
                    const screenX = Math.floor(lastHandX * window.screen.width);
                    const screenY = Math.floor(lastHandY * window.screen.height);
                    sendNativeMouse('MOVE', screenX, screenY);
                }

                // Hide virtual cursor
                if (virtualCursor) virtualCursor.classList.remove('active');
            }

            if (isPinchingNow) {
                if (statusEl) statusEl.textContent = "Action: PINCHING...";

                if (!isPinching) {
                    // Pinch Started
                    isPinching = true;
                    pinchStartTime = Date.now();
                    pinchStartPos = { x: lastHandX, y: lastHandY };
                    isPinchPending = true;
                    isDragging = false;
                    if (virtualCursor) virtualCursor.classList.add('clicking');
                } else if (isPinchPending) {
                    // Check if we should convert pending pinch to a drag
                    const moveDist = dist({ x: lastHandX, y: lastHandY }, pinchStartPos);
                    const duration = Date.now() - pinchStartTime;

                    if (moveDist > DRAG_MOVE_THRESHOLD || duration > CLICK_MAX_DURATION) {
                        isPinchPending = false;
                        isDragging = true;
                        sendNativeMouse('DOWN');
                        if (statusEl) statusEl.textContent = "Action: DRAGGING";
                    }
                }
            } else {
                // Pinch Released or not pinching
                if (isPinching) {
                    const duration = Date.now() - pinchStartTime;

                    if (isPinchPending) {
                        // Confirmed as a Click because it was released fast without dragging
                        // We send DOWN and UP in the same spot for a clean click
                        sendNativeMouse('DOWN');
                        sendNativeMouse('UP');
                        if (statusEl) statusEl.textContent = "Action: CLICKED";
                    } else if (isDragging) {
                        // Drag released
                        sendNativeMouse('UP');
                        if (statusEl) statusEl.textContent = "Action: DROPPED";
                    }

                    isPinching = false;
                    isPinchPending = false;
                    isDragging = false;
                    if (virtualCursor) virtualCursor.classList.remove('clicking');
                }

                if (statusEl) {
                    statusEl.textContent = isPointing ? "Action: POINT (MOVE)" : "Action: HAND DETECTED (IDLE)";
                }
            }
        } else {
            if (virtualCursor) virtualCursor.classList.remove('active');
            const statusEl = document.querySelector('.gesture-status');
            if (statusEl) statusEl.textContent = "Status: No hand detected";

            // Safety release
            if (isPinching) {
                if (isDragging) sendNativeMouse('UP');
                isPinching = false;
                isPinchPending = false;
                isDragging = false;
            }
        }
    }



    async function toggleGestures() {
        if (isGestureActive) {
            stopGestures();
            const win = [...document.querySelectorAll('.window')].find(w => w.querySelector('.title-bar-text')?.textContent === 'Hand Gesture Controls');
            if (win) win.remove();
        } else {
            startGestures();
        }
    }

    async function startGestures() {
        startNativeMouse();
        initGestureSystem();
        // Small delay to ensure previous hardware sessions are released
        await new Promise(r => setTimeout(r, 500));
        isGestureActive = true;

        gestureTrayIcon.classList.remove('inactive');
        gestureTrayIcon.classList.add('active');

        window.createWindow('Hand Gesture Controls', `
            <div class="gesture-container" style="position: relative; background: #000;">
                <video id="camera-feed" autoplay playsinline style="width: 100%; height: auto; display: block; transform: scaleX(-1);"></video>
                <canvas id="gesture-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
                <div class="gesture-status" style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.5); color: white; padding: 2px 5px; font-size: 10px;">Status: Initializing...</div>
            </div>

            <div style="margin-top:10px; font-size:11px; line-height: 1.4;">
                <b style="color: #000080;">Hand Controls Active</b><br>
                • Index Tip: Move Cursor<br>
                • Pinch: Click & Drag
            </div>
        `, { width: 350, height: 380 });

        gestureWin = document.querySelector('.window.focused');
        const videoElement = document.getElementById('camera-feed');

        try {
            console.log("Gesture Controls: Requesting camera access...");
            let stream = null;

            // Try default camera first
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (err) {
                console.warn("Gesture Controls: Default camera failed, searching for alternatives...", err.name);

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(d => d.kind === 'videoinput');

                for (const device of videoInputs) {
                    try {
                        console.log(`Gesture Controls: Trying camera: ${device.label}`);
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: { deviceId: { exact: device.deviceId } }
                        });
                        if (stream) {
                            console.log(`Gesture Controls: Successfully started camera: ${device.label}`);
                            break;
                        }
                    } catch (e) {
                        console.warn(`Gesture Controls: Camera ${device.label} failed:`, e.name);
                    }
                }
            }

            if (!stream) {
                throw new Error("Could not access any video source. Please ensure your camera is not in use by another app.");
            }

            videoElement.srcObject = stream;
            console.log("Gesture Controls: Camera stream obtained successfully.");

            let lastVideoTime = -1;


            videoElement.onloadedmetadata = () => {
                videoElement.play();
                console.log("Gesture Controls: Camera started successfully.");
                const statusEl = document.querySelector('.gesture-status');
                if (statusEl) statusEl.textContent = "Status: Camera Active";

                // Adjust canvas to match video internal resolution
                const canvas = document.getElementById('gesture-canvas');
                if (canvas) {
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;
                }

                const detectionLoop = async () => {
                    if (!isGestureActive) return;

                    if (videoElement.currentTime !== lastVideoTime) {
                        lastVideoTime = videoElement.currentTime;
                        if (gestureHands) {
                            try {
                                await gestureHands.send({ image: videoElement });
                            } catch (e) {
                                console.error("MediaPipe Send Error:", e);
                            }
                        }
                    }
                    requestAnimationFrame(detectionLoop);
                };


                requestAnimationFrame(detectionLoop);
            };
        } catch (err) {
            console.error("Gesture Controls: Initialization error:", err);
            const statusEl = document.querySelector('.gesture-status');
            if (statusEl) {
                statusEl.textContent = "Error: " + err.message;
                statusEl.style.color = 'red';
            }
            alert("Camera Initialization Error: " + err.message);
            stopGestures();
        }

        // Override close button for this specific window
        const closeBtn = gestureWin.querySelector('button[aria-label="Close"]');
        const originalParent = closeBtn.parentElement;
        const newClose = closeBtn.cloneNode(true);
        closeBtn.replaceWith(newClose);

        newClose.onclick = (e) => {
            e.stopPropagation();
            stopGestures();
            gestureWin.remove();
        };

        // Handle minimization
        const minBtn = gestureWin.querySelector('button[aria-label="Minimize"]');
        minBtn.onclick = (e) => {
            e.stopPropagation();
            gestureWin.style.display = 'none';
        };
    }

    function stopGestures() {
        isGestureActive = false;
        gestureTrayIcon.classList.remove('active');
        gestureTrayIcon.classList.add('inactive');
        const videoElement = document.getElementById('camera-feed');
        if (videoElement && videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
        }

        if (gestureCamera) {
            gestureCamera.stop();
            gestureCamera = null;
        }
        if (virtualCursor) virtualCursor.classList.remove('active');
        isPinching = false;
        stopNativeMouse();
    }

    gestureTrayIcon.addEventListener('click', toggleGestures);

    // --- APP MAKER ---

    window.openAppMaker = function () {
        const winId = 'app-maker-' + Date.now();
        window.createWindow('App Maker', `
            <div class="app-maker-chat" id="${winId}">
                <div class="app-maker-system-msg">App Maker Agent v1.0 - Ready to build.</div>
                <div class="chat-messages" id="${winId}-messages">
                    <div class="message ai">Hello! I am your Sandbox OS App Maker. Tell me what kind of app you want to build, and I will create it for you in the Windows 95 style!</div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="${winId}-input" placeholder="Type your request here...">
                    <button class="win-button" id="${winId}-send">Send</button>
                </div>
            </div>
        `, { width: 600, height: 550, responsive: true });

        const input = document.getElementById(`${winId}-input`);
        const sendBtn = document.getElementById(`${winId}-send`);
        const messagesCont = document.getElementById(`${winId}-messages`);

        const chatHistory = [
            { role: 'model', parts: [{ text: "Hello! I am your Sandbox OS App Maker. Tell me what kind of app you want to build, and I will create it for you in the Windows 95 style!" }] }
        ];

        async function sendMessage() {
            const text = input.value.trim();
            if (!text) return;
            input.value = '';

            // User Message
            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.textContent = text;
            messagesCont.appendChild(userMsg);
            messagesCont.scrollTop = messagesCont.scrollHeight;

            chatHistory.push({ role: 'user', parts: [{ text }] });

            // AI Response Placeholder
            const aiMsg = document.createElement('div');
            aiMsg.className = 'message ai';
            aiMsg.textContent = 'Thinking...';
            messagesCont.appendChild(aiMsg);
            messagesCont.scrollTop = messagesCont.scrollHeight;

            try {
                await runAppMakerTurn(text, aiMsg, chatHistory, messagesCont);
            } catch (err) {
                aiMsg.textContent = 'Error: ' + err.message;
            }
        }

        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
    };

    async function runAppMakerTurn(prompt, aiMsgElement, history, messagesCont) {
        if (!geminiApiKey) {
            aiMsgElement.textContent = "Please set your Gemini API Key in Control Panel first!";
            return;
        }

        const systemPrompt = `You are the "App Maker" for Sandbox OS (a Windows 95 themed environment).
Your goal is to help users create static web applications (HTML, JS, CSS).
RULES:
1. Every app must be stored in its own folder inside: ${appsRoot}
2. Every app must have an 'index.html' file.
3. Every app folder must contain a 'state.json' file with: { "name": "...", "description": "...", "category": "...", "icon": "...", "width": 800, "height": 600, "responsive": true, "progress": "...", "lastUpdate": "..." }.
4. The 'category' should be one of: Accessories, Games, Development, Tools, Multimedia, Other.
5. The 'icon' should be a FontAwesome 6 class name (e.g., 'fa-gamepad', 'fa-calculator', 'fa-code', 'fa-music').
6. Default size (width/height) should match the app's internal design. If the app is a fixed-size game, set 'responsive' to false.
6. You must update the global 'apps.json' file in the root apps directory whenever you create or update an app.
7. All apps must use a Windows 95 aesthetic (use classic colors, pixelated borders, MS Sans Serif font).
8. When asked to create an app, you should:
   - Create the directory.
   - Write the HTML/CSS/JS files.
   - Write the 'state.json' file.
   - Register it in the global 'apps.json'.
9. Response Format: You can perform multiple tool calls if needed.
10. Tools available: 
    - writeFile(path, content): Saves a file.
    - readFile(path): Reads a file.
    - mkdir(path): Creates a directory.
    - listFiles(path): Lists directory contents.

Current Apps: ${JSON.stringify(getAppsRegistry())}

Always respond with a JSON object if you want to call a tool:
{ "tool": "writeFile", "args": { "path": "...", "content": "..." }, "explanation": "..." }
Or a plain text response to the user.
If you need to do multiple things, do them one by one.`;

        let messageCount = 0;
        let currentStatus = "Generating...";
        let lastAppId = null;

        while (messageCount < 10) {
            messageCount++;
            aiMsgElement.textContent = currentStatus;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: history,
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "Gemini API Error");

            const textResponse = data.candidates[0].content.parts[0].text;
            let parsed = null;
            try {
                const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
            } catch (e) { }

            if (parsed && parsed.tool) {
                const toolMsg = document.createElement('div');
                toolMsg.className = 'message ai';
                toolMsg.style.fontStyle = 'italic';
                toolMsg.style.color = '#555';
                toolMsg.innerHTML = marked.parse(parsed.explanation || "Executing " + parsed.tool + "...");
                messagesCont.appendChild(toolMsg);
                messagesCont.scrollTop = messagesCont.scrollHeight;

                let result;
                try {
                    result = await executeAppMakerTool(parsed.tool, parsed.args);
                    if (result && result.appId) lastAppId = result.appId;
                    history.push({ role: 'model', parts: [{ text: textResponse }] });
                    history.push({ role: 'user', parts: [{ text: "TOOL_RESULT: " + JSON.stringify(result) }] });
                } catch (toolErr) {
                    history.push({ role: 'model', parts: [{ text: textResponse }] });
                    history.push({ role: 'user', parts: [{ text: "TOOL_ERROR: " + toolErr.message }] });
                }
            } else {
                const finalMsg = document.createElement('div');
                finalMsg.className = 'message ai';
                finalMsg.innerHTML = marked.parse(textResponse);
                messagesCont.appendChild(finalMsg);
                messagesCont.scrollTop = messagesCont.scrollHeight;
                
                history.push({ role: 'model', parts: [{ text: textResponse }] });
                aiMsgElement.style.display = 'none'; // Hide the "Thinking..." placeholder
                
                if (lastAppId) {
                    const launchMsg = document.createElement('div');
                    launchMsg.className = 'app-maker-system-msg';
                    launchMsg.style.marginTop = '10px';
                    launchMsg.textContent = "Launching your new app...";
                    messagesCont.appendChild(launchMsg);
                    messagesCont.scrollTop = messagesCont.scrollHeight;
                    setTimeout(() => window.launchApp(lastAppId), 1500);
                }
                break;
            }
        }
    }

    async function executeAppMakerTool(tool, args) {
        const fullPath = args.path ? (path.isAbsolute(args.path) ? args.path : path.join(appsRoot, args.path)) : null;

        switch (tool) {
            case 'writeFile':
                if (!fullPath) throw new Error("Path is required");
                const dir = path.dirname(fullPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(fullPath, args.content);

                // If it's an index.html or state.json, we might need to update registry
                let appId;
                if (fullPath.endsWith('state.json')) {
                    try {
                        const state = JSON.parse(args.content);
                        appId = updateAppsRegistry({
                            name: state.name,
                            description: state.description,
                            category: state.category,
                            icon: state.icon,
                            width: state.width,
                            height: state.height,
                            responsive: state.responsive,
                            path: path.dirname(fullPath)
                        });
                    } catch (e) { }
                }
                return { success: true, appId };
            case 'readFile':
                if (!fs.existsSync(fullPath)) throw new Error("File not found");
                return fs.readFileSync(fullPath, 'utf-8');
            case 'mkdir':
                if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
                return { success: true };
            case 'listFiles':
                if (!fs.existsSync(fullPath)) throw new Error("Directory not found");
                return fs.readdirSync(fullPath);
            default:
                throw new Error("Unknown tool: " + tool);
        }
    }

    const appMakerIcon = document.getElementById('app-maker-desktop');
    if (appMakerIcon) {
        appMakerIcon.addEventListener('dblclick', (e) => {
            console.log('App Maker icon double-clicked');
            e.stopPropagation();
            window.openAppMaker();
        });
    }

    const startAppMakerBtn = document.getElementById('start-app-maker');
    if (startAppMakerBtn) {
        startAppMakerBtn.addEventListener('click', (e) => {
            console.log('Start Menu: App Maker clicked');
            e.stopPropagation();
            window.openAppMaker();
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        });
    }

    const startGeminiBtn = document.getElementById('start-gemini-live');
    if (startGeminiBtn) {
        startGeminiBtn.addEventListener('click', (e) => {
            console.log('Start Menu: Gemini Live clicked');
            e.stopPropagation();
            if (typeof isGeminiLiveActive !== 'undefined') {
                if (isGeminiLiveActive) stopGeminiLive(); else startGeminiLive();
            }
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        });
    }

    const openSettingsMainBtn = document.getElementById('open-settings-main');
    if (openSettingsMainBtn) {
        openSettingsMainBtn.addEventListener('click', (e) => {
            console.log('Start Menu: Control Panel clicked');
            e.stopPropagation();
            openSettingsApp();
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        });
    }

    const startGesturesBtn = document.getElementById('start-gestures');
    if (startGesturesBtn) {
        startGesturesBtn.addEventListener('click', (e) => {
            console.log('Start Menu: Gestures clicked');
            e.stopPropagation();
            toggleGestures();
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        });
    }
    const startUninstallerBtn = document.getElementById('start-uninstaller');
    if (startUninstallerBtn) {
        startUninstallerBtn.addEventListener('click', (e) => {
            console.log('Start Menu: Uninstaller clicked');
            e.stopPropagation();
            openUninstaller();
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        });
    }

    refreshProgramsMenu();
    refreshDesktop();
    // --- UPDATED SETTINGS ---
    function openSettingsApp() {
        window.createWindow('Control Panel - Settings', `
            <div style="padding: 15px; width: 100%; height: 100%; display: flex; flex-direction: column;">
                <div class="settings-row">
                    <label for="api-key">Google Gemini API Key:</label>
                    <input type="password" id="api-key" value="${geminiApiKey}" placeholder="Enter API key...">
                </div>
                <div class="settings-row">
                    <label for="apps-path">Apps Root Directory:</label>
                    <div style="display:flex; gap:5px;">
                        <input type="text" id="apps-path" value="${appsRoot}" style="flex:1;" readonly>
                        <button class="win-button" id="browse-apps-path" style="width:auto; padding: 0 5px;">...</button>
                    </div>
                </div>
                <div style="flex: 1;"></div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button class="win-button" id="save-settings" style="width: 80px;">OK</button>
                    <button class="win-button" id="cancel-settings" style="width: 80px;">Cancel</button>
                </div>
            </div>
        `, { width: 400, height: 350 });

        document.getElementById('browse-apps-path').addEventListener('click', async () => {
            const newPath = await ipcRenderer.invoke('select-directory');
            if (newPath) {
                document.getElementById('apps-path').value = newPath;
            }
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            const newKey = document.getElementById('api-key').value.trim();
            const newAppsPath = document.getElementById('apps-path').value.trim();

            if (newKey) {
                geminiApiKey = newKey;
                localStorage.setItem('gemini_api_key', newKey);
            }
            if (newAppsPath) {
                appsRoot = newAppsPath;
                localStorage.setItem('apps_root_path', newAppsPath);
                if (!fs.existsSync(appsRoot)) {
                    try { fs.mkdirSync(appsRoot, { recursive: true }); } catch (e) { }
                }
            }

            updateGeminiTray();
            const win = document.querySelector('.window.focused');
            if (win) win.remove();
        });
        document.getElementById('cancel-settings').addEventListener('click', () => {
            const win = document.querySelector('.window.focused');
            if (win) win.remove();
        });
    }

    window.openStartupManager = function() {
        const apps = getAppsRegistry();
        let listHtml = apps.map(app => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #808080; background:${app.startup ? '#e0e0ff' : 'transparent'}">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fas ${app.icon || 'fa-window-maximize'}" style="width:20px; text-align:center;"></i>
                    <div>
                        <div style="font-weight:bold;">${app.name}</div>
                        <div style="font-size:10px; color:#555;">${app.category || 'Other'}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:11px;">${app.startup ? '<b style="color:green;">Enabled</b>' : '<span style="color:#808080;">Disabled</span>'}</span>
                    <button class="win-button" style="width:70px;" onclick="window.toggleStartupApp('${app.id}')">${app.startup ? 'Disable' : 'Enable'}</button>
                </div>
            </div>
        `).join('');

        if (apps.length === 0) listHtml = '<div style="padding:20px; text-align:center;">No apps installed to manage.</div>';

        window.createWindow('Startup Settings', `
            <div style="padding:15px; width:100%; height:100%; display:flex; flex-direction:column;">
                <p>Select which applications should automatically start when the OS opens.</p>
                <div style="flex:1; overflow-y:auto; background:white; border:2px inset #fff;" id="startup-list">
                    ${listHtml}
                </div>
                <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
                    <button class="win-button" onclick="this.closest('.window').remove()" style="width:80px;">Close</button>
                </div>
            </div>
        `, { width: 480, height: 450 });
    };

    window.toggleStartupApp = function(appId) {
        const apps = getAppsRegistry();
        const app = apps.find(a => a.id && a.id.toString() === appId.toString());
        if (app) {
            app.startup = !app.startup;
            const registryPath = path.join(appsRoot, 'apps.json');
            fs.writeFileSync(registryPath, JSON.stringify(apps, null, 2));
            
            // Refresh the startup window content
            const list = document.getElementById('startup-list');
            if (list) {
                // We could just re-render the listHtml logic here or just refresh the whole window
                const wins = document.querySelectorAll('.window');
                wins[wins.length - 1].remove(); 
                window.openStartupManager();
            }
        }
    };

    // --- HELP / ONBOARDING ---
    window.openHelpApp = function() {
        const showOnStartup = localStorage.getItem('show_help_on_startup') !== 'false';
        
        window.createWindow('Welcome to Sandbox OS', `
            <div class="help-container">
                <div class="help-header">
                    <i class="fas fa-compact-disc"></i>
                    <div>
                        <h2 style="margin:0; font-size:18px;">Welcome to the Future of Computing</h2>
                        <p style="margin:0; font-size:11px; color:#555;">Sandbox OS Onboarding v1.0</p>
                    </div>
                </div>
                <div class="help-steps">
                    <div class="help-step" style="animation-delay: 0.2s;">
                        <div class="help-step-icon"><i class="fas fa-brain"></i></div>
                        <div class="help-step-content">
                            <h3>A Living AI Ecosystem</h3>
                            <p>Sandbox OS isn't just an interface—it's a native AI environment that grows with you. Every application on your desktop was built by you (with help from the AI), tailored specifically to your needs.</p>
                        </div>
                    </div>
                    <div class="help-step" style="animation-delay: 0.4s;">
                        <div class="help-step-icon"><i class="fas fa-microphone"></i></div>
                        <div class="help-step-content">
                            <h3>AI Live Mode</h3>
                            <p>Engage in real-time, bidirectional voice conversations with the system's core intelligence. Simply press the microphone icon in the tray to start a natural dialogue.</p>
                        </div>
                    </div>
                    <div class="help-step" style="animation-delay: 0.6s;">
                        <div class="help-step-icon"><i class="fas fa-hand-sparkles"></i></div>
                        <div class="help-step-content">
                            <h3>Spatial Interaction</h3>
                            <p>Experience hands-free computing. Using your webcam, you can control the cursor and interact with windows using pinch gestures, bringing the Apple Vision Pro experience to your desktop.</p>
                        </div>
                    </div>
                    <div class="help-step" style="animation-delay: 0.8s;">
                        <div class="help-step-icon"><i class="fas fa-floppy-disk"></i></div>
                        <div class="help-step-content">
                            <h3>Classic Aesthetic, Modern Power</h3>
                            <p>We've combined the peak reliability of 90's design with modern agentic intelligence. Welcome back to the desktop.</p>
                        </div>
                    </div>
                </div>

                <div style="margin: 10px 0; padding: 10px; background: #ffffd0; border: 2px inset #fff; display: flex; gap: 10px; align-items: center; animation: slideIn 0.5s ease-out 1s both;">
                    <i class="fas fa-exclamation-triangle" style="color: #808000; font-size: 20px;"></i>
                    <div style="font-size: 11px; color: #000;">
                        <b>IMPORTANT:</b> To get the most out of Sandbox OS, you must provide a <b>Google AI Studio API Key</b> in the Control Panel. Without it, the App Maker and Assistant will remain offline.
                    </div>
                </div>
                <div class="help-footer">
                    <label>
                        <input type="checkbox" id="help-startup-check" ${showOnStartup ? 'checked' : ''}>
                        Show this screen on startup
                    </label>
                    <button class="win-button" style="width:80px;" onclick="this.closest('.window').remove()">Get Started</button>
                </div>
            </div>
        `, { width: 500, height: 520 });

        const check = document.getElementById('help-startup-check');
        if (check) {
            check.onchange = (e) => {
                localStorage.setItem('show_help_on_startup', e.target.checked);
            };
        }
    };

    const helpDesktopIcon = document.getElementById('help-desktop');
    if (helpDesktopIcon) {
        helpDesktopIcon.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            window.openHelpApp();
        });
    }

    const startHelpBtn = document.getElementById('start-help');
    if (startHelpBtn) {
        startHelpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.openHelpApp();
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        });
    }

    // --- STARTUP LOGIC ---
    function runStartupApps() {
        // First check onboarding
        const showHelp = localStorage.getItem('show_help_on_startup') !== 'false';
        if (showHelp) {
            window.openHelpApp();
        }

        const apps = getAppsRegistry();
        const startupApps = apps.filter(app => app.startup === true);
        if (startupApps.length > 0) {
            console.log(`OS: Starting ${startupApps.length} startup applications...`);
            startupApps.forEach((app, index) => {
                setTimeout(() => {
                    window.launchApp(app.id);
                }, 1000 * (index + 1)); // Staggered launch
            });
        }
    }

    // Run startup apps after a short delay to let the OS "boot"
    // setTimeout(runStartupApps, 2500); // Now triggered by login

    // --- ABOUT APP ---
    window.openAboutApp = function() {
        const mem = process.memoryUsage();
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        window.createWindow('About Sandbox OS', `
            <div style="padding:20px; display:flex; flex-direction:column; height:100%; align-items:center; text-align:center;">
                <img src="assets/icon.svg" style="width:64px; margin-bottom:20px;">
                <h1 style="margin:0; font-size:24px;">Sandbox OS</h1>
                <p style="margin:5px 0; color:#555;">Version 1.0.0 (Agentic Build)</p>
                
                <div style="width:100%; margin:20px 0; padding:10px; background:white; border:2px inset #fff; text-align:left; font-family:'Courier New', monospace; font-size:11px;">
                    <div style="margin-bottom:5px; font-weight:bold; color:#000080;">SYSTEM STATISTICS:</div>
                    <div>Kernel: Electron ${process.versions.electron}</div>
                    <div>Node: ${process.versions.node}</div>
                    <div>Memory Used: ${Math.round(mem.heapUsed / 1024 / 1024)} MB</div>
                    <div>System Uptime: ${hours}h ${minutes}m ${seconds}s</div>
                    <div>Registry: ${getAppsRegistry().length} apps installed</div>
                </div>

                <div style="flex:1;"></div>
                
                <div style="width:100%; border-top:2px groove #fff; padding-top:15px; margin-top:10px; font-style:italic; font-size:12px;">
                    Made with ❤️ by <b style="color:#000080;">Jonathan Uwumugisha</b>
                </div>
                
                <button class="win-button" style="width:80px; margin-top:20px;" onclick="this.closest('.window').remove()">OK</button>
            </div>
        `, { width: 400, height: 480 });
    };

    const startAboutBtn = document.getElementById('start-about');
    if (startAboutBtn) {
        startAboutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.openAboutApp();
            startMenu.classList.remove('show');
            startButton.classList.remove('active');
        });
    }

    const setBtn = document.getElementById('open-settings');
    if (setBtn) setBtn.onclick = (e) => {
        e.stopPropagation();
        openSettingsApp();
        startMenu.classList.remove('show');
        startButton.classList.remove('active');
    };
});

