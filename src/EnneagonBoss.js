class EnneagonBoss {
    constructor(game) {
        this.game = game;
        this.width = 110; // Slightly larger
        this.height = 110;
        this.markedForDeletion = false;
        // "Rosa tirando a morado" - Pink/Purple
        this.color = '#D02090'; // VioletRed 
        this.name = "REVIVAL ENNEAGON";
        this.visible = true; // Indispensable para colisiones

        this.health = 3;
        this.maxHealth = 3;

        // Vulnerability
        this.isVulnerable = false;
        this.vulnerabilityTimer = 0;
        this.vulnerabilityCooldown = 10000; // 10s
        this.vulnerabilityDuration = 3000; // 3s

        // Blink logic
        this.blinkState = false;
        this.blinkTimer = 0;

        // Position: Center X, Top Y start
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -150;

        // Movement tracking
        this.centerY = (this.game.height / 2) - (this.height / 2);
        this.amplitudeY = (this.game.height / 2) - 80; // Padding

        // Start angle at -PI/2 so sin(-PI/2) = -1 (Top position)
        // This makes y = centerY + (-1)*amplitude = centerY - amplitude ≈ Top
        this.movementAngle = -Math.PI / 2;

        this.moveSpeed = 1.5; // Vertical oscillation speed

        // State Machine
        this.state = 'ENTERING';
        this.timer = 0;

        // Attack Logic
        this.attackTimer = 0;
        this.attackInterval = 4000; // Attack every 4s
        this.summonHistory = []; // Track spawned enemy types for Revive

        // Special Attack State
        this.currentAttackType = 'NONE';
        this.actionTimer = 0;

        this.angle = 0; // Rotation

        this.game.bossActive = true;
        this.game.boss = this;
        this.game.bossIntroActive = true;

        // Intro handling override in Game usually calls triggerBossIntro, 
        // but here we set flag and let update handle entry or Game handle it. 
        // Standard: Game sets bossIntroActive. We just need to exist.
    }

    update(deltaTime) {
        // Generic Rotation
        this.angle += 0.02 * (deltaTime / 16.7);

        // Vulnerability Cycle
        if (this.state !== 'DYING' && this.state !== 'ENTERING') {
            if (!this.isVulnerable) {
                this.vulnerabilityTimer += deltaTime;
                if (this.vulnerabilityTimer >= this.vulnerabilityCooldown) {
                    this.startVulnerability();
                }
            } else {
                this.vulnerabilityTimer -= deltaTime;
                this.blinkTimer += deltaTime;
                if (this.blinkTimer > 100) {
                    this.blinkState = !this.blinkState;
                    this.blinkTimer = 0;
                }
                if (this.vulnerabilityTimer <= 0) {
                    this.endVulnerability();
                }
            }
        }

        switch (this.state) {
            case 'ENTERING':
                // Move down to starting top position of oscillation
                // y = centerY - amplitude
                const startY = this.centerY + Math.sin(this.movementAngle) * this.amplitudeY;

                if (this.y < startY) {
                    this.y += 3 * (deltaTime / 16.7); // Faster entry
                } else {
                    this.y = startY; // Snap
                    this.state = 'IDLE';
                    this.game.bossIntroActive = false;
                }
                break;

            case 'IDLE':
                // Vertical Movement (Up/Down in Center)
                this.movementAngle += (this.moveSpeed * Math.PI / 180) * (deltaTime / 16.7);
                // sin oscillates -1 to 1. 
                // We want to move between Top (e.g. 50) and Bottom (Height - 150).
                // Center + sin * amplitude
                this.y = this.centerY + Math.sin(this.movementAngle) * this.amplitudeY;

                // Attack Timer
                this.attackTimer += deltaTime;
                if (this.attackTimer >= this.attackInterval) {
                    // Check if we should revive (if we have history)
                    // Logic: 50/50? Or Revive after every few summons?
                    // "Attack special: Revive last 5 enemies"
                    // Let's make it random but favor summon if history is empty.
                    this.chooseAttack();
                    this.attackTimer = 0;
                }
                break;

            case 'ATTACKING':
                // Wait for attack animation/logic to finish
                this.actionTimer += deltaTime;
                if (this.actionTimer > 1000) { // Short pause for cast
                    this.state = 'IDLE';
                }
                break;

            case 'DYING':
                this.angle += 0.5;
                break;
        }
    }

    chooseAttack() {
        // If history is full enough (e.g. >= 3), chance to Revive
        let canRevive = this.summonHistory.length > 0;
        let rand = Math.random();

        this.state = 'ATTACKING';
        this.actionTimer = 0;

        if (canRevive && rand < 0.4) { // 40% chance to revive if possible
            this.reviveEnemies();
        } else {
            this.summonRandomEnemies();
        }
    }

    summonRandomEnemies() {
        this.addFloatingText("SUMMON!", "#FFFFFF");

        // 1 to 3 enemies
        const count = Math.floor(Math.random() * 3) + 1;

        // Types available
        const types = ['Obstacle', 'HeavyObstacle', 'ChargerObstacle', 'TrajectoryObstacle', 'ExplodingEnemy', 'DiamondEnemy'];

        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];

            // Add to history (keep max 5 to ensure we always have 3 for revive even if shifting)
            this.summonHistory.push(type);
            if (this.summonHistory.length > 5) this.summonHistory.shift();

            // Stagger spawns for visual clarity (allows duplicates to be distinct)
            setTimeout(() => {
                if (this.state !== 'DYING') {
                    this.spawnEnemy(type);
                }
            }, i * 300);
        }
    }

    reviveEnemies() {
        this.addFloatingText("REVIVE!", "#FF00FF");

        // Revive last 3 (or fewer if less exist)
        // Copy list to avoid issues if we modify history (we won't cleared it, just re-summon)
        // "Revivir a los últimos 3" - indicates summoning clones of them.
        const toRevive = this.summonHistory.slice(-3); // Get last 3

        toRevive.forEach((type, index) => {
            // Delay spawns slightly for visual flair?
            setTimeout(() => {
                this.spawnEnemy(type, true); // true for "Revived" visual?
            }, index * 200);
        });
    }

    spawnEnemy(type, isRevive = false) {
        let obs;
        // Factory
        // Using Game's existing classes
        const g = this.game;

        // Random X spawn (top) or side? 
        // "Invocar" usually implies appearing. Let's spawn at top random X.
        const startX = Math.random() * (g.width - 50);
        // Spawn inside screen (visible). Random Y between 50 and 300 (upper half)
        const startY = Math.random() * (g.height / 2 - 50) + 50;

        switch (type) {
            case 'Obstacle': obs = new Obstacle(g); break;
            case 'HeavyObstacle': obs = new HeavyObstacle(g); break;
            case 'ChargerObstacle': obs = new ChargerObstacle(g); break;
            case 'TrajectoryObstacle': obs = new TrajectoryObstacle(g, startX, startY); break;
            case 'ExplodingEnemy': obs = new ExplodingEnemy(g); break;
            case 'DiamondEnemy': obs = new DiamondEnemy(g); break;
            default: obs = new Obstacle(g);
        }

        // Override position to ensure they enter screen nicely
        // specific classes might overwrite x/y in constructor, so we overwrite here
        // Override position to ensure they enter screen nicely
        // specific classes might overwrite x/y in constructor, so we overwrite here
        if (type !== 'TrajectoryObstacle') {
            if (type === 'DiamondEnemy') {
                // Special smooth spawn for DiamondEnemy
                // Start at Boss Center
                const bossCX = this.x + this.width / 2;
                const bossCY = this.y + this.height / 2;
                obs.setDestination(bossCX, bossCY, startX, startY);
            } else {
                // Instant placement for others (or keep them "appearing")
                obs.x = startX;
                obs.y = startY;
            }
        }

        // Optional: Revive visual effect?
        if (isRevive) {
            // maybe flicker or set a specialized flag if needed
        }

        g.obstacleManager.obstacles.push(obs);
    }

    startVulnerability() {
        this.isVulnerable = true;
        this.vulnerabilityTimer = this.vulnerabilityDuration;
        this.addFloatingText("SHIELD OFF!", "#00FF00");
    }

    endVulnerability() {
        this.isVulnerable = false;
        this.vulnerabilityTimer = 0;
        this.blinkState = false;
        this.addFloatingText("SHIELD ON!", "#FF0000");
    }

    takeDamage(bypass = false) {
        if ((!this.isVulnerable && !bypass) || this.state === 'DYING') return;

        this.health--;
        this.game.triggerShake(300, 10);
        this.addFloatingText("HIT!", "#FF0000");
        this.endVulnerability(); // Close shield immediately on hit

        if (this.health <= 0) {
            this.state = 'DYING';
            this.game.triggerBossDeath();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        // Color
        if (this.isVulnerable && this.blinkState) {
            ctx.fillStyle = '#FFFFFF';
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.shadowBlur = this.game.settings.getShadowBlur(20);
        ctx.shadowColor = this.color;

        // Draw Enneagon (9 sides)
        const sides = 9;
        const radius = this.width / 2;

        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const theta = (Math.PI * 2 * i) / sides;
            const px = Math.cos(theta) * radius;
            const py = Math.sin(theta) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Inner decoration
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        const innerRadius = radius * 0.6;
        for (let i = 0; i < sides; i++) {
            const theta = (Math.PI * 2 * i) / sides;
            const px = Math.cos(theta) * innerRadius;
            const py = Math.sin(theta) * innerRadius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.fill();

        ctx.restore();

        this.drawHealthBar(ctx);
    }

    addFloatingText(text, color) {
        if (this.game && this.game.addFloatingText) {
            this.game.addFloatingText(this.x + this.width / 2, this.y, text, color);
        }
    }

    drawHealthBar(ctx) {
        // Standard Boss Health Bar
        if (this.state === 'DYING') return; // Fade out handled by Game usually, or keep it? Game handles global fade? 
        // Boss.js handles alpha. Let's copy simple logic.

        const barWidth = this.game.width * 0.8;
        const barHeight = 30;
        const barX = (this.game.width - barWidth) / 2;
        const barY = this.game.height - 50;

        ctx.save();
        // BG
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Fill
        const pct = this.health / this.maxHealth;
        // Segments
        const segmentWidth = (barWidth - (this.maxHealth - 1) * 5) / this.maxHealth;

        for (let i = 0; i < this.maxHealth; i++) {
            const bx = barX + i * (segmentWidth + 5);
            if (i < this.health) {
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(bx, barY, segmentWidth, barHeight);
            }
        }
        ctx.restore();
    }
}
