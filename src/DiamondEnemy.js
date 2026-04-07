class DiamondEnemy {
    constructor(game, color) {
        this.game = game;
        this.width = 40;
        this.height = 40;
        this.markedForDeletion = false;
        this.color = color || '#0000FF'; // Default Blue
        this.isHarmless = false;

        // State Machine
        this.state = 'ENTERING'; // ENTERING, AIMING, SHOOTING, LEAVING
        this.timer = 0;

        this.enterDuration = 1000;
        this.aimDuration = 1000;
        this.shootDelay = 500;

        this.blinkTimer = 0;

        this.spawn();
    }

    spawn() {
        // Spawn at random edge
        const edge = Math.floor(Math.random() * 4);
        const advanceDistance = 150; // "Advance a little"

        switch (edge) {
            case 0: // Top
                this.x = Math.random() * (this.game.width - this.width);
                this.y = -this.height;
                this.targetX = this.x;
                this.targetY = advanceDistance;
                break;
            case 1: // Right
                this.x = this.game.width;
                this.y = Math.random() * (this.game.height - this.height);
                this.targetX = this.game.width - advanceDistance;
                this.targetY = this.y;
                break;
            case 2: // Bottom
                this.x = Math.random() * (this.game.width - this.width);
                this.y = this.game.height;
                this.targetX = this.x;
                this.targetY = this.game.height - advanceDistance;
                break;
            case 3: // Left
                this.x = -this.width;
                this.y = Math.random() * (this.game.height - this.height);
                this.targetX = advanceDistance;
                this.targetY = this.y;
                break;
        }

        // Calculate velocity to reach target in enterDuration
        this.vx = (this.targetX - this.x) / (this.enterDuration / 16.7);
        this.vy = (this.targetY - this.y) / (this.enterDuration / 16.7);
    }

    update(deltaTime) {
        this.timer += deltaTime;

        if (this.state === 'ENTERING') {
            // Clamp deltaTime to prevent teleporting on lag spikes (max 100ms per frame)
            const safeDelta = Math.min(deltaTime, 100);
            this.x += this.vx * (safeDelta / 16.7);
            this.y += this.vy * (safeDelta / 16.7);

            if (this.timer >= this.enterDuration) {
                this.state = 'AIMING';
                this.timer = 0;
                // Snap to target
                this.x = this.targetX;
                this.y = this.targetY;
            }
        } else if (this.state === 'AIMING') {
            this.blinkTimer += deltaTime;
            if (this.timer >= this.aimDuration) {
                this.state = 'SHOOTING';
                this.timer = 0;
                this.shoot();
            }
        } else if (this.state === 'SHOOTING') {
            if (this.timer >= this.shootDelay) {
                this.markedForDeletion = true; // Or leave? "Acto seguido disparar" implies done?
                // Use particle explosion to disappear?
                this.game.obstacleManager.triggerShieldExplosion(this); // Visual pop
            }
        }
    }

    shoot() {
        // Shoot 3 bullets "in a row" (Sequential stream)
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 }   // Right
        ];

        directions.forEach(dir => {
            const speed = 5;
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const projectileColor = '#00008B'; // Dark Blue

            // Shoot 3 bullets in sequence
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (!this.markedForDeletion) {
                        this.game.obstacleManager.addProjectile(
                            new Projectile(this.game, cx, cy, dir.x * speed, dir.y * speed, projectileColor)
                        );
                    }
                }, i * 200); // 200ms delay between bullets
            }
        });
    }

    setDestination(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;

        // Recalculate Velocity
        this.timer = 0;
        this.state = 'ENTERING';
        this.vx = (this.targetX - this.x) / (this.enterDuration / 16.7);
        this.vy = (this.targetY - this.y) / (this.enterDuration / 16.7);
    }

    draw(ctx) {
        ctx.save();

        // Draw Aiming Cross
        if (this.state === 'AIMING') {
            // Flash effect
            if (Math.floor(this.blinkTimer / 100) % 2 === 0) {
                ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
                ctx.lineWidth = 2;
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;

                ctx.beginPath();
                // Horizontal
                ctx.moveTo(0, cy);
                ctx.lineTo(this.game.width, cy);
                // Vertical
                ctx.moveTo(cx, 0);
                ctx.lineTo(cx, this.game.height);
                ctx.stroke();
            }
        }

        // Draw Rhombus
        ctx.fillStyle = this.color;

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Rotate if needed, or just draw shape
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2); // Top
        ctx.lineTo(this.width / 2, 0);   // Right
        ctx.lineTo(0, this.height / 2);  // Bottom
        ctx.lineTo(-this.width / 2, 0);  // Left
        ctx.closePath();
        ctx.fill();

        // Glow
        ctx.shadowBlur = this.game.settings.getShadowBlur(10);
        ctx.shadowColor = this.color;
        ctx.stroke();

        ctx.restore();
    }
}
