
class Player {
    constructor(game) {
        this.game = game;
        this.width = 24;
        this.height = 24;
        this.x = 0;
        this.y = 0;

        // Base Speed + Upgrade Multiplier
        // Default base is 0.5. Multiplier starts at 1.0
        this.baseSpeed = 0.4;
        this.speed = this.baseSpeed * (this.game.upgradeManager ? this.game.upgradeManager.getMultiplier() : 1.0);

        // Jelly Effect Props
        this.scaleX = 1;
        this.scaleY = 1;

        // Dash Props
        this.canDash = true;
        this.dashCooldown = 0;
        this.dashMaxCooldown = 2000;
        this.isDashing = false;
        this.dashDuration = 150; // Shortened from 200
        this.dashTimer = 0;
        this.isInvulnerable = false;
        this.ghosts = [];

        // Movement Memory
        this.lastMoveX = 1; // Default right
        this.lastMoveY = 0;
        this.dashVelX = 0;
        this.dashVelY = 0;

        this.particles = [];
        this.updateColor();

        // JAKE Skin Prop (Removed)
        this.skinImage = null;

        // Speed PowerUp Props
        this.speedMultiplier = 1.0;
        this.speedBoostTimer = 0;

        // Lives (Hearts)
        this.lives = 0;
        this.maxLives = 3;

        this.reset();
    }

    addHeart() {
        if (this.lives < this.maxLives) {
            this.lives++;
        }
    }

    loseHeart() {
        if (this.lives > 0) {
            this.lives--;
            return true; // Survived
        }
        return false; // Died
    }

    drawHearts(ctx) {
        if (this.lives <= 0) return;

        ctx.fillStyle = '#ff69b4';
        const heartSize = 10;
        const startX = this.x + this.width / 2 - ((this.lives - 1) * (heartSize + 5)) / 2;
        const startY = this.y - 15;

        for (let i = 0; i < this.lives; i++) {
            const x = startX + i * (heartSize + 5);
            const y = startY;

            // Draw Mini Heart
            ctx.beginPath();
            ctx.moveTo(x, y + heartSize * 0.3);
            ctx.bezierCurveTo(x + heartSize / 2, y - heartSize / 2, x + heartSize / 2, y - heartSize, x, y - heartSize * 0.5);
            ctx.bezierCurveTo(x - heartSize / 2, y - heartSize, x - heartSize / 2, y - heartSize / 2, x, y + heartSize * 0.3);
            ctx.fill();
        }
    }

    updateColor() {
        if (this.game.skinManager) {
            const skin = this.game.skinManager.getCurrentSkin();
            this.color = skin ? skin.color : '#00FFFF';
        } else {
            this.color = '#00FFFF';
        }
        this.skinImage = null;
    }

    updateSpeed() {
        if (!this.game.upgradeManager) return;
        let mult = this.game.upgradeManager.getMultiplier();
        this.speed = this.baseSpeed * mult;

        if (this.game.upgradeManager.hasExtraSpeed) {
            this.speed += 0.1; // Small boost (approx 20% of base)
        }

        // Adrenaline (Dynamic Speed) Logic
        if (this.game.upgradeManager.getEquipped('speed') === 'adrenaline') {
            // Base Adrenaline Speed
            let adrenalineMult = 0.7;

            // Bonus per 100 points above 300
            if (this.game.scoreManager.score >= 300) {
                const bonusSteps = Math.floor((this.game.scoreManager.score - 300) / 100);
                adrenalineMult += (bonusSteps * 0.1);
            }

            // Apply to multiplier (replaces base speed logic effectively or multiplies it)
            // The user said: "until 300 have x0.7". This implies total speed multiplier.
            // If we multiply existing 'mult' (which includes upgrades), it stacks.
            // "mult" is base upgrades (1.0 -> 1.6). 
            // If we multiply THAT by 0.7, a fully upgraded player (1.6) starts at 1.12.
            // That feels fair.
            // But if the user meant "Absolute x0.7", then upgrades don't matter?
            // Usually upgrades should matter. So I will multiply the final speed.
            this.speed *= adrenalineMult;
        }

        // Also update dash cooldown if needed here, or separate method
        const baseDashCooldown = 2000;
        this.dashMaxCooldown = baseDashCooldown * this.game.upgradeManager.getDashMultiplier();
    }

