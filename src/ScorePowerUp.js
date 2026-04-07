class ScorePowerUp {
    constructor(game) {
        this.game = game;
        this.width = 30;
        this.height = 30;
        this.markedForDeletion = false;
        this.color = '#ffff00'; // Yellow

        // Reuse spawn logic from PowerUp or duplicate it? 
        // Duplicate for now to keep it standalone or we could extend PowerUp.
        // Let's copy spawn logic for simplicity as base class isn't strict.
        this.spawn();
    }

    spawn() {
        const edge = Math.floor(Math.random() * 4);
        // Slower base speed usually

        switch (edge) {
            case 0: // Top
                this.x = Math.random() * this.game.width;
                this.y = -this.height;
                this.vx = (Math.random() - 0.5);
                this.vy = Math.random() * 1 + 0.5;
                break;
            case 1: // Right
                this.x = this.game.width;
                this.y = Math.random() * this.game.height;
                this.vx = -(Math.random() * 1 + 0.5);
                this.vy = (Math.random() - 0.5);
                break;
            case 2: // Bottom
                this.x = Math.random() * this.game.width;
                this.y = this.game.height;
                this.vx = (Math.random() - 0.5);
                this.vy = -(Math.random() * 1 + 0.5);
                break;
            case 3: // Left
                this.x = -this.width;
                this.y = Math.random() * this.game.height;
                this.vx = Math.random() * 1 + 0.5;
                this.vy = (Math.random() - 0.5);
                break;
        }
    }

    update(deltaTime) {
        const timeScale = deltaTime / 16.7;
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;

        if (this.x > this.game.width + 100 || this.x < -100 ||
            this.y > this.game.height + 100 || this.y < -100) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = this.game.settings.getShadowBlur(15);
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Draw as a diamond/square rotated maybe? or just Circle for consistency
        // User asked for "object with power up logic", let's stick to circle but Yellow
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
