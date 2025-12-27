class Projectile {
    constructor(game, x, y, vx, vy) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 10;
        this.height = 10;
        this.markedForDeletion = false;
        this.color = '#006400'; // Dark Green
    }

    update(deltaTime) {
        const timeScale = deltaTime / 16.7;
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;

        // Remove if out of bounds
        if (this.x < -50 || this.x > this.game.width + 50 ||
            this.y < -50 || this.y > this.game.height + 50) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
