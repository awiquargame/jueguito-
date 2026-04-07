class ExplosionEffect {
    constructor(game, x, y, color, width, height) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.width = width;
        this.height = height;
        this.markedForDeletion = false;
        this.isHarmless = true;

        this.fragments = [];
        this.spawnFragments();
    }

    spawnFragments() {
        if (!this.game.settings.shouldDrawParticles()) return;

        // Grid Shatter (3x3 grid)
        const cols = 3;
        const rows = 3;
        const pieceWidth = this.width / cols;
        const pieceHeight = this.height / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Initial position of the shard relative to the object
                const shardX = this.x + c * pieceWidth;
                const shardY = this.y + r * pieceHeight;

                // Velocity from center
                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;

                const shardCenterX = shardX + pieceWidth / 2;
                const shardCenterY = shardY + pieceHeight / 2;

                const angle = Math.atan2(shardCenterY - centerY, shardCenterX - centerX);
                const force = Math.random() * 5 + 2; // Explosive force

                const vx = Math.cos(angle) * force;
                const vy = Math.sin(angle) * force - 5; // Slight upward pop

                this.fragments.push(new Fragment(
                    this.game,
                    shardX,
                    shardY,
                    pieceWidth,
                    pieceHeight,
                    this.color,
                    vx,
                    vy
                ));
            }
        }
    }

    update(deltaTime) {
        this.fragments.forEach(f => f.update(deltaTime));
        this.fragments = this.fragments.filter(f => f.life > 0);

        if (this.fragments.length === 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        this.fragments.forEach(f => f.draw(ctx));
    }
}
