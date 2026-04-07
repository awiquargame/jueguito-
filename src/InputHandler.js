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
            '9': false,
            '2': false,
            '3': false,
            'p': false,
            'o': false,
            'f': false,
            'h': false,
            'j': false,
            'g': false,
            't': false,
            'v': false,
            'c': false
        };
        this.cheatBuffer = [];
        this.maxBufferLength = 10;

        // PC Controls Only
        this.controlMode = 'pc';

        window.addEventListener('keydown', (e) => {
            const k = e.key.toLowerCase();

            // Track last N keys for codes
            this.cheatBuffer.push(k);
            if (this.cheatBuffer.length > this.maxBufferLength) {
                this.cheatBuffer.shift();
            }

            if (this.game.currentState === this.game.STATES.PLAYING ||
                this.game.currentState === this.game.STATES.COLOSSEUM ||
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
                        if (!e.repeat) { // Prevent repeat if held
                            this.keys['p'] = true;
                            this.togglePause();
                        }
                        break;
                    case ' ':
                        this.keys.space = true;
                        if (this.game.player) this.game.player.attemptDash();
                        break;
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();

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
                case 'p':
                    this.keys['p'] = false;
                    break;
            }
        });
    }

    checkSequence(codeArray) {
        if (this.cheatBuffer.length < codeArray.length) return false;

        const startIdx = this.cheatBuffer.length - codeArray.length;
        for (let i = 0; i < codeArray.length; i++) {
            if (this.cheatBuffer[startIdx + i] !== codeArray[i]) {
                return false;
            }
        }
        return true;
    }

    togglePause() {
        if (this.game.currentState === this.game.STATES.PLAYING || this.game.currentState === this.game.STATES.COLOSSEUM) {
            this.game.pause();
        } else if (this.game.currentState === this.game.STATES.PAUSED) {
            this.game.resume();
        }
    }

    handleJoystickMove(touchX, touchY) {
        const rect = this.joystickZone.getBoundingClientRect();
        const maxDist = rect.width / 2;

        const deltaX = touchX - this.joystickCenter.x;
        const deltaY = touchY - this.joystickCenter.y;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);

        const clampedDist = Math.min(distance, maxDist);

        const moveX = Math.cos(angle) * clampedDist;
        const moveY = Math.sin(angle) * clampedDist;

        this.joystickKnob.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;

        // Update Keys based on angle
        // Deadzone check
        if (distance > 10) {
            this.keys.right = Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0;
            this.keys.left = Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0;
            this.keys.down = Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0;
            this.keys.up = Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0;
        } else {
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
        }
    }
}
