class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false,
            '1': false,
            '9': false
        };
        this.cheatTriggered = false;

        this.jakeKeys = { j: false, a: false, k: false, e: false };

        window.addEventListener('keydown', (e) => {
            const k = e.key.toLowerCase();

            // JAKE Detection
            if (this.jakeKeys.hasOwnProperty(k)) {
                this.jakeKeys[k] = true;
                if (this.jakeKeys.j && this.jakeKeys.a && this.jakeKeys.k && this.jakeKeys.e) {
                    this.game.activateJakeSkin();
                }
            }

            if (this.game.currentState === this.game.STATES.PLAYING ||
                this.game.currentState === this.game.STATES.MENU ||
                this.game.currentState === this.game.STATES.PAUSED) {

                switch (e.key.toLowerCase()) {
                    case 'w':
                    case 'arrowup':
                        this.keys.up = true;
                        break;
                    case 's':
                    case 'arrowdown':
                        this.keys.down = true;
                        break;
                    case 'a':
                    case 'arrowleft':
                        this.keys.left = true;
                        break;
                    case 'd':
                    case 'arrowright':
                        this.keys.right = true;
                        break;
                    case 'p':
                    case 'escape':
                        this.togglePause();
                        break;
                    case ' ':
                        this.keys.space = true;
                        if (this.game.player) this.game.player.attemptDash();
                        break;
                    case '1':
                        this.keys['1'] = true;
                        this.checkCheat();
                        break;
                    case '9':
                        this.keys['9'] = true;
                        this.checkCheat();
                        break;
                }
            }


        });

        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();
            if (this.jakeKeys.hasOwnProperty(k)) {
                this.jakeKeys[k] = false;
            }

            switch (k) {
                case 'w':
                case 'arrowup':
                    this.keys.up = false;
                    break;
                case 's':
                case 'arrowdown':
                    this.keys.down = false;
                    break;
                case 'a':
                case 'arrowleft':
                    this.keys.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = false;
                    break;
                case ' ':
                    this.keys.space = false;
                    break;
                case '1':
                    this.keys['1'] = false;
                    this.cheatTriggered = false; // Reset cheat flag
                    break;
                case '9':
                    this.keys['9'] = false;
                    this.cheatTriggered = false; // Reset cheat flag
                    break;
            }
        });
    }

    checkCheat() {
        if (this.keys['1'] && this.keys['9'] && !this.cheatTriggered) {
            this.game.scoreManager.score += 2000;
            this.cheatTriggered = true;
            console.log("Cheat activated: +2000 points");

            // Optional: Play a sound or visual feedback?
            if (this.game.powerUpSound) {
                this.game.powerUpSound.currentTime = 0;
                this.game.powerUpSound.play().catch(e => { });
            }
        }
    }
    togglePause() {
        if (this.game.currentState === this.game.STATES.PLAYING) {
            this.game.pause();
        } else if (this.game.currentState === this.game.STATES.PAUSED) {
            this.game.resume();
        }
    }
}
