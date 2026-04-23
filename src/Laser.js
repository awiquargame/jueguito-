class Laser {
    constructor(game, x, y, angle, owner = null) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.angle = angle; // Radians
        this.owner = owner; // Reference to the object firing the laser
        this.width = 1000; // Long-range
        this.height = 6; // Thinner for new scale

        this.color = owner ? owner.color : '#ff8000'; // Orange default
        this.warningColor = owner ? this.game.settings.hexToRgba(owner.color, 0.3) : 'rgba(255, 128, 0, 0.3)';

        // Timers
        this.state = 'WARNING'; // WARNING -> ACTIVE
        this.warningDuration = 1000; // 1s warning
        this.activeDuration = 2000; // 2s active damage
        this.timer = 0;

        this.markedForDeletion = false;
        this.isHarmless = true; // Harmless during warning
    }

    update(deltaTime) {
        // Sync position with owner if it exists
        if (this.owner && !this.owner.markedForDeletion) {
            this.x = this.owner.x + this.owner.width / 2;
            this.y = this.owner.y + this.owner.height / 2;
        }

        this.timer += deltaTime;

        if (this.state === 'WARNING') {
            if (this.timer >= this.warningDuration) {
                this.state = 'ACTIVE';
                this.timer = 0;
                this.isHarmless = false;

                // Sound Effect
                // if (this.game.laserSound) this.game.laserSound.play();
            }
        } else if (this.state === 'ACTIVE') {
            if (this.timer >= this.activeDuration) {
                this.markedForDeletion = true;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.state === 'WARNING') {
            // Draw Warning Line (Thin/Transparent)
            ctx.fillStyle = this.warningColor;
            ctx.fillRect(0, -this.height / 2, this.width, this.height);

            // Pulsing effect?
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.width, 0);
            ctx.stroke();

        } else {
            // Draw Active Laser (Solid/Bright)
            ctx.shadowBlur = this.game.settings.getShadowBlur(10);
            ctx.shadowColor = this.color;
            ctx.fillStyle = '#ffffff'; // Core
            ctx.fillRect(0, -this.height / 4, this.width, this.height / 2);

            ctx.fillStyle = this.color; // Glow
            ctx.fillRect(0, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }
}
