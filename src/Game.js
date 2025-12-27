class Game {
    constructor(canvas) {
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
            SKINS: 4,
            SETTINGS: 5
        };
        this.currentState = this.STATES.MENU;

        // Managers and Entities
        this.input = new InputHandler(this);
        this.skinManager = new SkinManager(); // Initialize before player
        this.player = new Player(this);
        this.obstacleManager = new ObstacleManager(this);
        this.powerUpManager = new PowerUpManager(this); // New Manager
        this.scoreManager = new ScoreManager(this);
        this.difficultyManager = new DifficultyManager(this);
        this.localizationManager = new LocalizationManager(); // New Manager

        this.timeScale = 1.0;
        this.slowMoTimer = 0;

        // UI Elements
        this.screens = {
            menu: document.getElementById('menu-start'),
            pause: document.getElementById('menu-pause'),
            gameover: document.getElementById('menu-gameover'),
            skins: document.getElementById('menu-skins'),
            settings: document.getElementById('menu-settings')
        };
        this.hud = document.getElementById('hud');
        this.powerUpTimerUI = document.getElementById('powerup-timer'); // New UI
        this.slowValUI = document.getElementById('slow-val');

        // Audio
        this.bgMusic = new Audio('assets/Músicas/music.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.5; // Set volume to 50%

        this.powerUpSound = new Audio('assets/Sonidos/powerup.mp3');
        this.powerUpSound.volume = 1.0;

        this.selectSound = new Audio('assets/Sonidos/select.mp3');
        this.selectSound.volume = 1.0; // Match default SFX volume

        this.deathSound = new Audio('assets/Sonidos/ded.mp3');
        this.deathSound.volume = 1.0;

        this.dashSound = new Audio('assets/Sonidos/dash.mp3');
        this.dashSound.volume = 1.0;

        // Floating Texts
        this.floatingTexts = [];

        // Screen Shake Props
        this.shakeTimer = 0;
        this.shakeIntensity = 0;


        this.setupUIInteraction();

        // Bind UI buttons
        document.getElementById('btn-start').addEventListener('click', () => {
            this.start();
            this.bgMusic.play().catch(e => console.log("Audio play failed:", e));
        });
        document.getElementById('btn-skins').addEventListener('click', () => this.openSkins());
        document.getElementById('btn-settings').addEventListener('click', () => this.openSettings());
        document.getElementById('btn-back-settings').addEventListener('click', () => this.toMenu());
        document.getElementById('btn-back-skins').addEventListener('click', () => this.toMenu());

        // Language Toggle
        document.getElementById('btn-language').addEventListener('click', () => {
            const newLang = this.localizationManager.toggleLanguage();
            this.updateScreenSizeButton(); // Refresh size button text with new lang
            // Play sound
            this.selectSound.currentTime = 0;
            this.selectSound.play().catch(e => { });
        });

        // Volume Slider Logic
        const slider = document.getElementById('volume-slider');
        const volVal = document.getElementById('volume-val');
        if (slider) {
            slider.addEventListener('input', (e) => {
                const val = e.target.value;
                this.bgMusic.volume = val / 100;
                volVal.innerText = val + '%';
            });
        }

        // SFX Slider Logic
        const sfxSlider = document.getElementById('sfx-slider');
        const sfxVal = document.getElementById('sfx-val');
        this.sfxVolume = 1.0; // Default SFX volume

        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                this.sfxVolume = val / 100;
                sfxVal.innerText = val + '%';

                // Update existing sounds
                this.powerUpSound.volume = this.sfxVolume;
                this.selectSound.volume = this.sfxVolume;
                this.deathSound.volume = this.sfxVolume;
                this.dashSound.volume = this.sfxVolume;


            });
        }
        document.getElementById('btn-resume').addEventListener('click', () => this.resume());
        document.getElementById('btn-quit-pause').addEventListener('click', () => this.toMenu());
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.start();
            // Ensure music is playing if restarting
            if (this.bgMusic.paused) this.bgMusic.play().catch(e => console.log("Audio play failed:", e));
        });
        document.getElementById('btn-quit-gameover').addEventListener('click', () => this.toMenu());

        // Global interaction to ensure music plays in menu
        const startMusic = () => {
            if (this.bgMusic.paused) {
                this.bgMusic.play().catch(e => { });
            }
        };
        document.addEventListener('click', startMusic);
        document.addEventListener('keydown', startMusic);

        // Start Loop
        this.lastTime = 0;
        this.currentPage = 0; // Page 0 is first page
        this.itemsPerPage = 6;

        // Screen Size Logic
        this.currentSizeIndex = 1; // 0=Small, 1=Normal, 2=Large, 3=Full
        this.sizeClasses = ['size-small', 'size-normal', 'size-large', 'size-fullscreen'];
        this.sizeKeys = ['size.small', 'size.normal', 'size.large', 'size.fullscreen'];

        document.getElementById('btn-screen-size').addEventListener('click', () => this.toggleScreenSize());

        requestAnimationFrame(this.gameLoop.bind(this));

        // Pagination Binds
        document.getElementById('btn-prev-page').addEventListener('click', () => this.changePage(-1));
        document.getElementById('btn-next-page').addEventListener('click', () => this.changePage(1));
    }

    setupUIInteraction() {
        // Attach sound to all buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.selectSound.currentTime = 0;
                this.selectSound.play().catch(e => { });
            });
            btn.addEventListener('click', () => {
                this.selectSound.currentTime = 0;
                this.selectSound.play().catch(e => { });
            });
        });
    }

    start() {
        this.currentState = this.STATES.PLAYING;
        this.resetGame();
        this.updateUI();
    }

    pause() {
        if (this.currentState === this.STATES.PLAYING) {
            this.currentState = this.STATES.PAUSED;
            this.updateUI();
        }
    }

    resume() {
        if (this.currentState === this.STATES.PAUSED) {
            this.currentState = this.STATES.PLAYING;
            this.lastTime = performance.now(); // Reset time to avoid jump
            this.updateUI();
        }
    }

    toMenu() {
        this.currentState = this.STATES.MENU;
        this.updateUI();
    }

    gameOver() {
        this.currentState = this.STATES.GAMEOVER;
        this.scoreManager.saveHighScore();

        // Update Game Over UI with scores
        document.getElementById('final-score').innerText = Math.floor(this.scoreManager.score);
        document.getElementById('best-score').innerText = Math.floor(this.scoreManager.highScore);

        this.updateUI();
    }

    resetGame() {
        this.player.reset();
        this.obstacleManager.reset();
        this.powerUpManager.reset(); // Reset PowerUps
        this.scoreManager.reset();
        this.difficultyManager.reset();
        this.timeScale = 1.0;
        this.slowMoTimer = 0;
        this.lastTime = performance.now();
    }

    openSkins() {
        this.currentState = this.STATES.SKINS;
        this.currentPage = 0;
        this.renderSkinsList();
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

    renderSkinsList() {
        const list = document.getElementById('skins-list');
        list.innerHTML = '';

        const skins = this.skinManager.getSkins();
        const currentId = this.skinManager.getCurrentSkin().id;
        const highScore = this.scoreManager.highScore;

        // Pagination Slice
        const start = this.currentPage * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageSkins = skins.slice(start, end);

        // Update Indicator
        const totalPages = Math.ceil(skins.length / this.itemsPerPage);
        document.getElementById('page-indicator').innerText = `${this.currentPage + 1} / ${totalPages}`;

        // Update Buttons state
        document.getElementById('btn-prev-page').disabled = this.currentPage === 0;
        document.getElementById('btn-next-page').disabled = this.currentPage === totalPages - 1;
        document.getElementById('btn-prev-page').style.opacity = this.currentPage === 0 ? 0.3 : 1;
        document.getElementById('btn-next-page').style.opacity = this.currentPage === totalPages - 1 ? 0.3 : 1;

        pageSkins.forEach(skin => {
            const item = document.createElement('div');
            item.className = 'skin-item';

            const isUnlocked = this.skinManager.isUnlocked(skin.id, highScore);

            if (!isUnlocked) {
                item.classList.add('locked');
            } else if (skin.id === currentId) {
                item.classList.add('selected');
            }

            item.onclick = () => {
                if (this.skinManager.selectSkin(skin.id, highScore)) {
                    this.player.updateColor(); // Update player immediately
                    this.renderSkinsList(); // Re-render to show selection
                }
            };

            const preview = document.createElement('div');
            preview.className = 'skin-preview';

            if (skin.id === 'jake' && isUnlocked) {
                preview.style.backgroundColor = 'transparent';
                preview.style.backgroundImage = "url('assets/Skins/jake.png')";
                preview.style.backgroundSize = 'cover';
            } else {
                preview.style.backgroundColor = isUnlocked ? skin.color : '#333';
            }

            const name = document.createElement('div');
            name.className = 'skin-name';

            if (isUnlocked) {
                name.innerText = skin.name;
            } else {
                if (skin.isSecret) {
                    name.innerText = "???";
                } else {
                    const lockedText = this.localizationManager.getString('skins.locked');
                    name.innerText = `${lockedText} (${skin.unlockScore} pts)`;
                }
            }

            item.appendChild(preview);
            item.appendChild(name);
            list.appendChild(item);
        });
    }

    updateUI() {
        // Hide all screens
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        Object.values(this.screens).forEach(screen => screen.classList.add('hidden'));
        this.hud.classList.add('hidden');
        this.powerUpTimerUI.classList.add('hidden'); // Hide power-up timer by default

        // Show current state screen
        if (this.currentState === this.STATES.MENU) {
            this.screens.menu.classList.remove('hidden');
            this.screens.menu.classList.add('active');
        } else if (this.currentState === this.STATES.PAUSED) {
            this.screens.pause.classList.remove('hidden');
            this.screens.pause.classList.add('active');
            this.hud.classList.remove('hidden');
        } else if (this.currentState === this.STATES.GAMEOVER) {
            this.screens.gameover.classList.remove('hidden');
            this.screens.gameover.classList.add('active');
        } else if (this.currentState === this.STATES.SKINS) {
            this.screens.skins.classList.remove('hidden');
            this.screens.skins.classList.add('active');
        } else if (this.currentState === this.STATES.SETTINGS) {
            this.screens.settings.classList.remove('hidden');
            this.screens.settings.classList.add('active');
        } else if (this.currentState === this.STATES.PLAYING) {
            this.hud.classList.remove('hidden');
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
        this.lastTime = timeStamp;

        if (this.currentState === this.STATES.PLAYING) {

            // Screen Shake Transform
            this.ctx.save(); // Save before clearing/drawing
            if (this.shakeTimer > 0) {
                this.shakeTimer -= deltaTime;
                const dx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
                const dy = (Math.random() - 0.5) * 2 * this.shakeIntensity;
                this.ctx.translate(dx, dy);
            }

            this.ctx.clearRect(0, 0, this.width, this.height);


            // Slow Mo Logic
            if (this.slowMoTimer > 0) {
                this.slowMoTimer -= deltaTime; // Reduce by real time
                this.slowValUI.innerText = (this.slowMoTimer / 1000).toFixed(1);
                if (this.slowMoTimer <= 0) {
                    this.slowMoTimer = 0;
                    this.timeScale = 1.0;
                    this.powerUpTimerUI.classList.add('hidden');
                }
            }

            // Apply scale to game entities
            const gameDelta = deltaTime * this.timeScale;

            // Updates
            this.difficultyManager.update(gameDelta);
            this.player.update(deltaTime); // Player moves in real-time
            this.obstacleManager.update(gameDelta);
            if (!this.player.isDead) {
                this.scoreManager.update(gameDelta);
            }

            // Update Floating Texts
            this.floatingTexts.forEach(ft => {
                ft.y += ft.vy * deltaTime;
                ft.life -= deltaTime;
                ft.alpha = ft.life / ft.maxLife;
            });
            this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);



            // PowerUpManager Update:
            this.powerUpManager.update(deltaTime);

            // Collisions
            if (!this.player.isDead && !this.player.isInvulnerable && this.obstacleManager.checkCollision(this.player)) {
                this.player.explode();
                this.triggerShake(500, 10); // Shake for 0.5s
                // Play Death Sound
                this.deathSound.currentTime = 0;
                this.deathSound.play().catch(e => console.log("SFX play failed:", e));

                // Delay Game Over to show explosion
                setTimeout(() => {
                    this.gameOver();
                }, 1500);
            }


            const powerUpHit = this.powerUpManager.checkCollision(this.player);
            if (powerUpHit) {
                if (powerUpHit instanceof ScorePowerUp) {
                    // Add 20 points
                    this.scoreManager.score += 20;
                    const prefix = this.localizationManager.getString('floating.score');
                    this.addFloatingText(this.player.x, this.player.y, prefix + "20", "#FFFF00");
                } else if (powerUpHit instanceof ShieldPowerUp) {
                    // Activate Shield (3 seconds)
                    this.player.activateShield(3000);
                } else if (powerUpHit instanceof SpeedPowerUp) {
                    // Activate Speed Boost (3 seconds)
                    this.player.activateSpeedBoost(3000);
                    const prefix = this.localizationManager.getString('floating.score'); // Reuse or add new text?
                    // Optional: Float a "SPEED!" text
                    this.addFloatingText(this.player.x, this.player.y, "SPEED UP!", "#ADD8E6");
                } else {
                    // Default PowerUp (Slow Mo)
                    this.activateSlowMo();
                }

                this.powerUpManager.remove(powerUpHit);

                // Play sound for all
                this.powerUpSound.currentTime = 0;
                this.powerUpSound.play().catch(e => console.log("SFX play failed:", e));
            }

            // Draws
            this.player.draw(this.ctx);
            this.obstacleManager.draw(this.ctx);
            this.powerUpManager.draw(this.ctx);

            // Draw Floating Texts
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

            this.ctx.restore(); // Restore after shake
        }


        // Always draw score if playing or paused (behind menu)
        if (this.currentState === this.STATES.PLAYING || this.currentState === this.STATES.PAUSED) {
            // Optional: visual effects that run even when paused could go here
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }
    activateJakeSkin() {
        if (!this.skinManager.isUnlocked('jake', 0)) {
            localStorage.setItem('jake_secret_unlocked', 'true');
            // Force refresh of skins list if updated
            if (this.currentState === this.STATES.PLAYING) {
                this.addFloatingText(this.player.x, this.player.y, "SKIN UNLOCKED!", "#FFD700");
            }
        }

        this.player.activateJakeSkin();
        // Play success sound
        if (this.powerUpSound) {
            this.powerUpSound.currentTime = 0;
            this.powerUpSound.play().catch(e => { });
        }
    }

    toggleScreenSize() {
        const container = document.getElementById('game-container');
        // Remove current class
        if (this.currentSizeIndex !== 1) { // Normal has no specific class or default
            container.classList.remove(this.sizeClasses[this.currentSizeIndex]);
        }

        // Cycle index
        this.currentSizeIndex = (this.currentSizeIndex + 1) % 4;

        // Apply new class
        if (this.currentSizeIndex !== 1) {
            container.classList.add(this.sizeClasses[this.currentSizeIndex]);
        } else {
            // Normal size: remove others
            container.classList.remove('size-small');
            container.classList.remove('size-large');
        }

        // Update Button Text
        this.updateScreenSizeButton();

        // Play sound
        this.selectSound.currentTime = 0;
        this.selectSound.play().catch(e => { });
    }

    updateScreenSizeButton() {
        const btn = document.getElementById('btn-screen-size');
        const prefix = this.localizationManager.getString('settings.size');
        const sizeText = this.localizationManager.getString(this.sizeKeys[this.currentSizeIndex]);
        btn.innerText = prefix + sizeText;
    }
}
