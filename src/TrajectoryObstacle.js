class TrajectoryObstacle {
    constructor(game) {
        this.game = game;
        this.color = '#ff8c00'; // Orange
        this.markedForDeletion = false;

        // Start Point (Random Edge)
        this.p1 = this.getRandomEdgePoint();

        // End Point (Direction through Player's CURRENT position)
        const playerX = this.game.player.x + this.game.player.width / 2;
        const playerY = this.game.player.y + this.game.player.height / 2;

        const dirX = playerX - this.p1.x;
        const dirY = playerY - this.p1.y;
        const length = Math.hypot(dirX, dirY);

        // Extend significantly to ensure it goes off screen (e.g., 2000px)
        const extension = 2000;
        this.p2 = {
            x: this.p1.x + (dirX / length) * extension,
            y: this.p1.y + (dirY / length) * extension
        };

        this.x = this.p1.x;
        this.y = this.p1.y;
        this.width = 40;
        this.height = 40;

        // States
        this.STATES = { WARNING: 0, DASH: 1, EXPLODE: 2 };
        this.state = this.STATES.WARNING;

        this.timer = 0;
        this.warningTime = 3000; // 3 seconds

        // Dash params
        // Dash params
        this.speed = 0;
        this.dashDuration = 0;
        this.totalDist = length + extension;

        this.particles = [];
    }

    getRandomEdgePoint() {
        // Return x,y on one of the 4 edges
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) return { x: Math.random() * this.game.width, y: -50 }; // Top
        if (edge === 1) return { x: this.game.width + 50, y: Math.random() * this.game.height }; // Right
        if (edge === 2) return { x: Math.random() * this.game.width, y: this.game.height + 50 }; // Bottom
        return { x: -50, y: Math.random() * this.game.height }; // Left
    }

    update(deltaTime) {
        this.timer += deltaTime;
        const timeScale = deltaTime / 16.7;

        if (this.state === this.STATES.WARNING) {
            // Wait
            if (this.timer >= this.warningTime) {
                this.state = this.STATES.DASH;
                this.timer = 0;

                // Calculate velocity for Dash
                const dx = this.p2.x - this.p1.x;
                const dy = this.p2.y - this.p1.y;
                const speed = 25; // Very fast
                const dist = Math.hypot(dx, dy);

                this.vx = (dx / dist) * speed;
                this.vy = (dy / dist) * speed;
            }

        } else if (this.state === this.STATES.DASH) {
            // Move
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;

            // Spawn intense particles
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: this.x + this.width / 2 + (Math.random() * 20 - 10),
                    y: this.y + this.height / 2 + (Math.random() * 20 - 10),
                    vx: -this.vx / 2 + (Math.random() * 4 - 2),
                    vy: -this.vy / 2 + (Math.random() * 4 - 2),
                    life: 400,
                    maxLife: 400,
                    size: Math.random() * 6 + 2,
                    color: this.color
                });
            }

            // Check if reached destination
            const currentDist = Math.hypot(this.x - this.p1.x, this.y - this.p1.y);
            if (currentDist >= this.totalDist) {
                this.state = this.STATES.EXPLODE;
                this.timer = 0;
                this.x = this.p2.x;
                this.y = this.p2.y;
                this.width = 100; // Expansion size
                this.height = 100;
            }

        } else if (this.state === this.STATES.EXPLODE) {
            // Explode lasts briefly
            if (this.timer > 300) { // 300ms explosion
                this.markedForDeletion = true;
            }
        }

        // Update Particles
        this.particles.forEach(p => {
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw(ctx) {
        ctx.save();

        // Draw Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;

        if (this.state === this.STATES.WARNING) {
            // Draw Blinking Line
            if (Math.floor(this.timer / 200) % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(this.p1.x, this.p1.y);
                ctx.lineTo(this.p2.x, this.p2.y);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 4;
                ctx.setLineDash([20, 10]);
                ctx.stroke();
            }
        } else if (this.state === this.STATES.DASH) {
            // Draw Enemy
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else if (this.state === this.STATES.EXPLODE) {
            // Draw Explosion
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 1 - (this.timer / 300); // Fade out
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
