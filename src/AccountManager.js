class AccountManager {
    constructor(game) {
        this.game = game;
        this.user = null; // Stores { username, data }
        const host = window.location.hostname || 'localhost';
        this.serverUrl = `http://${host}:3000`; // Dynamic server URL

        this.setupEventListeners();
        this.checkLocalSession();
    }

    setupEventListeners() {
        const btnLogin = document.getElementById('btn-login');
        const btnRegisterMenu = document.getElementById('btn-register-menu');
        const btnSubmitLogin = document.getElementById('btn-submit-login');
        const btnSubmitRegister = document.getElementById('btn-submit-register');
        const btnCloseLogin = document.getElementById('btn-close-login');

        if (btnLogin) {
            btnLogin.onclick = () => {
                if (this.user) {
                    this.logout();
                } else {
                    this.showLoginModal('login');
                }
            };
        }

        if (btnRegisterMenu) {
            btnRegisterMenu.onclick = () => {
                this.showLoginModal('register');
            };
        }

        if (btnSubmitLogin) {
            btnSubmitLogin.onclick = () => {
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value.trim();
                if (!username || !password) {
                    this.showError("Rellena todos los campos.");
                    return;
                }
                this.login(username, password);
            };
        }

        if (btnSubmitRegister) {
            btnSubmitRegister.onclick = () => {
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value.trim();
                if (!username || !password) {
                    this.showError("Rellena todos los campos.");
                    return;
                }
                if (password.length < 4) {
                    this.showError("Contraseña muy corta (min 4).");
                    return;
                }
                this.register(username, password);
            };
        }

        if (btnCloseLogin) {
            btnCloseLogin.onclick = () => {
                document.getElementById('modal-login').classList.add('hidden');
            };
        }
    }

    checkLocalSession() {
        const savedUser = localStorage.getItem('neon_survive_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                this.updateUI(true);
                this.applyData(this.user.data);
                // Silently refresh data from server
                this.silentSync();
            } catch (e) {
                this.logout();
            }
        }
    }

    async silentSync() {
        if (!this.user) return;
        try {
            // Re-login logic or just a 'session refresh' if the server supported it.
            // For now, we'll just trust local data and only push updates.
        } catch (e) {}
    }

    showLoginModal(mode = 'login') {
        const modal = document.getElementById('modal-login');
        if (!modal) return;
        
        const title = modal.querySelector('h3');
        const btnLogin = document.getElementById('btn-submit-login');
        const btnRegister = document.getElementById('btn-submit-register');

        modal.classList.remove('hidden');
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        this.showError('');

        if (mode === 'login') {
            title.innerText = "INICIAR SESIÓN";
            title.style.color = "#00ffaa";
            if (btnLogin) btnLogin.style.display = 'block';
            if (btnRegister) btnRegister.style.display = 'none';
        } else {
            title.innerText = "CREAR CUENTA NUEVA";
            title.style.color = "#ffaa00";
            if (btnLogin) btnLogin.style.display = 'none';
            if (btnRegister) btnRegister.style.display = 'block';
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.serverUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const userData = await response.json();
                this.user = userData; // { username, data }
                localStorage.setItem('neon_survive_user', JSON.stringify(this.user));
                
                const modal = document.getElementById('modal-login');
                if (modal) modal.classList.add('hidden');
                
                this.applyData(this.user.data);
                this.updateUI(true);
                this.game.addFloatingText(this.game.width / 2, this.game.height / 2, `¡HOLA ${username.toUpperCase()}!`, "#00ffaa");
            } else {
                const err = await response.json();
                this.showError(err.error || "Error al iniciar sesión.");
            }
        } catch (e) {
            this.showError("Error de conexión con el servidor.");
        }
    }

    async register(username, password) {
        try {
            const response = await fetch(`${this.serverUrl}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                this.game.addFloatingText(this.game.width / 2, this.game.height / 2, "¡REGISTRADO!", "#00ffaa");
                this.login(username, password);
            } else {
                const err = await response.json();
                this.showError(err.error || "Error al registrarse.");
            }
        } catch (e) {
            this.showError("Error de conexión con el servidor.");
        }
    }

    logout() {
        this.user = null;
        localStorage.removeItem('neon_survive_user');
        this.updateUI(false);
    }

    async saveProgress(manual = false) {
        if (!this.user) return;

        // Collect current game state
        const competitiveHighScore = localStorage.getItem('neon_survive_competitive_highscore') || 0;
        
        const data = {
            coins: this.game.scoreManager.coins,
            highScore: this.game.scoreManager.highScore,
            competitiveHighScore: parseInt(competitiveHighScore),
            skins: this.game.skinManager.purchasedSkins,
            currentSkin: this.game.skinManager.currentSkinId,
            speedLevel: this.game.upgradeManager.currentLevel,
            dashLevel: this.game.upgradeManager.dashCooldownLevel,
            secondDashUnlocked: this.game.upgradeManager.secondDashSlotUnlocked,
            toolsUnlocked: this.game.upgradeManager.toolsUnlocked,
            ownedTools: this.game.upgradeManager.ownedTools,
            ownedAbilities: this.game.upgradeManager.ownedAbilities,
            equippedAbilities: this.game.upgradeManager.equippedAbilities,
            equippedTool: this.game.upgradeManager.equippedTool,
            boss9Defeated: localStorage.getItem('boss_9_defeated') === 'true',
            boss10Defeated: localStorage.getItem('boss_10_defeated') === 'true',
            gameCompleted: localStorage.getItem('game_completed') === 'true',
            skullRevealed: localStorage.getItem('skull_revealed') === 'true'
        };

        // Cache locally first
        this.user.data = data;
        localStorage.setItem('neon_survive_user', JSON.stringify(this.user));

        try {
            const response = await fetch(`${this.serverUrl}/api/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: this.user.username, data })
            });

            if (response.ok && manual) {
                this.game.addFloatingText(this.game.width / 2, this.game.height - 50, "¡PROGRESO GUARDADO!", "#00ff00");
            }
        } catch (e) {
            if (manual) this.game.addFloatingText(this.game.width / 2, this.game.height - 50, "ERROR AL GUARDAR (OFFLINE)", "#ff0000");
        }
    }

    async fetchLeaderboard() {
        const tbody = document.querySelector('#menu-competitive table tbody');
        if (!tbody) return;

        // Show loading state
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">CARGANDO...</td></tr>';

        try {
            const response = await fetch(`${this.serverUrl}/api/leaderboard`);
            if (response.ok) {
                const data = await response.json();
                this.renderLeaderboard(data);
            } else {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#ff4d4d;">ERROR AL CARGAR</td></tr>';
            }
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#ff4d4d;">SERVIDOR NO DISPONIBLE</td></tr>';
        }
    }

    renderLeaderboard(scores) {
        const tbody = document.querySelector('#menu-competitive table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (scores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">SIN PUNTUACIONES AÚN</td></tr>';
            return;
        }

        scores.forEach((entry, index) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255, 0, 255, 0.2)';
            if (this.user && entry.username === this.user.username) {
                tr.style.background = 'rgba(255, 0, 255, 0.1)';
            }

            tr.innerHTML = `
                <td style="padding: 10px;">${index + 1}</td>
                <td style="padding: 10px; color: #00ffaa;">${entry.username.toUpperCase()}</td>
                <td style="padding: 10px; text-align: right; color: #ff00ff; font-weight: bold;">${entry.score.toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    applyData(data) {
        if (!data || Object.keys(data).length === 0) return;

        if (data.coins !== undefined) {
            this.game.scoreManager.coins = data.coins;
            localStorage.setItem('neon_survive_coins', data.coins);
        }
        if (data.highScore !== undefined) {
            this.game.scoreManager.highScore = data.highScore;
            localStorage.setItem('neon_survive_highscore', data.highScore);
        }
        if (data.competitiveHighScore !== undefined) {
            localStorage.setItem('neon_survive_competitive_highscore', data.competitiveHighScore);
        }
        if (data.skins) {
            this.game.skinManager.purchasedSkins = data.skins;
            localStorage.setItem('neon_survive_purchased_skins_v2', JSON.stringify(data.skins));
        }
        if (data.currentSkin) {
            this.game.skinManager.currentSkinId = data.currentSkin;
            localStorage.setItem('neon_survive_skin_v2', data.currentSkin);
        }
        
        if (data.speedLevel !== undefined) this.game.upgradeManager.currentLevel = data.speedLevel;
        if (data.dashLevel !== undefined) this.game.upgradeManager.dashCooldownLevel = data.dashLevel;
        if (data.secondDashUnlocked !== undefined) this.game.upgradeManager.secondDashSlotUnlocked = data.secondDashUnlocked;
        if (data.toolsUnlocked !== undefined) this.game.upgradeManager.toolsUnlocked = data.toolsUnlocked;
        if (data.ownedTools) this.game.upgradeManager.ownedTools = data.ownedTools;
        if (data.ownedAbilities) this.game.upgradeManager.ownedAbilities = data.ownedAbilities;
        if (data.equippedAbilities) this.game.upgradeManager.equippedAbilities = data.equippedAbilities;
        if (data.equippedTool) this.game.upgradeManager.equippedTool = data.equippedTool;

        if (data.boss9Defeated) localStorage.setItem('boss_9_defeated', 'true');
        if (data.boss10Defeated) localStorage.setItem('boss_10_defeated', 'true');
        if (data.gameCompleted) localStorage.setItem('game_completed', 'true');
        if (data.skullRevealed) localStorage.setItem('skull_revealed', 'true');

        this.game.updateUI();
        if (this.game.skinManager) this.game.skinManager.saveData();
    }

    updateUI(isLoggedIn) {
        const btnLogin = document.getElementById('btn-login');
        const btnRegisterMenu = document.getElementById('btn-register-menu');
        const userStatusParams = document.getElementById('menu-user-status');

        if (btnLogin && btnRegisterMenu) {
            if (isLoggedIn) {
                btnLogin.innerText = `CERRAR SESIÓN (${this.user.username.toUpperCase()})`;
                btnLogin.classList.remove('primary');
                btnLogin.classList.add('secondary');
                btnRegisterMenu.style.display = 'none';

                if (userStatusParams) {
                    userStatusParams.innerText = `👤 ${this.user.username.toUpperCase()}`;
                    userStatusParams.style.display = 'block';
                }

                let btnSave = document.getElementById('btn-cloud-save');
                if (!btnSave) {
                    btnSave = document.createElement('button');
                    btnSave.id = 'btn-cloud-save';
                    btnSave.className = 'btn primary';
                    btnSave.innerText = 'GUARDAR PROGRESO';
                    btnSave.style.marginTop = '10px';
                    btnSave.onclick = () => {
                        this.saveProgress(true);
                        if (this.game.selectSound) this.game.selectSound.play().catch(e => { });
                    };
                    btnLogin.parentNode.insertBefore(btnSave, btnLogin.nextSibling);
                }
            } else {
                btnLogin.innerText = "INICIAR SESIÓN";
                btnLogin.classList.add('primary');
                btnLogin.classList.remove('secondary');
                btnRegisterMenu.style.display = 'block';

                if (userStatusParams) {
                    userStatusParams.style.display = 'none';
                }

                const btnSave = document.getElementById('btn-cloud-save');
                if (btnSave) btnSave.remove();
            }
        }
    }

    showError(msg) {
        const errEl = document.getElementById('login-error');
        if (errEl) errEl.innerText = msg;
    }
}
