class Game {
    constructor(canvas) {
        window.game = this; // Exportación global inmediata
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Game States
        this.STATES = {
            MENU: 0,
            PLAYING: 1,
            PAUSED: 2,
            GAMEOVER: 3,
            SHOP: 4,
            SKINS: 4,
            SETTINGS: 5,
            UPGRADES: 6,
            VICTORY: 7,
            GRAPHICS: 8,
            COLUMN: 9,
            COLOSSEUM_MENU: 10,
            COLOSSEUM: 11,
            ROADMAP: 12,
            COMPETITIVE_MENU: 13,
            BOX_OPENING: 14
        };
        this.currentState = this.STATES.MENU;
        this.previousState = null;

        // AGGRESSIVE CLEANUP: Remove old invalid skins and reset page
        const savedSkin = localStorage.getItem('neon_survive_skin');
        if (savedSkin === 'jake' || savedSkin === 'gunter' || savedSkin === 'yellow') {
            localStorage.setItem('neon_survive_skin', 'cyan');
            console.log("Reset invalid skin to Cyan");
        }

        // Wipe page memory if exists (custom logic to reset pager)
        this.currentPage = 0;
        this.itemsPerPage = 8;

        // Managers and Entities
        this.input = new InputHandler(this);
        this.scoreManager = new ScoreManager(this); // Initialize ScoreManager FIRST
        this.skinManager = new SkinManager(this.scoreManager); // Pass ScoreManager to SkinManager
        
        // UPGRADES BEFORE PLAYER to ensure initial stats are correct
        this.difficultyManager = new DifficultyManager(this);
        this.upgradeManager = new UpgradeManager(this);
        this.localizationManager = new LocalizationManager();
        this.accountManager = new AccountManager(this);
        this.settings = new SettingsManager();
        this.particleManager = new ParticleManager(this);
        
        this.player = new Player(this);
        this.obstacleManager = new ObstacleManager(this);
        this.powerUpManager = new PowerUpManager(this);

        // BOSS STATE
        this.boss = null;
        this.bossesDefeated = 0;
        this.bossActive = false;
        this.bossDeathTime = 0; // Timestamp for post-boss transition

        this.lastGameMode = 'NORMAL';
        this.isCompetitiveMode = false;
        this.retrySecretBoss = false;
        this.grayscaleEffect = false;
        this.editPowerTimer = 0;
        this.flagUsed = false; // Initialize missing properties
        this.selectedShopSkin = null;

        this.timeScale = 1.0;
        this.gameTime = 0;
        this.slowMoTimer = 0;
        this.upgradesPage = 0; // Ensure upgradesPage is initialized

        // UI Elements
        this.screens = {
            menu: document.getElementById('menu-start'),
            pause: document.getElementById('menu-pause'),
            gameover: document.getElementById('menu-gameover'),
            shop: document.getElementById('menu-shop'),
            settings: document.getElementById('menu-settings'),
            upgrades: document.getElementById('menu-upgrades'),
            victory: document.getElementById('menu-victory'),
            colosseumMenu: document.getElementById('menu-colosseum'),
            competitiveMenu: document.getElementById('menu-competitive'),
            roadmap: document.getElementById('menu-roadmap') || { classList: { add: () => {}, remove: () => {} } },
            graphics: document.getElementById('menu-graphics') || { classList: { add: () => {}, remove: () => {} } }
        };
        this.hud = document.getElementById('hud');
        this.powerUpTimerUI = document.getElementById('powerup-timer'); // New UI
        this.slowValUI = document.getElementById('slow-val');

        // Audio
        this.bgMusic = new Audio('assets/Musicas/music.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = this.settings.get('musicVolume') / 100;

        this.powerUpSound = new Audio('assets/Sonidos/powerup.mp3');
        this.powerUpSound.volume = this.settings.get('sfxVolume') / 100;

        this.selectSound = new Audio('assets/Sonidos/select.mp3');
        this.selectSound.volume = this.settings.get('sfxVolume') / 100;

        this.deathSound = new Audio('assets/Sonidos/ded.mp3');
        this.deathSound.volume = this.settings.get('sfxVolume') / 100;

        this.dashSound = new Audio('assets/Sonidos/dash.mp3');
        this.dashSound.volume = this.settings.get('sfxVolume') / 100;

        // Floating Texts
        this.floatingTexts = [];

        // Screen Shake Props
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        // Darkness Layer (Offscreen Canvas)
        this.darknessCanvas = document.createElement('canvas');
        this.darknessCanvas.width = this.width;
        this.darknessCanvas.height = this.height;
        this.dCtx = this.darknessCanvas.getContext('2d');

        // Cheat Codes & Debug
        document.addEventListener('keydown', (e) => {
            if (e.key === '8' || e.key === '9') {
                this.scoreManager.score += 100;
                this.scoreManager.updateHUD();
                if (this.player && !this.player.isDead) {
                    this.addFloatingText(this.player.x, this.player.y, "+100 (CHEAT)", "#ffff00");
                }
            }
            if (e.key.toLowerCase() === 'z') {
                if (this.boss && this.bossActive) {
                    this.boss.takeDamage(true);
                    this.addFloatingText(this.boss.x + this.boss.width / 2, this.boss.y, "CHEAT HIT!", "#ff0000");
                }
            }
            if (e.key === '0') {
                this.toggleDebugMenu();
            }
        });

        this.setupUIInteraction();

        // Initialize Box Manager
        this.boxManager = new BoxManager(this);
        this.lastBoxScore = 0;

        // Force Mobile at startup
        this.setDevice('mobile');
        this.currentState = this.STATES.MENU;
        this.updateUI();

        // Start Loop
        this.lastTime = 0;
        this.nextSpawnTime = Date.now() + 2000;
        this.spawnRate = 2000;
        this.currentPage = 0;
        this.itemsPerPage = 6;

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    bind(id, event, callback) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(event, callback);
        }
    }


