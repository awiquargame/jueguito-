class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {
            up: false, down: false, left: false, right: false,
            space: false, 'p': false
        };
        
        this.controlMode = 'mobile';
        
        // Mobile properties
        this.joystickZone = document.getElementById('joystick-zone');
        this.joystickKnob = document.getElementById('joystick-knob');
        this.dashBtn = document.getElementById('btn-mobile-dash');
        this.joystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickTouchId = null;

        this.setupKeyboardControls();
        this.setupMobileControls();
    }

    setControlMode(mode) {
        this.controlMode = mode;
        const mobileUI = document.getElementById('mobile-controls');
        if (mobileUI) {
            if (mode === 'mobile') {
                mobileUI.classList.remove('hidden');
            } else {
                mobileUI.classList.add('hidden');
            }
        }
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            const k = e.key.toLowerCase();
            switch (k) {
                case 'w': case 'arrowup': this.keys.up = true; break;
                case 's': case 'arrowdown': this.keys.down = true; break;
                case 'a': case 'arrowleft': this.keys.left = true; break;
                case 'd': case 'arrowright': this.keys.right = true; break;
                case 'p': case 'escape': this.togglePause(); break;
                case ' ': this.keys.space = true; if (this.game.player) this.game.player.attemptDash(); break;
            }
        });

        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();
            switch (k) {
                case 'w': case 'arrowup': this.keys.up = false; break;
                case 's': case 'arrowdown': this.keys.down = false; break;
                case 'a': case 'arrowleft': this.keys.left = false; break;
                case 'd': case 'arrowright': this.keys.right = false; break;
                case ' ': this.keys.space = false; break;
            }
        });
    }

    setupMobileControls() {
        if (!this.joystickZone || !this.dashBtn) return;

        // Dash Button
        const handleDash = (e) => {
            e.preventDefault();
            this.keys.space = true;
            if (this.game.player) this.game.player.attemptDash();
            // Reset after short delay to simulate tap
            setTimeout(() => this.keys.space = false, 100);
        };

        this.dashBtn.addEventListener('touchstart', handleDash);
        this.dashBtn.addEventListener('mousedown', handleDash);

        // Joystick Logic
        const startJoystick = (e) => {
            e.preventDefault();
            
            const touch = e.type.includes('touch') ? e.changedTouches[0] : e;
            this.joystickTouchId = e.type.includes('touch') ? touch.identifier : 'mouse';
            this.joystickActive = true;

            const rect = this.joystickZone.getBoundingClientRect();
            this.joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            this.handleJoystickMove(touch.clientX, touch.clientY);
        };

        const moveJoystick = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();
            
            const touch = e.type.includes('touch') ? 
                Array.from(e.changedTouches).find(t => t.identifier === this.joystickTouchId) : e;
            
            if (touch) {
                this.handleJoystickMove(touch.clientX, touch.clientY);
            }
        };

        const endJoystick = (e) => {
            if (!this.joystickActive) return;
            this.joystickActive = false;
            this.joystickTouchId = null;
            if (this.joystickKnob) this.joystickKnob.style.transform = `translate(-50%, -50%)`;
            
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
        };

        this.joystickZone.addEventListener('touchstart', startJoystick);
        this.joystickZone.addEventListener('mousedown', startJoystick);
        
        window.addEventListener('touchmove', moveJoystick, { passive: false });
        window.addEventListener('mousemove', moveJoystick);
        
        window.addEventListener('touchend', endJoystick);
        window.addEventListener('mouseup', endJoystick);
    }

    handleJoystickMove(touchX, touchY) {
        if (!this.joystickZone) return;
        const rect = this.joystickZone.getBoundingClientRect();
        const maxDist = rect.width / 2;

        const deltaX = touchX - this.joystickCenter.x;
        const deltaY = touchY - this.joystickCenter.y;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);

        const clampedDist = Math.min(distance, maxDist);
        const moveX = Math.cos(angle) * clampedDist;
        const moveY = Math.sin(angle) * clampedDist;

        if (this.joystickKnob) {
            this.joystickKnob.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
        }

        // Update Keys based on angle (with deadzone)
        if (distance > 15) {
            const threshold = 0.4; // Diagonal sensitivity
            const normX = deltaX / distance;
            const normY = deltaY / distance;

            this.keys.right = normX > threshold;
            this.keys.left = normX < -threshold;
            this.keys.down = normY > threshold;
            this.keys.up = normY < -threshold;
        } else {
            this.keys.up = this.keys.down = this.keys.left = this.keys.right = false;
        }
    }

    togglePause() {
        if (this.game.currentState === this.game.STATES.PLAYING || this.game.currentState === this.game.STATES.COLOSSEUM) {
            this.game.pause();
        } else if (this.game.currentState === this.game.STATES.PAUSED) {
            this.game.resume();
        }
    }
}
