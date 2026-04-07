class DecagonBoss {
    constructor(game) {
        this.game = game;
        this.width = 120;
        this.height = 120;
        this.markedForDeletion = false;
        // Pink (#FFC0CB is pink, #FF69B4 is hotpink. User asked for "rosa")
        this.color = '#FF69B4';
        this.name = "DARKNESS DECAGON";
        this.visible = true; // Indispensable para colisiones

        this.health = 3;
        this.maxHealth = 3;

        // Vulnerability Cycle
        // "cada 20 segundos" -> 20s cycle
        this.isVulnerable = false;
        this.cycleTimer = 0;
        this.vulnerabilityDuration = 5000; // 5s to hit? Or until hit?
        // User: "Cuando se ponga modo vulnerable, parpadeara... aparecera enemigos azul oscuro"
        // User: "Una vez le pegues... la oscuridad vuelva a la normalidad... los enemigos van a desaparecer"
        // So vulnerability ends ON HIT.

        this.cycleInterval = 10000; // 10 seconds

        // Blink logic
        this.blinkState = false;
        this.blinkTimer = 0;
        this.blinkInterval = 100;

        // Spawn Timer
        this.guideSpawnTimer = 0;
        this.guideSpawnInterval = 1500; // 1.5 Seconds

        // PositionCenter
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height / 2 - this.height / 2;

        // Movement: Diamond Shape
        // Move diagonally, bounce off edges
        this.speed = 3; // Fast?
        this.vx = this.speed;
        this.vy = this.speed;

        this.angle = 0;

        this.game.bossActive = true;
        this.game.boss = this;
        this.game.bossIntroActive = true; // Let Game handle intro or custom?

        // Initial state
        this.state = 'ENTERING';
        this.enterY = 100;

        // Dark Mode Flag
        this.game.isDarknessLevel = true; // Trigger darkness in Game.js
    }

    update(deltaTime) {
        this.angle += 0.02 * (deltaTime / 16.7);

        // State Machine
        if (this.state === 'ENTERING') {
            // Move from top to center? Or just exist?
            // Let's glide in from top
            if (this.y < 100) {
                this.y += 2 * (deltaTime / 16.7);
            } else {
                this.state = 'ACTIVE';
                this.game.bossIntroActive = false;
            }
            return;
        }

        if (this.state === 'DYING') {
            this.angle += 0.5;
            return;
        }

        if (!this.isVulnerable) {
            // Diamond Movement Logic (Bouncing)
            // Check bounds (with some padding)
            const padding = 20;

            if (this.x <= padding) this.vx = Math.abs(this.vx);
            if (this.x + this.width >= this.game.width - padding) this.vx = -Math.abs(this.vx);
            if (this.y <= padding) this.vy = Math.abs(this.vy);
            if (this.y + this.height >= this.game.height - padding) this.vy = -Math.abs(this.vy);

            this.x += this.vx * (deltaTime / 16.7);
            this.y += this.vy * (deltaTime / 16.7);
        }


        // Cycle Logic
        if (!this.isVulnerable) {
            this.cycleTimer += deltaTime;
            if (this.cycleTimer >= this.cycleInterval) {
                this.startVulnerability();
            }
        } else {
            // Vulnerable State Duration Check
            this.cycleTimer += deltaTime;
            if (this.cycleTimer >= this.vulnerabilityDuration) {
                this.endVulnerability();
                return;
            }

            // Light Flicker
            this.blinkTimer += deltaTime;
            if (this.blinkTimer > this.blinkInterval) {
                this.blinkState = !this.blinkState;
                this.blinkTimer = 0;
            }

            // Spawn Guide Enemies (Timer based)
            this.guideSpawnTimer += deltaTime;
            if (this.guideSpawnTimer > this.guideSpawnInterval) {
                this.spawnGuideEnemy();
                this.guideSpawnTimer = 0;
            }
        }
    }

    startVulnerability() {
        this.isVulnerable = true;
        this.cycleTimer = 0;
        this.addFloatingText("LIGHT!", "#FFFF00");
    }

    endVulnerability() {
        this.clearEnemies();
        this.isVulnerable = false;
        this.cycleTimer = 0;
    }

    spawnGuideEnemy() {
        // "Enemigos azul oscuro... brillar"
        // Using DiamondEnemy with special glow flag? or New type?
        // User said "Blue Diamond" previously. Let's use DiamondEnemy but maybe set a property "guide"
        const obs = new DiamondEnemy(this.game); // Normal first
        obs.color = '#00008B'; // Dark Blue Override
        obs.isGuide = true; // Flag for Game.js renderer to draw "flashlight" around them

        // Use setDestination to spawn from boss
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        // Random edge target
        let tx, ty;
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { tx = Math.random() * this.game.width; ty = -50; }
        else if (edge === 1) { tx = this.game.width + 50; ty = Math.random() * this.game.height; }
        else if (edge === 2) { tx = Math.random() * this.game.width; ty = this.game.height + 50; }
        else { tx = -50; ty = Math.random() * this.game.height; }

        if (obs.setDestination) {
            obs.setDestination(cx, cy, tx, ty);
        } else {
            obs.x = cx; obs.y = cy;
        }

        this.game.obstacleManager.obstacles.push(obs);
    }

    takeDamage(bypass = false) {
        if ((!this.isVulnerable && !bypass) || this.state === 'DYING') return;

        this.health--;
        this.game.triggerShake(300, 10);
        this.addFloatingText("HIT!", "#FF0000");

        this.endVulnerability();

        if (this.health <= 0) {
            this.state = 'DYING';
            this.game.triggerBossDeath();
            this.game.isDarknessLevel = false; // Clear darkness
        }
    }

    clearEnemies() {
        // Explode only guide enemies or all? "todos los enemigos"
        this.game.obstacleManager.obstacles.forEach(obs => {
            // Explode them
            this.game.obstacleManager.triggerShieldExplosion(obs);
        });
        // Clear list done by triggerShieldExplosion setting markedForDeletion
        this.game.obstacleManager.projectiles.forEach(p => p.markedForDeletion = true);
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

        // Draw Decagon (10 sides)
        const sides = 10;
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
        if (this.state === 'DYING') return;

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