    setupUIInteraction() {
        // Force HUD positioning just in case CSS fails or is overridden
        if (this.hud) {
            this.hud.style.position = 'absolute';
            this.hud.style.top = '20px';
            this.hud.style.right = '20px';
            this.hud.style.zIndex = '100';
            this.hud.style.pointerEvents = 'none';
        }

        // Mobile Pause Button (PointerDown es el más universal y suficiente)
        this.bind('btn-mobile-pause', 'pointerdown', (e) => { 
            e.preventDefault(); 
            e.stopPropagation();
            this.input.togglePause(); 
        });
        
        // --- RESTAURANDO BINDINGS ELIMINADOS POR ERROR ---
        this.bind('btn-start', 'click', () => this.handleStartClick());
        this.bind('btn-upgrades', 'click', () => this.showScreen('menu-upgrades'));
        this.bind('btn-skins', 'click', () => this.openShop());
        this.bind('btn-settings', 'click', () => this.showScreen('menu-settings'));

        this.bind('btn-back-settings', 'click', () => this.toMenu());
        this.bind('btn-back-shop', 'click', () => this.toMenu());
        this.bind('btn-back-upgrades', 'click', () => this.toMenu());
        // ------------------------------------------------

        // Competitive Buttons
        this.bind('btn-competitive', 'click', (e) => {
            const isUnlocked = localStorage.getItem('game_completed') === 'true' || localStorage.getItem('boss_10_defeated') === 'true';
            const btn = document.getElementById('btn-competitive');
            
            // Strictly prevent entry if locked or requirements not met
            if (!isUnlocked || (btn && btn.classList.contains('locked'))) {
                const msg = document.getElementById('competitive-lock-message');
                if (msg) {
                    msg.classList.remove('hidden');
                    if (this._compLockTimeout) clearTimeout(this._compLockTimeout);
                    this._compLockTimeout = setTimeout(() => {
                        msg.classList.add('hidden');
                    }, 3000);
                }
                return; // STOP HERE
            }
            
            this.showScreen('menu-competitive');
        });
        this.bind('btn-play-competitive', 'click', () => this.startCompetitive());
        this.bind('btn-back-competitive', 'click', () => this.toMenu());

        // Shop Tabs
        this.currentShopTab = 'skins';
        this.bind('tab-shop-skins', 'click', () => {
            this.currentShopTab = 'skins';
            this.updateShopTabs();
            this.renderShop();
        });
        this.bind('tab-shop-particles', 'click', () => {
            this.currentShopTab = 'particles';
            this.updateShopTabs();
            this.renderShop();
        });

        // Upgrade Buttons (Basic)
        this.bind('btn-buy-speed', 'click', () => {
            if (this.upgradeManager.buySpeedUpgrade()) {
                this.renderUpgradesMenu();
                this.selectSound.currentTime = 0;
                this.selectSound.play().catch(e => { });
            }
        });
        this.bind('btn-buy-dash', 'click', () => {
            if (this.upgradeManager.buyDashUpgrade()) {
                this.renderUpgradesMenu();
                this.selectSound.currentTime = 0;
                this.selectSound.play().catch(e => { });
            }
        });

        // Upgrade Page Navigation
        this.bind('btn-prev-upgrade-page', 'click', () => this.changeUpgradePage(-1));
        this.bind('btn-next-upgrade-page', 'click', () => this.changeUpgradePage(1));

        // Ability Slots
        this.bind('slot-speed', 'click', () => this.openAbilityModal('speed'));
        this.bind('slot-dash', 'click', () => this.openAbilityModal('dash'));
        this.bind('slot-dash2', 'click', () => {
            if (this.upgradeManager.secondDashSlotUnlocked) {
                this.openAbilityModal('dash2');
            } else {
                if (this.upgradeManager.unlockSecondDashSlot()) {
                    this.renderUpgradesMenu();
                    this.selectSound.currentTime = 0;
                    this.selectSound.play().catch(e => { });
                }
            }
        });

        // Modal Close
        this.bind('btn-close-modal', 'click', () => {
            const modal = document.getElementById('ability-modal');
            if (modal) modal.classList.add('hidden');
        });

        this.bind('ability-modal', 'click', (e) => {
            if (e.target.id === 'ability-modal') {
                e.target.classList.add('hidden');
            }
        });

        // Language Toggle
        this.bind('btn-language', 'click', () => {
            const newLang = this.localizationManager.toggleLanguage();
            this.selectSound.currentTime = 0;
            this.selectSound.play().catch(e => { });
        });

        // Volume Sliders
        const slider = document.getElementById('volume-slider');
        if (slider) {
            slider.value = this.settings.get('musicVolume');
            this.bind('volume-slider', 'input', (e) => {
                const val = e.target.value;
                this.bgMusic.volume = val / 100;
                this.settings.set('musicVolume', parseInt(val));
                const volVal = document.getElementById('volume-val');
                if (volVal) volVal.innerText = val + '%';
            });
        }

        const sfxSlider = document.getElementById('sfx-slider');
        if (sfxSlider) {
            sfxSlider.value = this.settings.get('sfxVolume');
            this.bind('sfx-slider', 'input', (e) => {
                const val = e.target.value;
                this.sfxVolume = val / 100;
                this.settings.set('sfxVolume', parseInt(val));
                const sfxVal = document.getElementById('sfx-val');
                if (sfxVal) sfxVal.innerText = val + '%';

                this.powerUpSound.volume = this.sfxVolume;
                this.selectSound.volume = this.sfxVolume;
                this.deathSound.volume = this.sfxVolume;
                this.dashSound.volume = this.sfxVolume;
            });
        }

        // Other Menu Buttons
        // this.bind('btn-colosseum', 'click', () => this.showScreen('menu-colosseum'));
        this.bind('btn-colosseum', 'click', () => {
            this.addFloatingText(this.width / 2, this.height / 2, "PRÓXIMAMENTE", "#00f3ff");
        });
        this.bind('btn-play-colosseum', 'click', () => this.startColosseum());
        this.bind('btn-back-colosseum', 'click', () => this.toMenu());
        this.bind('btn-resume', 'click', () => this.resume());
        this.bind('btn-quit-pause', 'click', () => this.toMenu());
        this.bind('btn-restart', 'click', () => {
            if (this.retrySecretBoss) {
                this.bossesDefeated = 9;
                this.start();
                this.bossesDefeated = 9;
                this.startBossFight();
            } else if (this.lastGameMode === 'COLOSSEUM') {
                this.startColosseum();
            } else if (this.lastGameMode === 'COMPETITIVE') {
                this.startCompetitive();
            } else {
                this.start();
            }
            if (this.bgMusic.paused) this.bgMusic.play().catch(e => { });
        });
        this.bind('btn-quit-gameover', 'click', () => this.toMenu());
        this.bind('btn-revive', 'click', () => {
            if (this.upgradeManager.hasToolFlag && !this.flagUsed) {
                this.activateRevive();
            }
        });
        this.bind('btn-menu-victory', 'click', () => this.toMenu());

        // Settings Tabs and Cycles
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.settings-page').forEach(page => {
                    page.classList.add('hidden');
                    page.classList.remove('active');
                });
                const targetId = `settings-${tab.dataset.tab}`;
                const targetPage = document.getElementById(targetId);
                if (targetPage) {
                    targetPage.classList.remove('hidden');
                    targetPage.classList.add('active');
                }
                this.selectSound.currentTime = 0;
                this.selectSound.play().catch(e => { });
            });
        });

        this.bind('btn-cycle-quality', 'click', () => this.toggleSetting('quality', ['LOW', 'MEDIUM', 'HIGH']));
        this.bind('btn-cycle-fps', 'click', () => this.toggleSetting('fpsLimit', ['30', '60', '120', 'UNLIMITED']));
        this.bind('btn-cycle-neon', 'click', () => this.toggleBoolSetting('neon'));
        this.bind('btn-cycle-particles', 'click', () => this.toggleBoolSetting('particles'));

        // Reset Data
        const resetModal = document.getElementById('modal-reset-confirmation');
        this.bind('btn-reset-data', 'click', () => { if (resetModal) resetModal.classList.remove('hidden'); });
        this.bind('btn-close-reset', 'click', () => { if (resetModal) resetModal.classList.add('hidden'); });
        this.bind('btn-cancel-reset', 'click', () => { if (resetModal) resetModal.classList.add('hidden'); });
        this.bind('btn-confirm-reset', 'click', () => this.resetData());

        // Global sound interaction
        const startMusic = () => { if (this.bgMusic.paused) this.bgMusic.play().catch(e => { }); };
        document.body.addEventListener('click', startMusic, { once: true });
        document.body.addEventListener('touchstart', startMusic, { once: true });

        // Generic sound for ALL buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.selectSound.currentTime = 0;
                this.selectSound.play().catch(e => { });
            });
        });
    }

    setDevice(device) {
        const container = document.getElementById('game-container');
        if (container) {
            container.classList.add('mobile-mode');
        }

        this.input.setControlMode('mobile');
        
        // Dynamic Full-Screen Scaling
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        
        if (this.obstacleManager) this.obstacleManager.resetSpawners();
        if (this.player) this.player.reset();
    }

    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Stretch canvas to fill exact viewport
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.objectFit = 'fill';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1';

        // Update darkness layer
        if (this.darknessCanvas) {
            this.darknessCanvas.width = this.width;
            this.darknessCanvas.height = this.height;
        }

        console.log(`Resized Game to: ${this.width}x${this.height}`);
    }

    showScreen(screenId) {
        // Map screenId to State
        if (screenId === 'menu-start') this.currentState = this.STATES.MENU;
        else if (screenId === 'menu-upgrades') this.currentState = this.STATES.UPGRADES;
        else if (screenId === 'menu-shop') this.currentState = this.STATES.SHOP;
        else if (screenId === 'menu-settings') this.currentState = this.STATES.SETTINGS;
        else if (screenId === 'menu-pause') this.currentState = this.STATES.PAUSED;
        else if (screenId === 'menu-gameover') this.currentState = this.STATES.GAMEOVER;
        else if (screenId === 'menu-victory') this.currentState = this.STATES.VICTORY;
        else if (screenId === 'menu-graphics') this.currentState = this.STATES.GRAPHICS;
        else if (screenId === 'menu-colosseum') this.currentState = this.STATES.COLOSSEUM_MENU;
        else if (screenId === 'menu-competitive') {
            this.currentState = this.STATES.COMPETITIVE_MENU;
            if (this.accountManager) this.accountManager.fetchLeaderboard();
        }

        this.updateUI();
    }

    start() {
        const dashBar = document.getElementById('dash-bar');
        if (dashBar) dashBar.classList.remove('colosseum');
        this.currentState = this.STATES.PLAYING;
        this.lastGameMode = 'NORMAL';
        this.resetGame();
        this.updateUI();
    }

    handleStartClick() {
        this.start();
        this.bgMusic.play().catch(e => { });
    }

    pause() {
        if (this.currentState === this.STATES.PLAYING || this.currentState === this.STATES.COLOSSEUM) {
            this.previousState = this.currentState;
            this.currentState = this.STATES.PAUSED;
            this.updateUI();
        }
    }

    resume() {
        if (this.currentState === this.STATES.PAUSED) {
            this.currentState = this.previousState || this.STATES.PLAYING;
            this.lastTime = performance.now(); // Reset time to avoid jump
            this.updateUI();
        }
    }


    toMenu() {
        // If coming from Victory, force reload to ensure clean state
        if (this.currentState === this.STATES.VICTORY) {
            location.reload();
            return;
        }
        this.currentState = this.STATES.MENU;
        const dashBar = document.getElementById('dash-bar');
        if (dashBar) dashBar.classList.remove('colosseum');
        this.isCompetitiveMode = false;
        this.updateUI();
    }

    triggerSlowMo(duration) {
        this.slowMoTimer = duration;
        this.timeScale = 0.5;
        this.powerUpTimerUI.classList.remove('hidden');
    }

    gameOver() {
        this.currentState = this.STATES.GAMEOVER;
        // Check for Secret Boss Retry
        if (this.boss && (this.boss.constructor.name === 'SecretBoss' || this.bossesDefeated === 9)) {
            this.retrySecretBoss = true;
        }
        this.scoreManager.saveHighScore();

        // Update Game Over UI with scores
        const finalScore = Math.floor(this.scoreManager.score);
        document.getElementById('final-score').innerText = finalScore;
        document.getElementById('best-score').innerText = Math.floor(this.scoreManager.highScore);

        // Debug: Show actual earned coins
        const earnedCoins = finalScore; // 1 to 1 ratio
        const finalCoinsEl = document.getElementById('final-coins');
        if (finalCoinsEl) finalCoinsEl.innerText = earnedCoins;

        const btnRevive = document.getElementById('btn-revive');
        if (this.upgradeManager.hasToolFlag && !this.flagUsed) {
            btnRevive.classList.remove('hidden');
        } else {
            btnRevive.classList.add('hidden');
        }

        // Award Coins (1 point = 1 coin) - DISABLED FOR COMPETITIVE
        if (!this.isCompetitiveMode) {
            this.scoreManager.addCoins(finalScore);
        }

        // Award Competitive Boxes
        if (this.isCompetitiveMode) {
            const earnedBoxes = Math.floor(this.scoreManager.score / 2000);
            if (earnedBoxes > 0) {
                // Trigger Box Sequence
                this.currentState = this.STATES.BOX_OPENING;
                if (this.boxManager) this.boxManager.enqueueBoxes(earnedBoxes);
            }
            
            // Update Competitive High Score
            const currentCompBest = parseInt(localStorage.getItem('neon_survive_competitive_highscore')) || 0;
            if (finalScore > currentCompBest) {
                localStorage.setItem('neon_survive_competitive_highscore', finalScore);
            }
            if (this.accountManager) this.accountManager.saveProgress();
        }

        this.updateUI();
    }

    startColosseum() {
        if (this.currentState === this.STATES.PLAYING || this.currentState === this.STATES.COLOSSEUM) return;

        const dashBar = document.getElementById('dash-bar');
        if (dashBar) dashBar.classList.add('colosseum');

        this.screens.menu.classList.remove('active');
        this.resetGame();

        this.currentState = this.STATES.COLOSSEUM;
        this.lastGameMode = 'COLOSSEUM';

        // Initial Boss Spawn
        this.bossesDefeated = 0; // 0 already defeated
        this.scoreManager.score = 0;
        this.spawnRandomBoss();

        // Music
        if (this.bgMusic.paused) this.bgMusic.play().catch(e => { });
        this.updateUI();
    }

    spawnRandomBoss() {
        this.bossActive = true;
        this.bossIntroActive = true;
        this.bossIntroTimer = 3000;

        this.obstacleManager.reset();
        this.powerUpManager.reset();

        // Increase difficulty based on defeated count + 1 for current boss
        const difficulty = this.bossesDefeated + 1;

        // Colosseum: Mix specific bosses with random ones
        // Bosses 6-10 (indices 5-9) can appear if difficulty is high enough
        if (difficulty > 4 && Math.random() < 0.4) {
            const pool = [];
            if (difficulty >= 5) pool.push(BlueHeptagonBoss);
            if (difficulty >= 6) pool.push(PurpleOctagonBoss);
            if (difficulty >= 7) pool.push(EnneagonBoss);
            if (difficulty >= 8) pool.push(DecagonBoss);
            if (difficulty >= 10) pool.push(SecretBoss); // Secret boss only at very high diff

            const BossClass = pool[Math.floor(Math.random() * pool.length)];
            this.boss = new BossClass(this);
        } else {
            this.boss = new RandomBoss(this, difficulty);
        }

        this.boss.x = this.width / 2 - this.boss.width / 2;
        this.boss.y = -150;

        this.triggerShake(500, 5);
    }

    resetGame() {
        this.retrySecretBoss = false; // Clear retry flag
        this.flagUsed = false; // Reset Flag
        this.scoreManager.reset();
        this.difficultyManager.reset();
        this.player.reset();
        // Tool: Start with Heart
        if (this.upgradeManager.hasToolHeart) {
            this.player.addHeart();
        }

        this.obstacleManager.reset();
        this.powerUpManager.reset();
        this.floatingTexts = [];
        this.boss = null;
        this.bossActive = false;
        this.bossIntroActive = false;
        this.bossesDefeated = 0;
        this.timeScale = 1.0;
        this.gameTime = 0;
        this.isDarknessLevel = false;
        this.editPowerTimer = 0;

        this.collectedKeys = JSON.parse(localStorage.getItem('neon_survive_keys')) || [];
        this.currentKey = null; // Currently spawned key in KEY_SEQUENCE state
        this.lastGameMode = 'NORMAL';
        this.isCompetitiveMode = false;
        this.isTimeStopped = false;
        this.grayscaleEffect = false;
        this.highContrastEffect = false;
    }

    startCompetitive() {
        this.isCompetitiveMode = true;
        this.lastGameMode = 'COMPETITIVE';
        this.resetGame();
        this.isCompetitiveMode = true; // resetGame clears it, so set again
        this.lastBoxScore = 0; // Reset box tracking
        this.currentState = this.STATES.PLAYING;
        this.updateUI();
        if (this.bgMusic.paused) this.bgMusic.play().catch(e => { });
    }

    startEditPower() {
        this.isTimeStopped = true;
        this.editPowerTimer = 1670; // 1.67 seconds
        this.triggerShake(300, 5);
        // Optional: Play a sound?
        if (this.powerUpSound) {
            this.powerUpSound.currentTime = 0;
            this.powerUpSound.play().catch(e => { });
        }
    }

    toggleDebugMenu() {
        const menu = document.getElementById('debug-menu');
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            menu.classList.add('active');
        } else {
            menu.classList.add('hidden');
            menu.classList.remove('active');
        }
    }

    /*
    toggleDebugEnemyMenu() {
       // Kept commented out for now as requested or just restore if needed? 
       // User asked specifically for "menu debug de los jefes" (Boss Debug Menu).
       // The HTML shows game.spawnDebugEnemy calls which implies debug-enemy-menu might be useful too.
       // But let's stick to the boss one first which is toggleDebugMenu.
    }
    */


    startDebugBoss(bossIndex) {
        // Close menu
        const menu = document.getElementById('debug-menu');
        menu.classList.add('hidden');
        menu.classList.remove('active');

        // Reset Game State for clean slate
        this.flagUsed = false; // Reset 1-up flag
        this.resetGame();

        // Set Stats for specific boss
        // Boss 1 (Index 0) -> 1000 pts
        // Boss 2 (Index 1) -> 2000 pts
        this.bossesDefeated = bossIndex;
        // Check threshold logic: if score >= (bossesDefeated + 1) * 1000, boss spawns.
        // We set defeated = index. So next threshold is (index + 1) * 1000.
        // Boss 1: 1000 (Defeated 0)
        // Boss 2: 2000 (Defeated 1) is existing yellow? User didn't specify points for boss 2 recently but usually +1000.
        // Boss 3: 6000 (Defeated 2?) Wait, 6000 points is huge jump.
        // Let's ensure startBossFight logic handles indices correctly.

        let score = (bossIndex + 1) * 500;
        // if (bossIndex === 5) score = 6000; // Blue Heptagon
        // if (bossIndex === 6) score = 7000; // Boss 7 (Purple Octagon)
        // if (bossIndex === 7) score = 8000; // Boss 8 (Revival Enneagon)
        // if (bossIndex === 8) score = 9000; // Boss 9 (Darkness Decagon)
        // if (bossIndex === 9) score = 10000; // Boss 10 (Secret)

        this.scoreManager.score = score;

        this.currentState = this.STATES.PLAYING;
        this.updateUI(); // Ensure UI syncs with PLAYING state (hides pause menu)

        // We let the loop handle the spawn to ensure proper conditions
        // Or we can manually call it if we want to be instantaneous
        this.startBossFight();
    }

    // toggleDebugEnemyMenu removed at user request

    spawnDebugEnemy(type) {
        // Close menu
        this.toggleDebugEnemyMenu();

        // Spawn Enemy
        let enemy;
        switch (type) {
            case 'Obstacle':
                enemy = new Obstacle(this);
                break;
            case 'HeavyObstacle':
                enemy = new HeavyObstacle(this);
                break;
            case 'ChargerObstacle':
                enemy = new ChargerObstacle(this);
                break;
            case 'TrajectoryObstacle':
                enemy = new TrajectoryObstacle(this);
                break;
            case 'ExplodingEnemy':
                enemy = new ExplodingEnemy(this);
                break;
            case 'DiamondEnemy':
                enemy = new DiamondEnemy(this);
                break;
        }

        if (enemy) {
            this.obstacleManager.obstacles.push(enemy);
        }
    }

    openShop() {
        this.currentState = this.STATES.SHOP;
        this.currentShopTab = 'skins';
        this.selectedShopSkin = this.skinManager.getCurrentSkin().id; // Auto-select current
        this.updateShopTabs();
        this.renderShop();
        this.updateUI();
    }

    updateShopTabs() {
        const skinsTab = document.getElementById('tab-shop-skins');
        const particlesTab = document.getElementById('tab-shop-particles');
        if (this.currentShopTab === 'skins') {
            skinsTab.classList.add('active');
            particlesTab.classList.remove('active');
        } else {
            skinsTab.classList.remove('active');
            particlesTab.classList.add('active');
        }
    }

    renderShop() {
        if (this.currentShopTab === 'skins') {
            this.renderSkinsShop();
        } else {
            this.renderParticlesShop();
        }
    }

    renderSkinsShop() {
        const list = document.getElementById('shop-list');
        const coinVal = document.getElementById('shop-coin-val');
        if (!list) return;

        list.innerHTML = '';
        if (coinVal) coinVal.innerText = this.scoreManager.coins;

        const skins = this.skinManager.getSkins();
        skins.forEach(skin => {
            const item = document.createElement('div');
            item.className = `shop-item ${this.selectedShopSkin === skin.id ? 'selected' : ''} ${this.skinManager.getCurrentSkin().id === skin.id ? 'equipped' : ''}`;

            const content = document.createElement('div');
            content.className = 'shop-item-content';

            const preview = document.createElement('div');
            preview.className = 'shop-item-color';
            preview.style.backgroundColor = skin.color;
            preview.style.boxShadow = `0 0 10px ${skin.color}`;

            const name = document.createElement('div');
            name.className = 'shop-item-name';
            name.innerText = skin.name;

            const rarity = document.createElement('div');
            rarity.className = 'daily-shop-slot-rarity';
            rarity.setAttribute('data-rarity', skin.rarity);
            rarity.innerText = skin.rarity;
            rarity.style.marginLeft = 'auto';

            content.appendChild(preview);
            content.appendChild(name);
            content.appendChild(rarity);

            // Price or status
            const price = document.createElement('div');
            price.style.marginLeft = '15px';
            price.style.fontWeight = 'bold';

            if (this.skinManager.getCurrentSkin().id === skin.id) {
                price.innerText = 'EQUIPADO';
                price.style.color = '#39ff14';
            } else if (this.skinManager.isOwned(skin.id)) {
                price.innerText = 'PROPIEDAD';
                price.style.color = '#00f3ff';
            } else {
                price.innerText = `${skin.price} 💎`;
                price.style.color = this.scoreManager.coins >= skin.price ? '#ffd700' : '#ff4d4d';
            }
            content.appendChild(price);

            item.appendChild(content);

            item.onclick = () => {
                if (this.skinManager.isOwned(skin.id)) {
                    this.skinManager.selectSkin(skin.id);
                    this.player.updateColor();
                } else {
                    if (this.skinManager.buySkin(skin.id)) {
                        this.powerUpSound.currentTime = 0;
                        this.powerUpSound.play().catch(e => { });
                    }
                }
                this.selectedShopSkin = skin.id;
                this.renderSkinsShop();
            };

            list.appendChild(item);
        });
    }

    renderParticlesShop() {
        const list = document.getElementById('shop-list');
        const coinVal = document.getElementById('shop-coin-val');
        if (!list) return;

        list.innerHTML = '';
        if (coinVal) coinVal.innerText = this.scoreManager.coins;

        // SECCIÓN: FORMAS
        const shapeTitle = document.createElement('h3');
        shapeTitle.innerText = 'FORMAS DE PARTÍCULA';
        shapeTitle.style.color = '#00f3ff';
        shapeTitle.style.marginTop = '10px';
        list.appendChild(shapeTitle);

        const shapes = this.particleManager.getShapes();
        shapes.forEach(shape => {
            const item = this.createParticleShopItem(shape, 'shape');
            list.appendChild(item);
        });

        // SECCIÓN: CANTIDAD
        const qtyTitle = document.createElement('h3');
        qtyTitle.innerText = 'CANTIDAD DE PARTÍCULAS';
        qtyTitle.style.color = '#00f3ff';
        qtyTitle.style.marginTop = '20px';
        list.appendChild(qtyTitle);

        const quantities = this.particleManager.getQuantities();
        quantities.forEach(qty => {
            const item = this.createParticleShopItem(qty, 'quantity');
            list.appendChild(item);
        });
    }

    createParticleShopItem(data, type) {
        const isOwned = type === 'shape' ? this.particleManager.isShapeOwned(data.id) : this.particleManager.isQuantityOwned(data.id);
        const isSelected = type === 'shape' ? this.particleManager.currentShapeId === data.id : this.particleManager.currentQuantityId === data.id;

        const item = document.createElement('div');
        item.className = `shop-item ${isSelected ? 'equipped' : ''}`;

        const content = document.createElement('div');
        content.className = 'shop-item-content';

        const name = document.createElement('div');
        name.className = 'shop-item-name';
        name.innerText = data.name;

        const rarity = document.createElement('div');
        rarity.className = 'daily-shop-slot-rarity';
        rarity.setAttribute('data-rarity', data.rarity);
        rarity.innerText = data.rarity;
        rarity.style.marginLeft = 'auto';

        content.appendChild(name);
        content.appendChild(rarity);

        const price = document.createElement('div');
        price.style.marginLeft = '15px';
        price.style.fontWeight = 'bold';

        if (isSelected) {
            price.innerText = 'EQUIPADO';
            price.style.color = '#39ff14';
        } else if (isOwned) {
            price.innerText = 'USAR';
            price.style.color = '#00f3ff';
        } else {
            price.innerText = `${data.price} 💎`;
            price.style.color = this.scoreManager.coins >= data.price ? '#ffd700' : '#ff4d4d';
        }
        content.appendChild(price);

        item.appendChild(content);

        item.onclick = () => {
            if (isOwned) {
                if (type === 'shape') this.particleManager.selectShape(data.id);
                else this.particleManager.selectQuantity(data.id);
            } else {
                let success = false;
                if (type === 'shape') success = this.particleManager.buyShape(data.id);
                else success = this.particleManager.buyQuantity(data.id);

                if (success) {
                    this.powerUpSound.currentTime = 0;
                    this.powerUpSound.play().catch(e => { });
                }
            }
            this.renderParticlesShop();
        };

        return item;
    }

    openUpgrades() {
        this.currentState = this.STATES.UPGRADES;
        this.upgradesPage = 0; // Reset to first page
        this.renderUpgradesMenu();
        this.updateUI();
    }

    openSettings() {
        this.currentState = this.STATES.SETTINGS;
        this.updateUI();
    }

    changePage(direction) {
        const skins = this.skinManager.getSkins();
        const totalPages = Math.ceil(skins.length / this.itemsPerPage);

        const newPage = this.currentPage + direction;

        if (newPage >= 0 && newPage < totalPages) {
            // Animate transition
            const container = document.getElementById('skins-container');
            container.classList.add('fade-out');

            setTimeout(() => {
                this.currentPage = newPage;
                this.renderSkinsList();
                container.classList.remove('fade-out');

                // Optional: add slide-in effect class if needed, or rely on removal of fade-out transition
            }, 300); // Wait for transition
        }
    }

    // --- End of Shop Logic ---

    drawSkinPreview(ctx, skin, canvasWidth, canvasHeight) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);

        // Define Reference Size (Player's actual size in game)
        const refSize = 30;
        const scale = (Math.min(canvasWidth, canvasHeight) / refSize) * 0.7;
        ctx.scale(scale, scale);

        const width = refSize;
        const height = refSize;

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = skin ? skin.color : '#00f3ff';
        ctx.fillStyle = skin ? skin.color : '#00f3ff';

        if (skin && skin.type === 'shape') {
            switch (skin.shape) {
                case 'triangle': this.drawPolygon(ctx, 0, 0, width / 2, 3); break;
                case 'diamond':
                    ctx.save();
                    ctx.rotate(Math.PI / 4);
                    this.drawPolygon(ctx, 0, 0, width / 1.5, 4);
                    ctx.restore();
                    break;
                case 'pentagon': this.drawPolygon(ctx, 0, 0, width / 1.8, 5); break;
                case 'hexagon': this.drawPolygon(ctx, 0, 0, width / 2, 6); break;
                case 'heptagon': this.drawPolygon(ctx, 0, 0, width / 2, 7); break;
                case 'star': this.drawStarPreview(ctx, 0, 0, 5, width / 1.5, width / 3); break;
                default: ctx.fillRect(-width / 2, -height / 2, width, height);
            }
        } else if (skin && skin.type === 'animated') {
            ctx.fillRect(-width / 2, -height / 2, width, height);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.8;
            ctx.fillRect(-width / 4, -height / 4, width / 2, height / 2);
            ctx.globalAlpha = 1.0;
        } else if (skin && skin.type === 'special') {
            if (skin.id === 'matrix') {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(-width / 2, -height / 2, width, height);
                ctx.fillStyle = 'rgba(0, 20, 0, 0.8)';
                ctx.fillRect(-width / 2, -height / 2, width, height);
                ctx.fillStyle = '#00ff00';
                ctx.font = '8px monospace';
                ctx.fillText('1', -3, 3);
            } else if (skin.id === 'rainbow') {
                const hue = (Date.now() / 10) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.fillRect(-width / 2, -height / 2, width, height);
            } else if (skin.id === 'supernova' || skin.id === 'god_mode') {
                const isGod = skin.id === 'god_mode';
                // Rays in preview (Static or slightly offset for variety)
                ctx.save();
                ctx.globalAlpha = 0.4;
                const rays = isGod ? 12 : 8;
                const rayLen = width * (isGod ? 2 : 1.5);
                ctx.rotate(isGod ? 0.5 : 0.2); // Static tilt for preview
                for (let i = 0; i < rays; i++) {
                    ctx.rotate((Math.PI * 2) / rays);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(width / 4, -rayLen);
                    ctx.lineTo(-width / 4, -rayLen);
                    ctx.fill();
                }
                ctx.restore();

                ctx.fillStyle = isGod ? '#fff700' : '#ffaa00';
                ctx.fillRect(-width / 2, -height / 2, width, height);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-width / 3, -height / 3, width * 0.6, height * 0.6);
            } else {
                ctx.fillRect(-width / 2, -height / 2, width, height);
            }
        } else {
            // Default / Color
            ctx.fillRect(-width / 2, -height / 2, width, height);
            // Optional: Visor
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(-width / 2 + 5, -height / 2 + 10, width - 10, height / 4);
        }

        ctx.restore();
    }

    drawStarPreview(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    drawPolygon(ctx, x, y, radius, sides) {
        if (sides < 3) return;
        const angle = (Math.PI * 2) / sides;
        ctx.beginPath();
        ctx.moveTo(x + radius * Math.cos(0), y + radius * Math.sin(0));
        for (let i = 1; i < sides; i++) {
            ctx.lineTo(x + radius * Math.cos(i * angle), y + radius * Math.sin(i * angle));
        }
        ctx.closePath();
        ctx.fill();
    }

    updateUI() {
        // Hide all screens with safety check
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
                screen.classList.add('hidden');
            }
        });
        this.powerUpTimerUI.classList.add('hidden');
        if (this.hud) this.hud.classList.add('hidden'); // Reset HUD visibility

        // Mobile Controls Visibility
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            const isMobile = this.input.controlMode === 'mobile';
            const isPlaying = this.currentState === this.STATES.PLAYING || 
                             this.currentState === this.STATES.COLOSSEUM;
            
            if (isMobile && isPlaying) {
                mobileControls.classList.remove('hidden');
            } else {
                mobileControls.classList.add('hidden');
            }
        }

        // Show current state screen
        if (this.currentState === this.STATES.MENU) {
            this.screens.menu.classList.remove('hidden');
            this.screens.menu.classList.add('active');

            // Update Coin Display in Menu
            const coinEl = document.getElementById('menu-coin-val');
            if (coinEl) {
                coinEl.innerText = this.scoreManager.coins;
            }

            // Check Competitive Unlock
            const btnComp = document.getElementById('btn-competitive');
            const lockIcon = document.getElementById('competitive-lock-icon');
            if (btnComp) {
                const isUnlocked = localStorage.getItem('game_completed') === 'true' || localStorage.getItem('boss_10_defeated') === 'true';
                if (isUnlocked) {
                    btnComp.classList.remove('locked');
                    btnComp.classList.add('unlocked');
                    if (lockIcon) lockIcon.style.display = 'none';
                } else {
                    btnComp.classList.add('locked');
                    btnComp.classList.remove('unlocked');
                    if (lockIcon) lockIcon.style.display = 'inline';
                }
            }

            if (document.getElementById('skin-menu-coins')) {
                // Also update skin menu coins in case we just bought something and went back?
                // Actually skin menu updates in renderSkinsList.
            }

        } else if (this.currentState === this.STATES.DEVICE) {
            if (this.screens.device) {
                this.screens.device.classList.remove('hidden');
                this.screens.device.classList.add('active');
            }
        } else if (this.currentState === this.STATES.PAUSED) {
            this.screens.pause.classList.remove('hidden');
            this.screens.pause.classList.add('active');
            this.hud.classList.remove('hidden');
        } else if (this.currentState === this.STATES.GAMEOVER) {
            this.screens.gameover.classList.remove('hidden');
            this.screens.gameover.classList.add('active');
            
            // competitive: Hide restart button and coins
            const btnRestart = document.getElementById('btn-restart');
            const coinsDisplay = document.querySelector('#menu-gameover .stats-container p:last-child');
            if (btnRestart) {
                if (this.isCompetitiveMode) {
                    btnRestart.classList.add('hidden');
                    if (coinsDisplay) coinsDisplay.style.display = 'none';
                } else {
                    btnRestart.classList.remove('hidden');
                    if (coinsDisplay) coinsDisplay.style.display = 'block';
                }
            }
        } else if (this.currentState === this.STATES.SHOP) {
            this.screens.shop.classList.remove('hidden');
            this.screens.shop.classList.add('active');
        } else if (this.currentState === this.STATES.SETTINGS) {
            this.screens.settings.classList.remove('hidden');
            this.screens.settings.classList.add('active');
        } else if (this.currentState === this.STATES.UPGRADES) {
            this.screens.upgrades.classList.remove('hidden');
            this.screens.upgrades.classList.add('active');
        } else if (this.currentState === this.STATES.COLOSSEUM_MENU) {
            this.screens.colosseumMenu.classList.remove('hidden');
            this.screens.colosseumMenu.classList.add('active');
        } else if (this.currentState === this.STATES.COMPETITIVE_MENU) {
            this.screens.competitiveMenu.classList.remove('hidden');
            this.screens.competitiveMenu.classList.add('active');
        } else if (this.currentState === this.STATES.ROADMAP) {
            this.screens.roadmap.classList.remove('hidden');
            this.screens.roadmap.classList.add('active');
        } else if (this.currentState === this.STATES.PLAYING || this.currentState === this.STATES.COLOSSEUM || this.currentState === this.STATES.KEY_SEQUENCE) {
            this.hud.classList.remove('hidden');
            this.scoreManager.updateHUD(); // Ensure counter is correct immediately
            console.log("UpdateUI: PLAYING. ControlMode:", this.input.controlMode);
            if (this.input.controlMode === 'mobile') {
                const mobileControls = document.getElementById('mobile-controls');
                if (mobileControls) {
                    mobileControls.classList.remove('hidden');
                    console.log("UpdateUI: Removing hidden from mobile controls");
                } else {
                    console.error("UpdateUI: mobile-controls not found");
                }
            }
        } else if (this.currentState === this.STATES.VICTORY) {
            this.screens.victory.classList.remove('hidden');
            this.screens.victory.classList.add('active');
        } else if (this.currentState === this.STATES.GRAPHICS) {
            this.screens.graphics.classList.remove('hidden');
            this.screens.graphics.classList.add('active');
        } else if (this.currentState === this.STATES.BOX_OPENING) {
            // Keep HUD visible perhaps? Or just blurred background
            // The Box Overlay is handled by BoxManager DOM
        }
    }

    activateSlowMo() {
        this.slowMoTimer = 5000; // 5 seconds
        this.timeScale = 0.5;
        this.powerUpTimerUI.classList.remove('hidden');
    }

    triggerShake(duration, intensity) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }




    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 800, // ms
            maxLife: 800,
            vy: -0.05 // float up speed
        });
    }

    gameLoop(timeStamp) {
        const deltaTime = timeStamp - this.lastTime;

        // FPS Limiter
        const fpsLimit = this.settings.get('fpsLimit');
        if (fpsLimit && fpsLimit !== 'UNLIMITED') {
            const minFrameTime = 1000 / fpsLimit;
            if (deltaTime < minFrameTime) {
                requestAnimationFrame(this.gameLoop.bind(this));
                return;
            }
        }

        this.lastTime = timeStamp;
        this.gameTime += deltaTime;

        if (this.currentState === this.STATES.PLAYING || this.currentState === this.STATES.COLOSSEUM) {

            // TIME STOP LOGIC (Power of Edit)
            if (this.isTimeStopped) {
                this.editPowerTimer -= deltaTime;
                if (this.editPowerTimer <= 0) {
                    this.isTimeStopped = false;
                }
            }

            // Clear Screen FIRST (Ensure Absolute Clear)
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.width, this.height);

            const isKeySequence = this.currentState === this.STATES.KEY_SEQUENCE;

            // Screen Shake Transform
            this.ctx.save();
            if (this.shakeTimer > 0) {
                this.shakeTimer -= deltaTime;
                const dx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
                const dy = (Math.random() - 0.5) * 2 * this.shakeIntensity;
                this.ctx.translate(dx, dy);
            }

            // Apply Grayscale if Time Stopped OR Boss Death Effect
            if (this.isTimeStopped || this.grayscaleEffect) {
                this.ctx.filter = 'grayscale(100%)'; // or invert(1)? Grayscale is what user asked for "High Contrast" usually implies b&w.
            } else {
                this.ctx.filter = 'none';
            }

            // Slow Mo Logic
            if (this.slowMoTimer > 0) {
                this.slowMoTimer -= deltaTime;
                this.slowValUI.innerText = (this.slowMoTimer / 1000).toFixed(1);
                if (this.slowMoTimer <= 0) {
                    this.slowMoTimer = 0;
                    this.timeScale = 1.0;
                    this.powerUpTimerUI.classList.add('hidden');
                }
            }

            // Pause Updates if Time Stopped
            if (!this.isTimeStopped) {
                // Apply scale to game entities
                const gameDelta = deltaTime * this.timeScale;

                // --- UPDATES ---
                if (!isKeySequence) {
                    this.difficultyManager.update(gameDelta);
                    this.obstacleManager.update(gameDelta);
                    if (!this.player.isDead) {
                        this.scoreManager.update(gameDelta);
                    }
                    this.powerUpManager.update(deltaTime);
                }

                this.player.update(deltaTime);

                // Update Boss
                if (this.boss) {
                    // Only update if intro/death is NOT active
                    if (!this.bossIntroActive && !this.bossDeathActive) {
                        this.boss.update(deltaTime);
                    }
                    if (this.boss.markedForDeletion) {
                        this.endBossFight();
                    }
                }

                // Floating Texts Update
                this.floatingTexts.forEach(ft => {
                    ft.y += ft.vy * deltaTime;
                    ft.life -= deltaTime;
                    ft.alpha = ft.life / ft.maxLife;
                });
                this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

                // --- LOGIC ---

                // Boss Spawn
                if (!this.bossActive && this.currentState === this.STATES.PLAYING && !this.isCompetitiveMode) {
                    const nextThreshold = (this.bossesDefeated + 1) * 500;
                    if (this.scoreManager.score >= nextThreshold) {
                        this.startBossFight();
                    }
                }


                // PowerUp Collisions
                const powerUpHit = this.powerUpManager.checkCollision(this.player);
                if (powerUpHit) {
                    const type = powerUpHit.constructor.name;
                    if (type === 'PowerUp') {
                        this.triggerSlowMo(2000);
                        this.timeScale = 0.5;
                        this.powerUpTimerUI.classList.remove('hidden');
                        this.powerUpManager.remove(powerUpHit);
                        this.triggerShake(100, 2);
                        this.powerUpSound.currentTime = 0;
                        this.powerUpSound.play().catch(e => { });
                    } else if (type === 'ScorePowerUp') {
                        if (this.upgradeManager.hasToolScore) {
                            this.scoreManager.score += 100;
                            this.addFloatingText(powerUpHit.x, powerUpHit.y, "+100!", "#ff00ff");
                        } else {
                            this.scoreManager.score += 20;
                            this.addFloatingText(powerUpHit.x, powerUpHit.y, "+20", "#ff00ff");
                        }
                        this.powerUpManager.remove(powerUpHit);
                        this.powerUpSound.currentTime = 0;
                        this.powerUpSound.play().catch(e => { });
                    } else if (type === 'ShieldPowerUp') {
                        this.player.activateShield(3000);
                        this.powerUpManager.remove(powerUpHit);
                        this.addFloatingText(this.player.x, this.player.y, "SHIELD!", "#E0FFFF");
                        this.powerUpSound.currentTime = 0;
                        this.powerUpSound.play().catch(e => { });
                    } else if (type === 'SpeedPowerUp') {
                        this.player.activateSpeedBoost(3000);
                        this.powerUpManager.remove(powerUpHit);
                        const prefix = this.localizationManager.getString('floating.speed') || "SPEED!";
                        this.addFloatingText(this.player.x, this.player.y, prefix, "#ADD8E6");
                        this.powerUpSound.currentTime = 0;
                        this.powerUpSound.play().catch(e => { });
                    } else if (type === 'HealthPowerUp') {
                        this.player.addHeart();
                        this.powerUpManager.remove(powerUpHit);
                        this.addFloatingText(this.player.x, this.player.y, "♥", "#ff69b4");
                        this.powerUpSound.currentTime = 0;
                        this.powerUpSound.play().catch(e => { });
                    }
                }

                // Obstacle Collisions
                const collisionObject = this.obstacleManager.checkCollision(this.player);
                if (collisionObject && !this.player.isDead) { // Collision detected
                    let handled = false;

                    // 1. Dash Offense (Prioritize Kill)
                    if (this.player.isDashing) {
                        let kill = false;

                        // Deadly Dash (Always Kills)
                        if (this.upgradeManager.hasDashAttack) {
                            kill = true;
                        }
                        // Power of Edit (Chance to Kill & Stop Time)
                        if (this.upgradeManager.hasToolEdit) {
                            // Roll once per obstacle interaction
                            if (collisionObject._editRoll === undefined) {
                                collisionObject._editRoll = Math.random();
                            }
                            // 25% Chance
                            if (collisionObject._editRoll < 0.25) {
                                if (!this.isTimeStopped) this.startEditPower();
                                kill = true;
                            }
                        }

                        if (kill && !collisionObject.isHarmless) {
                            this.obstacleManager.triggerShieldExplosion(collisionObject);
                            this.triggerShake(100, 3);
                            handled = true;
                        }

                        // Score Dash (Coins)
                        if (this.upgradeManager.hasDashScore && !collisionObject.scored) {
                            collisionObject.scored = true;
                            this.scoreManager.addCoins(20);
                            this.addFloatingText(collisionObject.x, collisionObject.y, "+20 💰", "#ffff00");
                            if (this.powerUpSound) {
                                this.powerUpSound.currentTime = 0;
                                this.powerUpSound.play().catch(e => { });
                            }
                        }
                    }

                    if (!handled) {
                        // 2. Defense / Damage Logic
                        if (this.player.shieldActive) {
                            // Shield Protection
                            if (collisionObject.constructor.name !== 'Laser') {
                                this.obstacleManager.triggerShieldExplosion(collisionObject);
                            }
                            this.triggerShake(200, 5);
                        } else if (!this.player.isInvulnerable) {
                            // Vulnerable -> Check Hearts or Die
                            if (this.player.loseHeart()) {
                                // Survived with Heart loss
                                if (collisionObject.constructor.name !== 'Laser') {
                                    this.obstacleManager.triggerShieldExplosion(collisionObject);
                                }
                                this.triggerShake(200, 5);
                                this.addFloatingText(this.player.x, this.player.y, "-♥", "#ff0000");
                                this.player.activateShield(2000); // Grant temp invulnerability on hit
                            } else {
                                // Die (Gate this to avoid loop spam in console)
                                if (!this.player.isDead) {
                                    this.player.isDead = true;
                                    this.player.explode();
                                    this.triggerShake(500, 10);
                                    this.deathSound.currentTime = 0;
                                    this.deathSound.play().catch(e => { });
                                    setTimeout(() => {
                                        this.gameOver();
                                    }, 1500);
                                }
                            }
                        }
                        // If Invulnerable (Dashing but didn't kill), do nothing (Phase Through)
                    }
                }
            }

        } // End if (!this.isTimeStopped)

        // Boss Collisions (Skip if Intro OR Death OR Invisible)
        if (this.boss && !this.player.isDead && !this.bossIntroActive && !this.bossDeathActive && this.boss.visible) {
            try {
                // Simple AABB check since checkCollision might be global or utility
                // Assuming checkCollision(rect1, rect2) or similar exists or logic is embedded
                // Reusing logic from previous snippet if possible, or simple overlap:

                const p = this.player;
                const b = this.boss;
                const overlap = (p.x < b.x + b.width && p.x + p.width > b.x &&
                    p.y < b.y + b.height && p.y + p.height > b.y);

                if (overlap) {
                    if (this.player.isDashing && this.boss.isVulnerable) {
                        this.boss.takeDamage();
                        // Bounce
                        const dx = (p.x + p.width / 2) - (b.x + b.width / 2);
                        const dy = (p.y + p.height / 2) - (b.y + b.height / 2);
                        const dist = Math.hypot(dx, dy) || 1;
                        p.x += (dx / dist) * 150;
                        p.y += (dy / dist) * 150;
                        this.player.isDashing = false;
                        this.player.isInvulnerable = this.player.shieldActive;
                    } else {
                        if (this.player.shieldActive) {
                            // Bounce safe
                            const dx = (p.x + p.width / 2) - (b.x + b.width / 2);
                            const dy = (p.y + p.height / 2) - (b.y + b.height / 2);
                            const dist = Math.hypot(dx, dy) || 1;
                            p.x += (dx / dist) * 100;
                            p.y += (dy / dist) * 100;
                        } else if (this.player.loseHeart()) {
                            const dx = (p.x + p.width / 2) - (b.x + b.width / 2);
                            const dy = (p.y + p.height / 2) - (b.y + b.height / 2);
                            const dist = Math.hypot(dx, dy) || 1;
                            p.x += (dx / dist) * 150;
                            p.y += (dy / dist) * 150;
                            this.triggerShake(200, 5);
                            this.addFloatingText(p.x, p.y, "-♥", "#ff0000");
                        } else {
                            this.player.explode();
                            this.triggerShake(500, 10);
                            this.deathSound.currentTime = 0;
                            this.deathSound.play().catch(e => { });
                            setTimeout(() => { this.gameOver(); }, 1500);
                        }
                    }
                }
            } catch (e) { console.error(e); }
        }


        // --- DRAWS ---
        if (this.boss && this.boss.drawBackground) {
            this.boss.drawBackground(this.ctx);
        }

        this.player.draw(this.ctx);
        if (this.boss) this.boss.draw(this.ctx);
        this.obstacleManager.draw(this.ctx);
        this.powerUpManager.draw(this.ctx);

        // DARKNESS OVERLAY (Boss 9)
        if (this.isDarknessLevel && this.settings.get('quality') !== 'LOW') {
            // 1. Clear and Fill Darkness Canvas
            this.dCtx.globalCompositeOperation = 'source-over';
            this.dCtx.fillStyle = 'black';
            this.dCtx.fillRect(0, 0, this.width, this.height);

            // 2. Cut out lights (Erase from Darkness Canvas)
            this.dCtx.globalCompositeOperation = 'destination-out';

            // Player Light
            this.dCtx.beginPath();
            const pCx = this.player.x + this.player.width / 2;
            const pCy = this.player.y + this.player.height / 2;
            this.dCtx.arc(pCx, pCy, 150, 0, Math.PI * 2);
            this.dCtx.fill();

            // Boss Light
            if (this.boss && this.boss.isVulnerable) {
                const bCx = this.boss.x + this.boss.width / 2;
                const bCy = this.boss.y + this.boss.height / 2;
                if (this.boss.blinkState) {
                    this.dCtx.beginPath();
                    this.dCtx.arc(bCx, bCy, 200, 0, Math.PI * 2);
                    this.dCtx.fill();
                }
            }

            // Guide Enemies Light
            this.obstacleManager.obstacles.forEach(obs => {
                if (obs.isGuide || (obs.constructor.name === 'DiamondEnemy' && obs.color === '#00008B')) {
                    const oCx = obs.x + obs.width / 2;
                    const oCy = obs.y + obs.height / 2;
                    this.dCtx.beginPath();
                    this.dCtx.arc(oCx, oCy, 100, 0, Math.PI * 2);
                    this.dCtx.fill();
                }
            });

            // 3. Draw Darkness Canvas over Game Canvas
            this.ctx.globalCompositeOperation = 'source-over'; // Ensure standard blending
            this.ctx.drawImage(this.darknessCanvas, 0, 0);
        }

        // Remove Filter if applied
        if (this.isTimeStopped) {
            this.ctx.filter = 'none';
            // Draw Skull Emoji
            this.ctx.fillStyle = 'white';
            this.ctx.font = '100px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('💀', this.width / 2, this.height / 2);
        }

        // BOSS INTRO UI
        if (this.bossIntroActive && this.boss) {
            // Darken background slightly?
            // this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            // this.ctx.fillRect(0,0,this.width, this.height);

            const centerX = this.width / 2;
            const centerY = this.height / 2;

            // Bar Background
            const barHeight = 60;

            // Fade Out Logic: Fade over last 0.5s (500ms)
            let alpha = 1.0;
            if (this.bossIntroTimer < 500) {
                alpha = this.bossIntroTimer / 500;
            }

            this.ctx.globalAlpha = alpha; // Apply to everything drawn

            this.ctx.fillStyle = this.boss.color; // Boss Color
            this.ctx.fillRect(0, centerY - barHeight / 2, this.width, barHeight);

            // Boss Name
            this.ctx.save();
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 40px "Outfit", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.boss.name, centerX, centerY);
            this.ctx.restore();

            this.ctx.globalAlpha = 1.0; // Reset

            // Timer Logic
            this.bossIntroTimer -= deltaTime;
            if (this.bossIntroTimer <= 0) {
                this.bossIntroActive = false;
            }

            // SKIP UPDATE for Boss during intro (so it doesn't move/attack)
            // But we allow player to move (as per "nothing attacks YOU", you can exist)
        }

        // BOSS DEATH ANIMATION
        if (this.bossDeathActive && this.boss) {
            this.bossDeathTimer -= deltaTime;

            // Physics Update (Falling)
            const timeScale = deltaTime / 16.666;

            // Apply Gravity (Acceleration)
            const gravityPerFrame = 0.15; 
            this.boss.vy += gravityPerFrame * timeScale;
            
            // Apply Velocity
            this.boss.x += this.boss.vx * timeScale;
            this.boss.y += this.boss.vy * timeScale;

            this.boss.angle = (this.boss.angle || 0) + (this.boss.rotationSpeed * 0.05 * timeScale);

            // Force rotation for draw
            this.boss.isDashing = true;

            // Random Small Explosions trailing (Reduced frequency)
            if (Math.random() < 0.05) { // Was 0.1
                // Calculate rotated spawn position relative to center
                const cx = this.boss.x + this.boss.width / 2;
                const cy = this.boss.y + this.boss.height / 2;
                // Random offset from center (unrotated)
                const ox = (Math.random() - 0.5) * this.boss.width;
                const oy = (Math.random() - 0.5) * this.boss.height;

                // Rotate offset by boss.angle
                const cos = Math.cos(this.boss.angle);
                const sin = Math.sin(this.boss.angle);
                const rx = ox * cos - oy * sin;
                const ry = ox * sin + oy * cos;

                const ex = new ExplosionEffect(this,
                    cx + rx,
                    cy + ry,
                    this.boss.color,
                    30, 30
                );
                this.obstacleManager.obstacles.push(ex);
            }

            // End Condition: Off-screen (bottom) with timer failsafe
            if (this.boss.y > this.height + 200 || this.bossDeathTimer <= 0) {
                if (this.boss.type === 'secret') {
                    this.victory();
                } else {
                    this.endBossFight();
                }
            }
        }


        // Floating Texts Draw
        this.floatingTexts.forEach(ft => {
            this.ctx.save();
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.fillStyle = ft.color;
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = 'black';
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        });

        // HUD: Hearts removed (Legacy code)


        // Restore Shake Transform
        this.ctx.restore();


        // Draw Score and other UI elements that persist
        if (this.currentState === this.STATES.PLAYING || this.currentState === this.STATES.PAUSED) {
            // Score handled by DOM update mostly, but if we had canvas UI it goes here
        }

        // Grayscale effect handled at start of frame

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    victory() {
        this.currentState = this.STATES.VICTORY;
        this.scoreManager.saveHighScore();
        // Mark Boss 10 as defeated to hide Skull
        localStorage.setItem('boss_10_defeated', 'true');

        document.getElementById('victory-score').innerText = Math.floor(this.scoreManager.score);
        this.updateUI();
        // Play Victory Sound?
        if (this.powerUpSound) {
            // Maybe play jake sound or something special
            this.powerUpSound.play().catch(e => { });
        }
    }


    toggleSetting(key, values) {
        const current = this.settings.get(key);
        const idx = values.indexOf(current);
        const next = values[(idx + 1) % values.length];
        this.settings.set(key, next);
        this.updateSettingsUI();

        // Play sound
        this.selectSound.currentTime = 0;
        this.selectSound.play().catch(e => { });
    }

    toggleBoolSetting(key) {
        const current = this.settings.get(key);
        this.settings.set(key, !current);
        this.updateSettingsUI();
        this.selectSound.currentTime = 0;
        this.selectSound.play().catch(e => { });
    }

    updateSettingsUI() {
        const qBtn = document.getElementById('btn-cycle-quality');
        const fBtn = document.getElementById('btn-cycle-fps');
        const nBtn = document.getElementById('btn-cycle-neon');
        const pBtn = document.getElementById('btn-cycle-particles');

        if (qBtn) {
            const val = this.settings.get('quality');
            let text = "ALTA";
            if (val === 'LOW') text = "BAJA";
            if (val === 'MEDIUM') text = "MEDIA";
            qBtn.innerText = text;
        }
        if (fBtn) fBtn.innerText = this.settings.get('fpsLimit');

        if (nBtn) {
            const val = this.settings.get('neon');
            nBtn.innerText = val ? "ON" : "OFF";
            nBtn.style.color = val ? "#00f3ff" : "#555";
            nBtn.style.borderColor = val ? "#00f3ff" : "#555";
        }

        if (pBtn) {
            const val = this.settings.get('particles');
            pBtn.innerText = val ? "ON" : "OFF";
            pBtn.style.color = val ? "#00f3ff" : "#555";
            pBtn.style.borderColor = val ? "#00f3ff" : "#555";
        }
    }

    resetData() {
        // Clear all LocalStorage for this game
        // We know keys start with 'neon_survive_'
        // But safer to just remove known keys or clear all if the domain is exclusive to this game.
        // Given it's likely a local file or dedicated page, let's remove specific keys to be safe, 
        // or just clear() if user accepts "ALL DATA".

        // List of keys we use:
        const keys = [
            'neon_survive_high_score',
            'neon_survive_coins',
            'neon_survive_skin',
            'neon_survive_skin_v2', // New skin system
            'neon_survive_purchased_skins_v2',
            'neon_survive_upgrades',
            'neon_survive_settings',
            'game_completed',
            'skull_revealed',
            'boss_10_defeated',
            'boss_9_defeated'
        ];

        keys.forEach(k => localStorage.removeItem(k));

        // Or just localStorage.clear() if valid
        // localStorage.clear(); 

        location.reload();
    }

    changeUpgradePage(direction) {
        const totalPages = 2; // Revert to 2 pages
        const newPage = this.upgradesPage + direction;

        if (newPage >= 0 && newPage < totalPages) {
            this.upgradesPage = newPage;
            this.renderUpgradesMenu();
            // Play sound
            this.selectSound.currentTime = 0;
            this.selectSound.play().catch(e => { });
        }
    }

    renderUpgradesMenu() {
        // Toggle Pages
        document.getElementById('upgrades-page-0').classList.toggle('hidden', this.upgradesPage !== 0);
        document.getElementById('upgrades-page-0').classList.toggle('active', this.upgradesPage === 0);

        document.getElementById('upgrades-page-1').classList.toggle('hidden', this.upgradesPage !== 1);
        document.getElementById('upgrades-page-1').classList.toggle('active', this.upgradesPage === 1);

        // Update Header
        document.getElementById('upgrade-page-indicator').innerText = `${this.upgradesPage + 1} / 2`;

        const btnPrev = document.getElementById('btn-prev-upgrade-page');
        const btnNext = document.getElementById('btn-next-upgrade-page');

        btnPrev.disabled = this.upgradesPage === 0;
        btnNext.disabled = this.upgradesPage === 1;

        btnPrev.style.opacity = this.upgradesPage === 0 ? 0.3 : 1;
        btnNext.style.opacity = this.upgradesPage === 1 ? 0.3 : 1;

        if (this.upgradesPage === 0) {
            this.renderBasicUpgrades();
        } else {
            // Render Slots
        }

        const mgr = this.upgradeManager;
        // --- Update Slots UI ---
        this.updateSlotUI('speed', 'slot-speed');
        this.updateSlotUI('dash', 'slot-dash');
        this.updateSlotUI('dash2', 'slot-dash2');
        this.updateToolsSlotUI(); // New method for tools slot
    }

    renderBasicUpgrades() {
        const mgr = this.upgradeManager;

        // --- Basic Upgrades ---
        // Render Speed Card
        const currentLvl = mgr.currentLevel;
        const maxLvl = mgr.maxLevel;
        const cost = mgr.getNextCost();

        // Progress Bar (0 to 100%)
        const progress = (currentLvl / maxLvl) * 100;
        document.getElementById('speed-progress-fill').style.width = `${progress}%`;
        document.getElementById('speed-level-text').innerText = `NIVEL ${currentLvl + 1} / ${maxLvl + 1}`;

        const btn = document.getElementById('btn-buy-speed');
        const costSpan = document.getElementById('speed-cost');

        if (currentLvl >= maxLvl) {
            btn.disabled = true;
            btn.innerHTML = "MAX";
            btn.style.opacity = 0.5;
            btn.style.borderColor = "transparent";
            btn.style.background = "rgba(255,255,255,0.1)";
        } else {
            btn.disabled = false;
            // costSpan is inside button usually, but here we overwrite HTML
            btn.innerHTML = `<span id="speed-cost">${cost}</span> 💰`;

            // Visual feedback if affordable
            if (mgr.canAfford()) {
                btn.style.opacity = 1;
                btn.style.borderColor = "#00f3ff"; // Primary
                btn.style.background = "linear-gradient(45deg, #bc13fe, #00f3ff)";
            } else {
                btn.style.opacity = 0.5;
                btn.style.borderColor = "#ff0055"; // Danger
                btn.style.background = "transparent";
            }
        }

        // Render Dash Card
        const dashLvl = mgr.dashCooldownLevel; // Corrected prop
        const dashMax = mgr.maxLevel;
        const dashCost = mgr.getNextDashCost(); // Corrected method

        const dashProgress = (dashLvl / dashMax) * 100;
        document.getElementById('dash-progress-fill').style.width = `${dashProgress}%`;
        document.getElementById('dash-level-text').innerText = `NIVEL ${dashLvl + 1} / ${dashMax + 1}`;

        const btnDash = document.getElementById('btn-buy-dash');

        if (dashLvl >= dashMax) {
            btnDash.disabled = true;
            btnDash.innerHTML = "MAX";
            btnDash.style.opacity = 0.5;
            btnDash.style.borderColor = "transparent";
            btnDash.style.background = "rgba(255,255,255,0.1)";
        } else {
            btnDash.disabled = false;
            btnDash.innerHTML = `<span id="dash-cost">${dashCost}</span> 💰`;
            btnDash.style.opacity = 1;
            btnDash.style.borderColor = "rgba(255, 255, 255, 0.2)";
            btnDash.style.background = ""; // Reset gradient

            // Visual disabled state if not enough money
            if (mgr.canAfford(dashCost)) {
                btnDash.style.opacity = 1;
                btnDash.style.borderColor = "#00f3ff"; // Primary
                btnDash.style.background = "linear-gradient(45deg, #bc13fe, #00f3ff)";
            } else {
                btnDash.style.opacity = 0.5;
                btnDash.style.borderColor = "#ff0055";
                btnDash.style.background = "transparent";
            }
        }
    }

    updateToolsSlotUI() {
        const mgr = this.upgradeManager;
        const slotEl = document.getElementById('slot-tools');

        // Remove old listeners to prevent stacking usually requires cloning or named functions. 
        // For simplicity, we'll accept simple stacking risk or define onclick directly.
        // Better: user standard onclick property.

        slotEl.onclick = null;
        slotEl.classList.remove('locked-slot');

        if (!mgr.toolsUnlocked) {
            slotEl.querySelector('.slot-icon').innerText = "🔒";
            slotEl.querySelector('.slot-name').innerText = "1000 💰";
            slotEl.classList.add('locked-slot');

            if (!mgr.canAfford(1000)) {
                slotEl.style.opacity = 0.5;
            } else {
                slotEl.style.opacity = 1;
                slotEl.onclick = () => {
                    if (mgr.unlockTools()) {
                        this.selectSound.currentTime = 0;
                        this.selectSound.play().catch(e => { });
                        this.renderUpgradesMenu();
                        document.getElementById('menu-coin-val').innerText = this.scoreManager.coins;
                    }
                };
            }
        } else {
            const equippedId = mgr.equippedTool;
            let icon = "🔧";
            let name = "TIENDA";

            if (equippedId) {
                const tool = mgr.tools[equippedId];
                icon = tool.icon;
                name = this.localizationManager.getString(tool.nameKey);
                // Let's keep "TIENDA" so user knows they can click to change
                // But showing icon is good feedback.
            }

            slotEl.querySelector('.slot-icon').innerText = icon;
            slotEl.querySelector('.slot-name').innerText = name;
            slotEl.style.opacity = 1;

            slotEl.onclick = () => {
                this.openToolsModal();
                this.selectSound.currentTime = 0;
                this.selectSound.play().catch(e => { });
            };
        }
    }

    openToolsModal() {
        const modal = document.getElementById('tools-modal');
        const list = document.getElementById('modal-tools-list');
        const btnClose = document.getElementById('btn-close-tools');

        list.innerHTML = '';
        const mgr = this.upgradeManager;

        Object.values(mgr.tools).forEach(tool => {
            const item = document.createElement('div');
            item.className = 'ability-item';

            const isOwned = mgr.ownedTools.includes(tool.id);
            const isEquipped = mgr.equippedTool === tool.id;

            let name = this.localizationManager.getString(tool.nameKey);
            let desc = this.localizationManager.getString(tool.descKey);

            let btnHtml = '';
            if (isEquipped) {
                btnHtml = `<button class="btn secondary small" disabled>EQUIPADO</button>`;
            } else if (isOwned) {
                btnHtml = `<button class="btn primary small" id="btn-equip-${tool.id}">EQUIPAR</button>`;
            } else {
                btnHtml = `<button class="btn primary small" id="btn-buy-${tool.id}">${tool.cost} 💰</button>`;
            }

            item.innerHTML = `
        <div class="ability-item-icon">${tool.icon}</div>
        <div class="ability-item-info">
            <h4>${name}</h4>
            <span style="font-size: 0.8em; color: #aaa;">${desc}</span>
        </div>
        ${btnHtml}
    `;
            list.appendChild(item);

            if (!isEquipped) {
                if (isOwned) {
                    // Equip Handler
                    const btn = item.querySelector(`#btn-equip-${tool.id}`);
                    btn.onclick = () => {
                        mgr.equipTool(tool.id);
                        this.selectSound.currentTime = 0;
                        this.selectSound.play().catch(e => { });
                        this.openToolsModal(); // Refresh UI
                    };
                } else {
                    // Buy Handler
                    const btn = item.querySelector(`#btn-buy-${tool.id}`);
                    if (!mgr.canAfford(tool.cost)) {
                        btn.style.opacity = 0.5;
                    }
                    btn.onclick = () => {
                        if (mgr.buyTool(tool.id)) {
                            // Auto-equip on buy if nothing else is equipped? 
                            // User requirement: "tienes que equipar". Better let them manually equip or auto-equip if none.
                            if (!mgr.equippedTool) mgr.equipTool(tool.id);

                            this.selectSound.currentTime = 0;
                            this.selectSound.play().catch(e => { });
                            this.openToolsModal(); // Refresh
                            document.getElementById('menu-coin-val').innerText = this.scoreManager.coins;
                        }
                    };
                }
            }
        });

        // Add "Unequip" button if something is equipped
        if (mgr.equippedTool) {
            const item = document.createElement('div');
            item.className = 'ability-item';
            item.style.justifyContent = 'center';
            item.style.cursor = 'pointer';
            item.innerHTML = `<span style="color: #ff4444; font-weight: bold;">DESEQUIPAR TODO</span>`;
            item.onclick = () => {
                mgr.equipTool(null);
                this.selectSound.currentTime = 0;
                this.selectSound.play().catch(e => { });
                this.openToolsModal();
            };
            list.appendChild(item);
        }

        modal.classList.remove('hidden');

        btnClose.onclick = () => {
            modal.classList.add('hidden');
            this.updateToolsSlotUI(); // Update slot icon when closing
        };
    }

    updateSlotUI(type, elementId) {
        const mgr = this.upgradeManager;
        const slotEl = document.getElementById(elementId);

        // Clean classes
        slotEl.classList.remove('locked-slot');

        if (type === 'dash2' && !mgr.secondDashSlotUnlocked) {
            slotEl.querySelector('.slot-icon').innerText = "🔒";
            slotEl.querySelector('.slot-name').innerText = "800 💰";
            slotEl.classList.add('locked-slot'); // Add CSS class if desired for visual dimming
            if (!mgr.canAfford(800)) {
                slotEl.style.opacity = 0.5;
            } else {
                slotEl.style.opacity = 1;
            }
            return;
        }

        const equippedId = mgr.getEquipped(type);

        if (equippedId) {
            const ability = mgr.abilities[equippedId];
            slotEl.querySelector('.slot-icon').innerText = ability.icon;
            slotEl.querySelector('.slot-name').innerText = this.localizationManager.getString(ability.nameKey);
        } else {
            slotEl.querySelector('.slot-icon').innerText = "+";
            slotEl.querySelector('.slot-name').innerText = this.localizationManager.getString('upgrades.empty');
        }
        // Ensure opacity is reset if previously locked
        slotEl.style.opacity = 1;
    }

    openAbilityModal(type) {
        const modal = document.getElementById('ability-modal');
        const list = document.getElementById('modal-abilities-list');
        const title = document.getElementById('modal-title');

        // Filter abilities by type
        const mgr = this.upgradeManager;

        // Map slot type to ability type for Store Sharing
        let filterType = type;
        if (type === 'dash2') filterType = 'dash';

        const abilities = Object.values(mgr.abilities).filter(a => a.type === filterType);

        title.innerText = filterType === 'speed' ? 'MOVIMIENTO' : 'DASH'; // Should localize
        list.innerHTML = '';

        // Add "None/Unequip" option? Maybe later. For now, list abilities.

        abilities.forEach(ability => {
            const isOwned = mgr.isOwned(ability.id);
            const isEquipped = mgr.getEquipped(type) === ability.id;

            // Check if equipped in OTHER slot
            let isEquippedOther = false;
            if (filterType === 'dash') {
                const otherSlot = (type === 'dash') ? 'dash2' : 'dash';
                if (mgr.getEquipped(otherSlot) === ability.id) {
                    isEquippedOther = true;
                }
            }

            const name = this.localizationManager.getString(ability.nameKey);
            // const desc = ... (add desc key to ability meta if needed)

            const item = document.createElement('div');
            item.className = 'ability-item';

            let btnHtml = '';
            if (isEquipped) {
                btnHtml = `<button class="btn secondary small" disabled>EQUIPADO</button>`;
            } else if (isEquippedOther) {
                // Use a distinct look for "Occupied in other slot"
                btnHtml = `<button class="btn secondary small" style="opacity: 0.5; background: #555;" disabled>EN USO</button>`;
            } else if (isOwned) {
                btnHtml = `<button class="btn primary small" id="btn-equip-${ability.id}">EQUIPAR</button>`;
            } else {
                btnHtml = `<button class="btn primary small" id="btn-buy-${ability.id}">${ability.cost} 💰</button>`;
            }

            item.innerHTML = `
        <div class="ability-item-icon">${ability.icon}</div>
        <div class="ability-item-info">
            <h4>${name}</h4>
        </div>
        ${btnHtml}
    `;
            list.appendChild(item);

            // Bind events
            if (!isEquipped && !isEquippedOther) {
                if (isOwned) {
                    const btn = item.querySelector(`#btn-equip-${ability.id}`);
                    if (btn) btn.addEventListener('click', () => {
                        // Pass 'type' (the slot, e.g. dash2), not 'filterType' (the category, e.g. dash)
                        mgr.equipAbility(type, ability.id);
                        this.renderUpgradesMenu();
                        this.openAbilityModal(type); // Refresh modal
                        this.selectSound.currentTime = 0;
                        this.selectSound.play().catch(e => { });
                    });
                } else {
                    const btn = item.querySelector(`#btn-buy-${ability.id}`);
                    if (btn) {
                        // Check affordability
                        if (!mgr.canAfford(ability.cost)) {
                            btn.style.opacity = 0.5;
                        }

                        btn.addEventListener('click', () => {
                            if (mgr.buyAbility(ability.id)) {
                                document.getElementById('menu-coin-val').innerText = this.scoreManager.coins;
                                this.renderUpgradesMenu();
                                this.openAbilityModal(type); // Refresh modal
                                // Play Buy Sound
                                this.selectSound.currentTime = 0;
                                this.selectSound.play().catch(e => { });
                            }
                        });
                    }
                }
            }
        });

        // Add "Unequip" option if something is equipped
        if (mgr.getEquipped(type)) {
            const item = document.createElement('div');
            item.className = 'ability-item';
            item.style.justifyContent = 'center';
            item.style.cursor = 'pointer';
            item.innerHTML = `<span style="color: #ff4444; font-weight: bold;">DESEQUIPAR</span>`;
            item.addEventListener('click', () => {
                mgr.equipAbility(type, null);
                this.renderUpgradesMenu();
                this.openAbilityModal(type);
            });
            list.appendChild(item);
        }

        modal.classList.remove('hidden');
    }

    startBossFight() {
        if (this.bossActive) return;

        this.bossActive = true;
        this.bossIntroActive = true;
        this.bossIntroTimer = 3000;
        this.bgMusic.pause();

        this.obstacleManager.reset(); // Clear obstacles
        this.powerUpManager.reset();

        // Determine Boss Type
        if (this.bossesDefeated === 7) {
            this.boss = new EnneagonBoss(this); // Boss 8 (Revival Enneagon)
        } else if (this.bossesDefeated === 8) {
            this.boss = new DecagonBoss(this); // Boss 9 (Darkness Decagon)
        } else if (this.bossesDefeated === 9) {
            this.boss = new SecretBoss(this); // Boss 10 (Secret)
        } else if (this.bossesDefeated === 6) {
            this.boss = new PurpleOctagonBoss(this);
        } else if (this.bossesDefeated === 5) {
            this.boss = new BlueHeptagonBoss(this);
        } else {
            // Standard Boss Logic
            const bossTypes = ['red', 'yellow', 'orange', 'green', 'dark_green'];
            const type = bossTypes[this.bossesDefeated % bossTypes.length];
            this.boss = new Boss(this, type);
        }

        // Common Boss Init
        this.boss.x = this.width / 2 - this.boss.width / 2;
        this.boss.y = -150;

        this.triggerShake(500, 5);
        if (this.powerUpSound) {
            this.powerUpSound.currentTime = 0;
            this.powerUpSound.play().catch(e => { });
        }
    }



    activateRevive() {
        this.flagUsed = true;

        // Hide Game Over Screen
        this.screens.gameover.classList.add('hidden');
        this.gameOverActive = false; // Important: Clear game over state if any
        this.currentState = this.STATES.PLAYING; // Resume logic
        this.updateUI(); // Ensure HUD is visible

        this.player.lives = 0; // Revive with no extra hearts, just base life
        this.player.isDead = false; // Cancel death if set
        // Give temporary invulnerability
        this.player.activateShield(3000);

        // Clear nearby enemies or just push them away?
        // Let's trigger a massive "Revive Blast"
        this.obstacleManager.triggerShieldExplosion({
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            width: 100, // Big range
            height: 100,
            color: '#FFFFFF'
        });

        // Visual Feedback
        this.addFloatingText(this.player.x, this.player.y - 50, "REVIVED!", "#FFFFFF");
        this.addFloatingText(this.player.x, this.player.y - 80, "🚩", "#FFFFFF"); // Flag Icon

        // Play Sound (Power Up or new?)
        if (this.powerUpSound) {
            this.powerUpSound.currentTime = 0;
            this.powerUpSound.play().catch(e => { });
        }
    }

    triggerBossDeath() {
        this.bossDeathActive = true;
        this.bossDeathTimer = 5000; // 5 Seconds (extended)

        // Initial Explosion "Symbolizing Death"
        this.triggerShake(500, 20);
        // Play explosion sound start
        if (this.deathSound) {
            this.deathSound.currentTime = 0;
            this.deathSound.play().catch(e => { });
        }

        // Setup Falling Physics (Smoother/Slower)
        this.boss.vx = (Math.random() - 0.5) * 3; // Reduced drift
        this.boss.vy = -2; // Smaller pop up
        this.boss.gravity = 15; // Gravity (Pixel/sec^2 roughly, will be scaled by deltaTime in update)
        // Wait, if I use 15 and scale by dt (seconds), it's slow.
        // If I use previous logic `vy += gravity`, 0.5 per frame is huge.
        // Let's use a standard gravity feel. 9.8 is realistic but maybe fast.
        // Let's try 0.5 * 60 = 30px/sec^2?
        // Let's define this.boss.gravity = 10; and scale in update.
        this.boss.gravity = 10;
        this.boss.rotationSpeed = (Math.random() - 0.5) * 1.5; // Radians per sec

        // Create initial burst (Reduced count)
        for (let i = 0; i < 3; i++) {
            const ex = new ExplosionEffect(this,
                this.boss.x + Math.random() * this.boss.width,
                this.boss.y + Math.random() * this.boss.height,
                this.boss.color,
                this.boss.width, this.boss.height
            );
            this.obstacleManager.obstacles.push(ex);
        }
    }

    endBossFight() {
        // Reset boss
        this.boss = null;
        this.bossActive = false;
        this.bossIntroActive = false;
        this.bossDeathActive = false;
        this.bossesDefeated++;
        console.log(`Boss defeated! Total defeated: ${this.bossesDefeated}`);

        if (this.currentState === this.STATES.COLOSSEUM) {
            // Colosseum Logic: Next Boss
            // Colosseum Logic: Next Boss
            // Immediate Spawn (No delay)
            this.spawnRandomBoss();

            // Heal Player slightly?
            this.player.activateShield(3000);
            return;
        }

        if (this.lastGameMode === 'ROADMAP_FIGHT') {
            this.showScreen('menu-boss-roadmap');
            return;
        }

        if (this.bossesDefeated === 9) {
            console.log("Boss 9 defeated! Setting localStorage boss_9_defeated = true");
            localStorage.setItem('boss_9_defeated', 'true');
        }

        // Boss 9 (Decagon) Victory ?? No, Boss 10 is current
        if (this.bossesDefeated === 10) {
            console.log("Boss 10 defeated! Game Completed.");
            localStorage.setItem('game_completed', 'true');
            setTimeout(() => {
                this.victory();
            }, 4000);
            return; // Stop spawning
        }

        // Start Grace Period
        this.bossDeathTime = Date.now();

        // Resume Spawning with Ramp Up
        this.obstacleManager.resetSpawners();
        // Spawning resumes automatically in Game.js update loop when bossActive is false

        // Grant Shield for safety
        this.player.activateShield(5000); // 5 seconds of peace
        this.addFloatingText(this.player.x, this.player.y, "SHIELD!", "#E0FFFF");

        // Show Victory Message
        this.addFloatingText(this.width / 2, this.height / 2, "VICTORY!", "#00ff00");
    }

}