    reset() {
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height / 2 - this.height / 2;
        this.scaleX = 1;
        this.scaleY = 1;
        this.particles = [];
        this.ghosts = [];
        this.dashCooldown = 0;
        this.isDashing = false;
        this.isInvulnerable = false;
        this.isDead = false; // Reset dead state

        // Shield Props
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.lives = 0;

        // Reset Speed from Upgrades
        // Base is 0.5. Upgrades multiply this.
        // Extra purchase adds +0.2 (Small boost)
        this.updateSpeed();

        // Reset Dash Cooldown from Upgrades
        // Base is 2000ms. Multiplier starts at 1.0 and goes down to 0.75
        const baseDashCooldown = 2000;
        this.dashMaxCooldown = baseDashCooldown * (this.game.upgradeManager ? this.game.upgradeManager.getDashMultiplier() : 1.0);


        this.lastMoveX = 1;
        this.lastMoveY = 0;
        this.dashVelX = 0;
        this.dashVelY = 0;

        // Physics / Drift
        this.vx = 0;
        this.vy = 0;
    }

    attemptDash() {
        if (this.dashCooldown <= 0) {
            this.startDash();
        }
    }

    startDash() {
        this.isDashing = true;
        this.isInvulnerable = true;
        this.dashCooldown = this.dashMaxCooldown;
        this.dashTimer = 0;

        // Play Dash Sound
        if (this.game.dashSound) {
            this.game.dashSound.currentTime = 0;
            this.game.dashSound.play().catch(e => { });
        }

        // Determine Dash Direction
        const input = this.game.input.keys;
        let dx = 0;
        let dy = 0;

        if (input.up) dy = -1;
        if (input.down) dy = 1;
        if (input.left) dx = -1;
        if (input.right) dx = 1;

        // If no input, use last known direction
        if (dx === 0 && dy === 0) {
            dx = this.lastMoveX;
            dy = this.lastMoveY;
        }

        // Normalize (simple version)
        if (dx !== 0 && dy !== 0) {
            // approximate normalization for diagonals so dash distance is consistent
            dx *= 0.707;
            dy *= 0.707;
        }

        this.dashVelX = dx;
        this.dashVelY = dy;

        // Sync physics velocity to dash direction so we exit dash with momentum
        // We use current maxSpeed (base * multiplier)
        const maxSpeed = this.speed * (this.speedMultiplier || 1.0);
        this.vx = dx * maxSpeed;
        this.vy = dy * maxSpeed;
    }

    activateShield(duration) {
        this.shieldActive = true;
        this.shieldTimer = duration;
        this.isInvulnerable = true;
    }

    takeDamage() {
        if (this.shieldActive || this.isInvulnerable || this.isDead) return;

        if (this.loseHeart()) {
            this.game.obstacleManager.triggerShieldExplosion({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                width: 100, height: 100
            });
            this.game.triggerShake(200, 5);
            this.game.addFloatingText(this.x, this.y, "-♥", "#ff0000");
            this.activateShield(2000); // Temporary Invulnerability
        } else {
            // Die
            this.explode();
            this.game.triggerShake(500, 10);
            if (this.game.deathSound) {
                this.game.deathSound.currentTime = 0;
                this.game.deathSound.play().catch(e => { });
            }
            setTimeout(() => {
                this.game.gameOver();
            }, 1500);
        }
    }

    activateSpeedBoost(duration) {
        this.speedMultiplier = 2.0; // Double speed
        this.speedBoostTimer = duration;
    }


