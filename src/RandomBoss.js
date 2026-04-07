class RandomBoss extends Boss {
    constructor(game, difficultyLevel = 1) {
        // Pass a dummy type, we will override everything
        super(game, 'red');

        this.difficultyLevel = difficultyLevel;

        // --- Random Appearance ---
        this.color = this.getRandomColor();
        this.shape = this.getRandomShape();
        this.name = `JEFE ${difficultyLevel}`;

        // --- Random Stats (Scaling) ---
        // Base Health: 3 + 1 per level
        this.maxHealth = 3 + Math.floor(difficultyLevel * 0.5);
        this.health = this.maxHealth;

        // Speed: 2 + tiny increment
        this.speed = 2 + Math.min(3, difficultyLevel * 0.1);
        this.vx = this.speed;

        // --- Attack Pool Generation ---
        // We select 2-3 distinct attacks for this specific boss instance
        this.attackPool = this.generateAttackPool();

        // Attack Interval gets slightly faster
        this.attackInterval = Math.max(2000, 4000 - (difficultyLevel * 100));

        // --- Minion Pool ---
        // --- Minion Pool ---
        // Ensure classes are defined before using
        const safeMinions = [
            (typeof Obstacle !== 'undefined' ? Obstacle : null),
            (typeof HeavyObstacle !== 'undefined' ? HeavyObstacle : null),
            (typeof ChargerObstacle !== 'undefined' ? ChargerObstacle : null),
            (typeof TrajectoryObstacle !== 'undefined' ? TrajectoryObstacle : null),
            (typeof ExplodingEnemy !== 'undefined' ? ExplodingEnemy : null),
            (typeof DiamondEnemy !== 'undefined' ? DiamondEnemy : null)
        ].filter(type => type !== null);

        // Shuffle and pick 2
        this.minionTypes = safeMinions.length > 0
            ? safeMinions.sort(() => 0.5 - Math.random()).slice(0, 2)
            : [];
    }

    getRandomColor() {
        const colors = [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
            '#ff8000', '#800080', '#008080', '#ffc0cb', '#ffffff'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRandomShape() {
        const shapes = ['square', 'triangle', 'rhombus', 'pentagon', 'hexagon'];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }

    generateAttackPool() {
        const pool = [];
        const possibleAttacks = ['spawn_minions', 'dash', 'smash', 'laser', 'special_burst', 'star_burst', 'explosion_ring'];

        // Pick 2 or 3 unique attacks
        const count = 2 + (Math.random() > 0.5 ? 1 : 0);

        while (pool.length < count) {
            const pick = possibleAttacks[Math.floor(Math.random() * possibleAttacks.length)];
            if (!pool.includes(pick)) {
                pool.push(pick);
            }
        }
        return pool;
    }

    // Override Attack Logic
    attack() {
        try {
            // Telegraph
            this.addFloatingText("ATTACK!", this.color);

            if (!this.attackPool || this.attackPool.length === 0) return;

            // Pick random attack from OUR pool
            const attackType = this.attackPool[Math.floor(Math.random() * this.attackPool.length)];

            switch (attackType) {
                case 'spawn_minions':
                    this.spawnRandomMinions();
                    break;
                case 'dash':
                    this.startDashAttack();
                    break;
                case 'smash':
                    this.startSmashAttack();
                    break;
                case 'laser':
                    this.startLaserAttack();
                    break;
                case 'special_burst':
                    this.startSpecialAttack();
                    break;
                case 'star_burst':
                    this.startStarBurst();
                    break;
                case 'explosion_ring':
                    this.startExplosionRing();
                    break;
            }
        } catch (e) {
            console.error("Error in RandomBoss attack:", e);
        }
    }

    spawnRandomMinions() {
        if (!this.minionTypes || this.minionTypes.length === 0) return;

        // Spawn 2-3 random enemies
        const count = 2 + Math.floor(Math.random() * 2);
        const types = this.minionTypes;

        for (let i = 0; i < count; i++) {
            try {
                const TypeClass = types[Math.floor(Math.random() * types.length)];
                if (!TypeClass) continue;

                const obs = new TypeClass(this.game);

                // Random position near boss
                obs.x = this.x + (Math.random() * this.width);
                obs.y = this.y + this.height;

                // Colorize Minion
                obs.color = this.color;

                this.game.obstacleManager.obstacles.push(obs);
            } catch (e) {
                console.error("Failed to spawn minion in RandomBoss:", e);
            }
        }
    }

    die() {
        this.game.triggerBossDeath();
    }

    // --- NEW ATTACKS FROM Bosses 5-9 ---

    startStarBurst() {
        this.addFloatingText("STARS!", this.color);
        const points = 8;
        const speed = 7;
        for (let i = 0; i < points; i++) {
            const a = (Math.PI * 2 * i) / points;
            const vx = Math.cos(a) * speed;
            const vy = Math.sin(a) * speed;
            const proj = new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2, vx, vy, this.color);
            this.game.obstacleManager.addProjectile(proj);
        }
    }

    startExplosionRing() {
        this.addFloatingText("BOOM!", this.color);
        const count = 8;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const radius = 80;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const ex = new ExplodingEnemy(this.game);
            const sx = cx + Math.cos(angle) * radius;
            const sy = cy + Math.sin(angle) * radius;

            ex.x = sx - ex.width / 2;
            ex.y = sy - ex.height / 2;
            ex.vx = Math.cos(angle) * 5;
            ex.vy = Math.sin(angle) * 5;
            ex.moveDuration = 600;
            ex.color = this.color;

            this.game.obstacleManager.obstacles.push(ex);
        }
    }
}
