class BoxManager {
    constructor(game) {
        this.game = game;
        this.overlay = document.getElementById('box-overlay');
        this.boxElement = document.getElementById('loot-box');
        this.revealElement = document.getElementById('box-item-reveal');
        this.btnClaim = document.getElementById('btn-claim-box');
        
        this.itemIcon = document.getElementById('box-item-icon');
        this.itemName = document.getElementById('box-item-name');
        this.itemRarity = document.getElementById('box-item-rarity');
        this.rarityGlow = document.getElementById('box-rarity-glow');

        if (!this.overlay) console.error("BoxManager: Overlay not found in DOM!");
        if (!this.boxElement) console.error("BoxManager: Box element not found in DOM!");

        this.isOpening = false;
        this.currentReward = null;
        this.boxesToOpen = 0;

        this.setupListeners();
    }

    setupListeners() {
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                console.log("BoxManager: Overlay Clicked", e.target);
                // If clicking the overlay and it's not the claim button, open the box
                if (e.target.id !== 'btn-claim-box' && !this.isOpening) {
                    console.log("BoxManager: Triggering openBoxAnimation from overlay");
                    this.openBoxAnimation();
                }
            });
        }
        if (this.boxElement) {
            this.boxElement.addEventListener('click', (e) => {
                console.log("BoxManager: Box Icon Clicked");
                e.stopPropagation();
                this.openBoxAnimation();
            });
        }
        if (this.btnClaim) {
            this.btnClaim.addEventListener('click', (e) => {
                console.log("BoxManager: Claim Button Clicked");
                e.stopPropagation();
                this.claimReward();
            });
        }
    }

    enqueueBoxes(count) {
        this.boxesToOpen = count;
        if (count > 0) {
            this.showOverlay();
        }
    }

    showOverlay() {
        // Double check elements in case they were late to the DOM
        if (!this.overlay) {
            this.overlay = document.getElementById('box-overlay');
            this.boxElement = document.getElementById('loot-box');
            this.revealElement = document.getElementById('box-item-reveal');
            this.btnClaim = document.getElementById('btn-claim-box');
            this.setupListeners();
        }

        if (!this.overlay) return;
        
        this.overlay.style.display = 'flex';
        this.overlay.style.pointerEvents = 'auto'; // Force interactivity
        this.boxElement.style.display = 'flex';
        this.revealElement.classList.remove('active');
        this.btnClaim.classList.remove('visible');
        this.boxElement.classList.add('shake');
        this.isOpening = false;

        // Update Title to show remaining boxes
        const title = document.getElementById('box-title');
        if (title) {
            if (this.boxesToOpen > 1) {
                title.innerText = `TIENES ${this.boxesToOpen} CAJAS`;
            } else {
                title.innerText = "NUEVA RECOMPENSA";
            }
        }
    }

    async openBoxAnimation() {
        console.log("BoxManager: openBoxAnimation started. isOpening:", this.isOpening);
        if (this.isOpening) return;
        this.isOpening = true;

        try {
            // Roll reward BEFORE animation starts so we know what to show
            this.currentReward = this.rollReward();
            console.log("BoxManager: Reward Rolled", this.currentReward);
        } catch (err) {
            console.error("BoxManager: Error rolling reward", err);
            this.isOpening = false;
            return;
        }

        // 1. Intensify shake
        this.boxElement.style.animationDuration = '0.2s';
        
        await new Promise(r => setTimeout(r, 1000));

        // 2. Flash and Reveal
        this.boxElement.style.display = 'none';
        this.revealElement.classList.add('active');
        
        // Populate Reward Info
        this.itemIcon.innerText = this.currentReward.icon;
        this.itemName.innerText = this.currentReward.name;
        this.itemRarity.innerText = this.currentReward.rarity;
        
        // Set Rarity Glow
        const rarityClass = `rarity-${this.currentReward.rarity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('ú', 'u').replace('ó', 'o').replace('é', 'e').replace('á', 'a')}`;
        this.rarityGlow.className = `rarity-glow ${rarityClass}`;

        // 3. Show Claim Button after a short delay
        setTimeout(() => {
            this.btnClaim.classList.add('visible');
            if (this.boxesToOpen > 1) {
                this.btnClaim.innerText = "SIGUIENTE CAJA";
            } else {
                this.btnClaim.innerText = "RECLAMAR";
            }
        }, 1000);
    }

    rollReward() {
        const rand = Math.random() * 100;
        
        if (rand < 60) return this.rollCoins();
        if (rand < 85) return this.rollSkin();
        if (rand < 95) return this.rollParticle();
        return this.rollAbility();
    }

    rollCoins() {
        const amounts = [100, 150, 200, 250, 300, 400, 500];
        // Weighted towards lower amounts
        const weights = [30, 25, 15, 10, 8, 7, 5];
        const amount = this.getWeightedRandom(amounts, weights);
        
        return {
            type: 'coins',
            id: 'coins',
            name: `${amount} MONEDAS`,
            icon: '💎',
            rarity: 'COMÚN',
            value: amount
        };
    }

    rollSkin() {
        const skinMgr = this.game.skinManager;
        const allSkins = skinMgr.getSkins();
        
        // Filter out those that are expensive/legendary for the pool or use the whole pool with weights?
        // Let's use the whole pool but weight by price/rarity.
        const pool = allSkins.filter(s => s.price > 0); // Exclude default
        
        const weights = pool.map(s => {
            if (s.rarity === 'LEGENDARIO') return 2;
            if (s.rarity === 'ÉPICO') return 8;
            if (s.rarity === 'RARO') return 20;
            return 70;
        });

        const skin = this.getWeightedRandom(pool, weights);

        // Compensation if owned
        if (skinMgr.isOwned(skin.id)) {
            return {
                type: 'coins',
                id: 'coins_comp',
                name: `COMPENSACIÓN: ${Math.floor(skin.price / 2)} MONEDAS`,
                icon: '💎',
                rarity: 'COMÚN',
                value: Math.floor(skin.price / 2),
                comment: `Ya tenías ${skin.name}`
            };
        }

        return {
            type: 'skin',
            id: skin.id,
            name: skin.name,
            icon: '👤',
            rarity: skin.rarity,
            original: skin
        };
    }

    rollParticle() {
        const partMgr = this.game.particleManager;
        const shapes = partMgr.getShapes().filter(s => s.price > 0);
        const weights = shapes.map(s => {
            if (s.rarity === 'LEGENDARIO') return 5;
            if (s.rarity === 'ÉPICO') return 20;
            return 75;
        });

        const shape = this.getWeightedRandom(shapes, weights);

        if (partMgr.isShapeOwned(shape.id)) {
            return {
                type: 'coins',
                id: 'coins_comp_part',
                name: `COMPENSACIÓN: ${Math.floor(shape.price / 2)} MONEDAS`,
                icon: '💎',
                rarity: 'COMÚN',
                value: Math.floor(shape.price / 2)
            };
        }

        return {
            type: 'particle',
            id: shape.id,
            name: shape.name,
            icon: '✨',
            rarity: shape.rarity,
            original: shape
        };
    }

    rollAbility() {
        const upgMgr = this.game.upgradeManager;
        
        // Merge abilities and tools
        const pool = [
            ...Object.values(upgMgr.abilities),
            ...Object.values(upgMgr.tools)
        ];

        const weights = pool.map(a => {
            if (a.cost >= 5000) return 10;
            if (a.cost >= 2000) return 30;
            return 60;
        });

        const item = this.getWeightedRandom(pool, weights);
        const name = this.game.localizationManager.getString(item.nameKey);

        if (upgMgr.isOwned(item.id) || (upgMgr.ownedTools && upgMgr.ownedTools.includes(item.id))) {
             return {
                type: 'coins',
                id: 'coins_comp_ability',
                name: `COMPENSACIÓN: ${Math.floor(item.cost / 2)} MONEDAS`,
                icon: '💎',
                rarity: 'COMÚN',
                value: Math.floor(item.cost / 2)
            };
        }

        return {
            type: 'ability',
            id: item.id,
            name: name,
            icon: item.icon || '⚡',
            rarity: item.cost >= 5000 ? 'LEGENDARIO' : 'ÉPICO',
            original: item
        };
    }

    getWeightedRandom(items, weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            if (random < weights[i]) return items[i];
            random -= weights[i];
        }
        return items[0];
    }

    claimReward() {
        if (!this.currentReward) return;

        const reward = this.currentReward;
        
        if (reward.type === 'coins') {
            this.game.scoreManager.addCoins(reward.value);
        } else if (reward.type === 'skin') {
            this.game.skinManager.purchasedSkins.push(reward.id);
            localStorage.setItem('neon_survive_purchased_skins_v2', JSON.stringify(this.game.skinManager.purchasedSkins));
            this.game.skinManager.saveData();
        } else if (reward.type === 'particle') {
            this.game.particleManager.purchasedShapes.push(reward.id);
            localStorage.setItem('neon_survive_purchased_shapes', JSON.stringify(this.game.particleManager.purchasedShapes));
        } else if (reward.type === 'ability') {
            const upgMgr = this.game.upgradeManager;
            if (reward.original.type) { // It's an ability
                upgMgr.ownedAbilities.push(reward.id);
            } else { // It's a tool
                upgMgr.ownedTools.push(reward.id);
            }
            upgMgr.save();
        }

        this.boxesToOpen--;
        
        if (this.boxesToOpen > 0) {
            this.showOverlay();
        } else {
            // Close Overlay
            this.overlay.style.display = 'none';
            // Restore state: if we were in GAMEOVER, keep it there.
            this.game.currentState = this.game.STATES.GAMEOVER;
            this.game.updateUI();
        }
        
        if (this.onClaimCallback) this.onClaimCallback();
    }
}
