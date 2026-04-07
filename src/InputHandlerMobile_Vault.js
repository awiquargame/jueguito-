class InputHandlerMobileVault {
    // This code is vaulted for future APK development.
    // It contains the touch event listeners and joystick logic used in the mobile web version.

    /*
    constructor(game) {
        // ... (existing constructor properties)
        
        // Joystick properties
        this.joystickZone = document.getElementById('joystick-zone');
        this.joystickKnob = document.getElementById('joystick-knob');
        this.dashBtn = document.getElementById('btn-mobile-dash');
        this.joystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickTouchId = null;

        this.setupMobileControls();
    }

    setupMobileControls() {
        console.log("Setting up mobile controls...");
        // Dash Button
        this.dashBtn.addEventListener('touchstart', (e) => {
            console.log("Dash Touch Start", this.controlMode);
            e.preventDefault();
            if (this.controlMode !== 'mobile') return;
            this.keys.space = true;
            if (this.game.player) this.game.player.attemptDash();
        });

        this.dashBtn.addEventListener('touchend', (e) => {
            console.log("Dash Touch End");
            e.preventDefault();
            this.keys.space = false;
        });

        // Joystick Logic
        this.joystickZone.addEventListener('touchstart', (e) => {
            console.log("Joystick Touch Start", this.controlMode);
            e.preventDefault();
            if (this.controlMode !== 'mobile') return;

            const touch = e.changedTouches[0];
            this.joystickTouchId = touch.identifier;
            this.joystickActive = true;

            const rect = this.joystickZone.getBoundingClientRect();
            this.joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            // Console log center
            console.log("Joystick Center:", this.joystickCenter);

            this.handleJoystickMove(touch.clientX, touch.clientY);
        });

        this.joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystickActive) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystickTouchId) {
                    this.handleJoystickMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                    break;
                }
            }
        });

        const endJoystick = (e) => {
            console.log("Joystick Touch End");
            if (!this.joystickActive) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystickTouchId) {
                    this.joystickActive = false;
                    this.joystickTouchId = null;
                    this.joystickKnob.style.transform = `translate(-50%, -50%)`;
                    this.keys.up = false;
                    this.keys.down = false;
                    this.keys.left = false;
                    this.keys.right = false;
                    break;
                }
            }
        };

        this.joystickZone.addEventListener('touchend', endJoystick);
        this.joystickZone.addEventListener('touchcancel', endJoystick);

        // Mouse Support for Testing
        this.dashBtn.addEventListener('mousedown', (e) => {
            console.log("Dash Mouse Down", this.controlMode);
            e.preventDefault();
            if (this.controlMode !== 'mobile') return;
            this.keys.space = true;
            if (this.game.player) this.game.player.attemptDash();
        });
        this.dashBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.keys.space = false;
        });

        this.joystickZone.addEventListener('mousedown', (e) => {
            console.log("Joystick Mouse Down", this.controlMode);
            e.preventDefault();
            if (this.controlMode !== 'mobile') return;

            this.joystickActive = true;
            this.joystickTouchId = 'mouse';

            const rect = this.joystickZone.getBoundingClientRect();
            this.joystickCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            this.handleJoystickMove(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.joystickActive || this.joystickTouchId !== 'mouse') return;
            e.preventDefault();
            this.handleJoystickMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', (e) => {
            if (this.joystickActive && this.joystickTouchId === 'mouse') {
                this.joystickActive = false;
                this.joystickTouchId = null;
                this.joystickKnob.style.transform = `translate(-50%, -50%)`;
                this.keys.up = false;
                this.keys.down = false;
                this.keys.left = false;
                this.keys.right = false;
            }
        });
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
    */
}
