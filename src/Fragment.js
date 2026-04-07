class Fragment {
    constructor(game, x, y, width, height, color, vx, vy) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = vx;
        this.vy = vy;

        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;

        this.life = 1000 + Math.random() * 500;
        this.maxLife = this.life;

        this.gravity = 0.5; // Stronger gravity for "heavy" shards
        this.friction = 0.98; // Air resistance
    }

    update(deltaTime) {
        // Physics
        this.x += this.vx * (deltaTime / 16);
        this.y += this.vy * (deltaTime / 16);
        this.vy += this.gravity * (deltaTime / 16);

        // Horizontal friction
        this.vx *= this.friction;

        // Rotation
        this.rotation += this.rotationSpeed * (deltaTime / 16);

        // Life
        this.life -= deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Neon Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Fade out
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);

        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.restore();
    }
}