    update(deltaTime) {
        if (this.isDead) {
            // Only update particles
            this.particles.forEach(p => {
                p.vy += 0.25 * (deltaTime / 16); // Gravity
                p.x += p.vx * (deltaTime / 16);
                p.y += p.vy * (deltaTime / 16);
                p.life -= deltaTime;
                p.alpha = 1.0; // No fade
            });
            this.particles = this.particles.filter(p => p.life > 0);
            return;
        }

        const input = this.game.input.keys;

        // Update Speed dynamically (for Adrenaline ability)
        this.updateSpeed();

        // Dash State Management
        if (this.isDashing) {
            this.dashTimer += deltaTime;
            if (this.dashTimer > this.dashDuration) {
                this.isDashing = false;
                this.isInvulnerable = this.shieldActive; // Revert to shield state
            }
        }

        // Cooldown Management
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
            if (this.dashCooldown < 0) this.dashCooldown = 0;
        }

        // Shield Timer
        if (this.shieldActive) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                if (!this.isDashing) this.isInvulnerable = false;
            }
        }

        // Speed Boost Timer
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.speedMultiplier = 1.0;
                this.speedBoostTimer = 0;
            }
        }

        // Update UI
        const dashBar = document.getElementById('dash-bar');
        const mobileDashBtn = document.getElementById('btn-mobile-dash');
        const dashPct = 100 - (this.dashCooldown / this.dashMaxCooldown * 100);

        if (dashBar) {
            dashBar.style.width = dashPct + '%';
        }

        if (mobileDashBtn) {
            if (this.dashCooldown > 0) {
                mobileDashBtn.classList.add('cooldown');
            } else {
                mobileDashBtn.classList.remove('cooldown');
            }
        }

        let moveX = 0;
        let moveY = 0;
        let moving = false;

        if (this.isDashing) {

            // Move based on locked Dash Direction
            // Dash speed multiplier: 4x
            const dashSpeed = this.speed * 4;
            this.x += this.dashVelX * dashSpeed * deltaTime;
            this.y += this.dashVelY * dashSpeed * deltaTime;

            moveX = this.dashVelX;
            moveY = this.dashVelY;
            moving = true; // Always "moving" when dashing

        } else {
            // Standard Movement (No Drift)
            const velocity = this.speed * this.speedMultiplier * deltaTime;

            if (input.up) { this.y -= velocity; moveY = -1; moving = true; }
            if (input.down) { this.y += velocity; moveY = 1; moving = true; }
            if (input.left) { this.x -= velocity; moveX = -1; moving = true; }
            if (input.right) { this.x += velocity; moveX = 1; moving = true; }

            // Reset physics velocity (unused in standard mode but good to clear)
            this.vx = 0;
            this.vy = 0;

            // Update Memory ONLY when actually moving
            if (moving) {
                // Determine raw direction for memory
                let lastX = 0;
                let lastY = 0;
                if (input.up) lastY = -1;
                if (input.down) lastY = 1;
                if (input.left) lastX = -1;
                if (input.right) lastX = 1;

                // Only update if we have a direction (which we should if moving is true)
                if (lastX !== 0 || lastY !== 0) {
                    this.lastMoveX = lastX;
                    this.lastMoveY = lastY;
                }
            }
        }

        // Jelly Logic
        let targetScaleX = 1;
        let targetScaleY = 1;

        // Initialize rotation if not exists
        if (typeof this.rotation === 'undefined') this.rotation = 0;

        if (moving) {
            // Stretch along the axis of movement
            targetScaleX = 1.3; // Length
            targetScaleY = 0.7; // Width

            // Calculate target rotation based on movement vector
            // We use atan2(y, x)
            const targetRotation = Math.atan2(moveY, moveX);

            // Smooth rotation (shortest path)
            let diff = targetRotation - this.rotation;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            this.rotation += diff * 0.2; // Lerp rotation
        } else {
            // Reset scales to normal when not moving
            // We keep rotation as is or let it stay at last angle
        }

        // Use lerp for smooth transition
        const lerpSpeed = 0.15;
        this.scaleX += (targetScaleX - this.scaleX) * lerpSpeed;
        this.scaleY += (targetScaleY - this.scaleY) * lerpSpeed;

        // Spawn Particles and Ghosts
        if (moving) {
            this.spawnParticles(moveX, moveY);
            if (this.isDashing) {
                // Spawn Ghost
                if (Math.random() < 0.8) { // Frequent ghosts
                    this.ghosts.push({
                        x: this.x,
                        y: this.y,
                        alpha: 0.6,
                        life: 200, // Short life
                        maxLife: 200,
                        scaleX: this.scaleX,
                        scaleY: this.scaleY,
                        color: this.color
                    });
                }
            }
        }

        // Update Particles
        this.particles.forEach(p => {
            p.x += p.vx * (deltaTime / 16);
            p.y += p.vy * (deltaTime / 16);
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Update Ghosts
        this.ghosts.forEach(g => {
            g.life -= deltaTime;
            g.alpha = (g.life / g.maxLife) * 0.6;
        });
        this.ghosts = this.ghosts.filter(g => g.life > 0);

        // Boundary checks
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > this.game.height) this.y = this.game.height - this.height;

        // Passive Particles for specific skins
        this.updatePassiveParticles(deltaTime);
    }

    updatePassiveParticles(deltaTime) {
        if (!this.game.skinManager || !this.game.settings.shouldDrawParticles()) return;
        const skin = this.game.skinManager.getCurrentSkin();
        if (!skin) return;

        // Only Supernova and God Mode get passive particles
        if (skin.id === 'supernova' || skin.id === 'god_mode') {
            if (typeof this.passiveTimer === 'undefined') this.passiveTimer = 0;
            this.passiveTimer += deltaTime;

            if (this.passiveTimer > 100) { // Every 100ms
                this.passiveTimer = 0;
                const isGod = skin.id === 'god_mode';
                const pColor = isGod ? '#FFFCB0' : '#FFD27F';

                for (let i = 0; i < 2; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 25;
                    this.particles.push({
                        x: this.x + this.width / 2 + Math.cos(angle) * dist,
                        y: this.y + this.height / 2 + Math.sin(angle) * dist,
                        vx: Math.cos(angle) * 0.5,
                        vy: Math.sin(angle) * 0.5,
                        life: 800,
                        maxLife: 800,
                        size: Math.random() * 4 + 2,
                        color: pColor,
                        isPassive: true
                    });
                }
            }
        }
    }

    spawnParticles(dirX, dirY) {
        if (!this.game.settings.shouldDrawParticles()) return;

        // Particle Quantity from ParticleManager
        const qtyMultiplier = this.game.particleManager ? this.game.particleManager.getCurrentQuantity().multiplier : 1.0;
        const count = Math.ceil((this.isDashing ? 5 : 2) * qtyMultiplier);

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() * 20 - 10),
                y: this.y + this.height / 2 + (Math.random() * 20 - 10),
                vx: -dirX * (Math.random() * 2 + 1) + (Math.random() - 0.5),
                vy: -dirY * (Math.random() * 2 + 1) + (Math.random() - 0.5),
                life: 300,
                maxLife: 300,
                size: (this.speedMultiplier > 1.0) ? (Math.random() * 10 + 5) : (Math.random() * 5 + 2),
                color: this.color
            });
        }
    }

    explode() {
        this.isDead = true;
        this.particles = []; // Clear existing trail particles

        if (!this.game.settings.shouldDrawParticles()) return;

        // Use the new ExplosionEffect for fragmentation
        // We pass the current color (which handles skins)
        let skin = null;
        if (this.game.skinManager) {
            skin = this.game.skinManager.getCurrentSkin();
        }
        const color = skin ? skin.color : this.color;

        this.game.obstacleManager.obstacles.push(new ExplosionEffect(
            this.game,
            this.x,
            this.y,
            color,
            this.width,
            this.height
        ));
    }

    activateShield(duration) {
        this.shieldActive = true;
        this.shieldTimer = duration;
        this.isInvulnerable = true;
    }

    activateSpeedBoost(duration) {
        this.speedMultiplier = 1.5;
        this.speedBoostTimer = duration;
    }

    draw(ctx) {
        ctx.save();

        // 1. Ghosts (Trail)
        if (this.game.settings.shouldDrawParticles()) {
            this.ghosts.forEach(g => {
                ctx.save();
                ctx.globalAlpha = g.alpha;
                ctx.translate(g.x + this.width / 2, g.y + this.height / 2);
                ctx.scale(g.scaleX, g.scaleY);
                if (g.rotation) ctx.rotate(g.rotation); // If we add rotation to ghosts

                // Ghost Color
                ctx.fillStyle = g.color;
                ctx.shadowBlur = this.game.settings.getShadowBlur(10);
                ctx.shadowColor = g.color;

                // Draw shape based on type? For now, just rect
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                ctx.restore();
            });
        }

        // 2. Dash Attack Indicator
        let applyRedTint = false;
        if (this.game.upgradeManager && this.game.upgradeManager.hasDashAttack && this.dashCooldown <= 0 && !this.isDashing) {
            const intensity = Math.sin(Date.now() / 100) * 0.5 + 0.5;
            if (intensity > 0.5) applyRedTint = true;
        }

        // 3. Particles
        if (this.game.settings.shouldDrawParticles()) {
            const particleShape = this.game.particleManager ? this.game.particleManager.currentShapeId : 'square';
            this.particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;

                if (particleShape === 'square') {
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                } else if (particleShape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(p.x + p.size / 2, p.y + p.size / 2, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (particleShape === 'triangle') {
                    this.drawPolygon(ctx, p.x + p.size / 2, p.y + p.size / 2, p.size / 2, 3);
                } else if (particleShape === 'star') {
                    this.drawStar(ctx, p.x + p.size / 2, p.y + p.size / 2, 5, p.size / 1.5, p.size / 3);
                } else if (particleShape === 'line') {
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
                    ctx.stroke();
                } else if (particleShape === 'neon_burst') {
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(p.x + p.size / 2, p.y + p.size / 2, p.size * (1 - p.alpha + 0.1) * 2, 0, Math.PI * 2);
                    ctx.stroke();
                    // Inner ring
                    ctx.beginPath();
                    ctx.arc(p.x + p.size / 2, p.y + p.size / 2, p.size * (1 - p.alpha + 0.1), 0, Math.PI * 2);
                    ctx.stroke();
                } else if (particleShape === 'glitch') {
                    if (Math.random() > 0.2) {
                        const ox = (Math.random() - 0.5) * 15;
                        const oy = (Math.random() - 0.5) * 15;
                        ctx.fillStyle = Math.random() > 0.5 ? '#ff0055' : '#00f3ff';
                        ctx.fillRect(p.x + ox, p.y + oy, p.size * 1.5, p.size * 0.5);
                    }
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                } else if (particleShape === 'pulse') {
                    const pulse = Math.sin(Date.now() / 100 + p.x) * 0.5 + 1.2;
                    ctx.fillRect(p.x - (p.size * pulse) / 2, p.y - (p.size * pulse) / 2, p.size * pulse, p.size * pulse);
                } else if (particleShape === 'speed_lines') {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    const angle = Math.atan2(p.vy, p.vx);
                    ctx.rotate(angle);
                    ctx.fillRect(0, -p.size / 6, p.size * 5, p.size / 3);
                    ctx.restore();
                }
                ctx.restore();
            });
        }
        ctx.globalAlpha = 1.0;

        // If dead, do not draw body
        if (this.isDead) {
            ctx.restore();
            return;
        }

        // 5. Determine Skin & Color
        let skin = null;
        if (this.game.skinManager) {
            skin = this.game.skinManager.getCurrentSkin();
        }

        let drawColor = skin ? skin.color : this.color;
        if (applyRedTint) drawColor = '#ff0000';

        // Now apply player-specific transforms for the main body
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (this.rotation) ctx.rotate(this.rotation);
        ctx.scale(this.scaleX, this.scaleY);

        ctx.shadowColor = drawColor;
        ctx.fillStyle = drawColor;

        // 6. Draw Main Body based on Skin Type
        const width = this.width;
        const height = this.height;

        if (skin && skin.type === 'shape') {
            switch (skin.shape) {
                case 'triangle':
                    this.drawPolygon(ctx, 0, 0, width / 2, 3);
                    break;
                case 'diamond':
                    // Rotate 45 degrees for diamond if not already handled by body rotation
                    ctx.save();
                    ctx.rotate(Math.PI / 4);
                    this.drawPolygon(ctx, 0, 0, width / 1.5, 4);
                    ctx.restore();
                    break;
                case 'pentagon':
                    this.drawPolygon(ctx, 0, 0, width / 1.8, 5);
                    break;
                case 'hexagon':
                    this.drawPolygon(ctx, 0, 0, width / 2, 6);
                    break;
                case 'heptagon':
                    this.drawPolygon(ctx, 0, 0, width / 2, 7);
                    break;
                case 'star':
                    this.drawStar(ctx, 0, 0, 5, width / 1.5, width / 3);
                    break;
                default:
                    ctx.fillRect(-width / 2, -height / 2, width, height);
            }
        } else if (skin && skin.type === 'animated') {
            // Elemental / Animated logic
            ctx.fillRect(-width / 2, -height / 2, width, height);

            // Flowing inner core
            const pulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;
            ctx.save();
            ctx.globalAlpha = 0.6 * pulse;
            ctx.fillStyle = '#ffffff';

            if (skin.id === 'magma') ctx.fillStyle = '#ffcc00';
            if (skin.id === 'plasma') ctx.fillStyle = '#ff00ff';
            if (skin.id === 'biolum') ctx.fillStyle = '#00ffcc';
            if (skin.id === 'arctic') ctx.fillStyle = '#00ffff';
            if (skin.id === 'necro') ctx.fillStyle = '#6600ff';

            ctx.fillRect(-width / 4, -height / 4, width / 2, height / 2);
            ctx.restore();
        } else if (skin && skin.type === 'special') {
            if (skin.id === 'matrix') {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(-width / 2, -height / 2, width, height);
                ctx.fillStyle = 'rgba(0, 20, 0, 0.8)';
                ctx.fillRect(-width / 2, -height / 2, width, height);
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(Math.floor(Math.random() * 2), -5, 5);
            } else if (skin.id === 'rainbow') {
                const hue = (Date.now() / 10) % 360;
                const rainbowColor = `hsl(${hue}, 100%, 50%)`;
                ctx.shadowColor = rainbowColor;
                ctx.fillStyle = rainbowColor;
                ctx.fillRect(-width / 2, -height / 2, width, height);
            } else if (skin.id === 'supernova' || skin.id === 'god_mode') {
                const isGod = skin.id === 'god_mode';
                const glowColor = isGod ? '#FFF700' : '#FFAA00';

                // Intense Glow Layers
                ctx.shadowBlur = 30;
                ctx.shadowColor = glowColor;
                ctx.fillStyle = glowColor;
                ctx.fillRect(-width / 2, -height / 2, width, height);

                // Extra Glow Pass
                ctx.shadowBlur = 60;
                ctx.fillRect(-width / 2, -height / 2, width, height);

                // Core Brightness
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 0.5;
                ctx.fillRect(-width / 2.5, -height / 2.5, width * 0.8, height * 0.8);
                ctx.globalAlpha = 1.0;
            } else if (skin.id === 'thunder') {
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(-width / 2, -height / 2, width, height);
                // Lightning cracks
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-width / 2, -height / 2);
                ctx.lineTo(0, height / 2);
                ctx.lineTo(width / 2, 0);
                ctx.stroke();
            } else if (skin.id === 'chronos') {
                const now = Date.now();
                const pulse = Math.sin(now / 300) * 0.2 + 0.8;

                // 1. Rotating Gears (Background)
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#006666';
                const gearRot = (now / 2000) % (Math.PI * 2);

                // Gear 1
                ctx.save();
                ctx.translate(-10, -10);
                ctx.rotate(gearRot);
                this.drawGear(ctx, 0, 0, 15, 6);
                ctx.restore();

                // Gear 2
                ctx.save();
                ctx.translate(12, 12);
                ctx.rotate(-gearRot * 1.5);
                this.drawGear(ctx, 0, 0, 10, 5);
                ctx.restore();
                ctx.restore();

                // 2. Main Body (Hex-like clock face)
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00FFFF';
                ctx.fillStyle = '#00AAAA';
                this.drawPolygon(ctx, 0, 0, width / 2, 6);

                // 3. Inner Dial
                ctx.fillStyle = '#003333';
                this.drawPolygon(ctx, 0, 0, width / 3, 6);

                // 4. Clock Hands (Moving fast)
                ctx.strokeStyle = '#ffffff';
                ctx.lineCap = 'round';

                // Hour Hand
                ctx.lineWidth = 3;
                const hourAngle = (now / 1000) % (Math.PI * 2);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(hourAngle) * (width / 3.5), Math.sin(hourAngle) * (width / 3.5));
                ctx.stroke();

                // Minute Hand
                ctx.lineWidth = 1.5;
                const minAngle = (now / 250) % (Math.PI * 2);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(minAngle) * (width / 2.5), Math.sin(minAngle) * (width / 2.5));
                ctx.stroke();

                // 5. Pulsing Core
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = pulse * 0.5;
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-width / 2, -height / 2, width, height);
            }
        } else {
            // Default / Color
            ctx.fillRect(-width / 2, -height / 2, width, height);

            // Standard "Face" or Detail (Removed for cleaner Neon look)
            // if (!applyRedTint) {
            //     ctx.fillStyle = 'rgba(255,255,255,0.8)';
            //     ctx.fillRect(-width / 2 + 5, -height / 2 + 10, width - 10, height / 4);
            // }
        }

        // 7. Shield Overlay
        ctx.restore(); // Undo transform for shield (to keep it circular)

        if (this.shieldActive) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

            ctx.strokeStyle = '#E0FFFF';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#E0FFFF';
            const radius = Math.max(this.width, this.height) / 1.3 + 5;

            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(224, 255, 255, 0.2)';
            ctx.fill();

            // Timer
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText((this.shieldTimer / 1000).toFixed(1) + 's', 0, -radius - 5);

            ctx.restore();
        }
    }

    drawPolygon(ctx, x, y, radius, sides) {
        if (sides < 3) return;
        const angle = (Math.PI * 2) / sides;
        // Offset rotation so polygons (like triangle) point upwards or aligned nicely
        const offset = -Math.PI / 2;

        ctx.beginPath();
        ctx.moveTo(x + radius * Math.cos(offset), y + radius * Math.sin(offset));
        for (let i = 1; i < sides; i++) {
            ctx.lineTo(x + radius * Math.cos(offset + i * angle), y + radius * Math.sin(offset + i * angle));
        }
        ctx.closePath();
        ctx.fill();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    drawGear(ctx, x, y, radius, teeth) {
        const step = (Math.PI * 2) / teeth;
        const toothSize = radius * 0.3;

        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const angle = i * step;
            // Draw tooth
            ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
            ctx.lineTo(x + (radius + toothSize) * Math.cos(angle + step * 0.25), y + (radius + toothSize) * Math.sin(angle + step * 0.25));
            ctx.lineTo(x + (radius + toothSize) * Math.cos(angle + step * 0.75), y + (radius + toothSize) * Math.sin(angle + step * 0.75));
            ctx.lineTo(x + radius * Math.cos(angle + step), y + radius * Math.sin(angle + step));
        }
        ctx.closePath();
        ctx.fill();

        // Inner hole
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}

