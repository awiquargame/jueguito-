class UpgradeManager {
    constructor(game) {
        this.game = game;

        // Config
        this.maxLevel = 5;
        this.costs = [250, 500, 700, 900, 1100];
        // Speed Multipliers: Lvl 0 (Default) -> 1.0. Upgrades 1-5 give:
        // Lvl 1: 1.2
        // Lvl 2: 1.3
        // Lvl 3: 1.4
        // Lvl 4: 1.5
        // Lvl 5: 1.6
        // Wait, user said "by default comes at level one... first upgrade makes you go x1.2".
        // Let's align indices:
        // currentLevel = 0 (Base). Multiplier 1.0. Cost to next: 250.
        // currentLevel = 1. Multiplier 1.2. Cost to next: 500.
        // currentLevel = 2. Multiplier 1.3. Cost to next: 700.
        // ...
        // currentLevel = 5. Multiplier 1.6. Maxed.

        this.multipliers = [1.0, 1.2, 1.3, 1.4, 1.5, 1.6];

        // Load State
        this.currentLevel = 0; // Reset level on game load (No Persistence)
        this.dashCooldownLevel = 0;
        this.dashLevel = 0; // Keeping purely in case of legacy use, but dashCooldownLevel is main.

        // Dash Multipliers (Cooldown Reduction)
        // Lvl 0: 1.0 (100%)
        // Lvl 1: 0.95 (95%)
        // Lvl 2: 0.90 (90%)
        // Lvl 3: 0.85 (85%)
        // Lvl 4: 0.80 (80%)
        // Lvl 5: 0.75 (75%)
        this.dashMultipliers = [1.0, 0.95, 0.90, 0.85, 0.80, 0.75];

        // Special Upgrades (Inventory System)
        // Reset on game load (No Persistence requested by user)
        this.ownedAbilities = [];
        this.equippedAbilities = { "speed": null, "dash": null, "dash2": null };
        this.secondDashSlotUnlocked = false;

        // Ability Definitions/Metadata
        this.abilities = {
            'extra_speed': { id: 'extra_speed', type: 'speed', cost: 680, nameKey: 'upgrades.extra_speed', icon: '🏃' },
            'adrenaline': { id: 'adrenaline', type: 'speed', cost: 800, nameKey: 'upgrades.adrenaline', icon: '🔥' },
            'dash_attack': { id: 'dash_attack', type: 'dash', cost: 2000, nameKey: 'upgrades.dash_attack', icon: '💥' },
            'dash_score': { id: 'dash_score', type: 'dash', cost: 500, nameKey: 'upgrades.dash_score', icon: '✨' }
        };

        // Costs (Basic)
        this.speedCosts = [250, 500, 1000, 2000, 4000, 8000];
        this.dashCosts = [250, 500, 1000, 2000, 4000, 8000];

        // Tools System
        this.toolsUnlocked = false; // "Herramientas" Slot
        this.ownedTools = [];
        this.equippedTool = null; // Only one tool equipped at a time
        this.tools = {
            'tool_heart': { id: 'tool_heart', cost: 1000, nameKey: 'tools.heart.name', descKey: 'tools.heart.desc', icon: '❤️' },
            'tool_score': { id: 'tool_score', cost: 700, nameKey: 'tools.score.name', descKey: 'tools.score.desc', icon: '⭐' },
            'tool_flag': { id: 'tool_flag', cost: 3000, nameKey: 'tools.flag.name', descKey: 'tools.flag.desc', icon: '🚩' },
            'tool_edit': { id: 'tool_edit', cost: 10000, nameKey: 'tools.edit.name', descKey: 'tools.edit.desc', icon: '💀' }
        };
    }

    equipTool(id) {
        if (id === null) {
            this.equippedTool = null;
            this.save();
            return true;
        }
        if (this.ownedTools.includes(id)) {
            this.equippedTool = id;
            this.save();
            return true;
        }
        return false;
    }

    getMultiplier() {
        if (this.currentLevel >= this.multipliers.length) return this.multipliers[this.multipliers.length - 1];
        return this.multipliers[this.currentLevel];
    }

    getDashMultiplier() {
        if (this.dashCooldownLevel >= this.dashMultipliers.length) return this.dashMultipliers[this.dashMultipliers.length - 1];
        return this.dashMultipliers[this.dashCooldownLevel];
    }

    buyAbility(id) {
        const ability = this.abilities[id];
        if (!ability) return false;
        if (this.ownedAbilities.includes(id)) return false; // Already owned

        if (this.game.scoreManager.spendCoins(ability.cost)) {
            this.ownedAbilities.push(id);
            this.save(); 
            return true;
        }
        return false;
    }

    unlockSecondDashSlot() {
        if (this.secondDashSlotUnlocked) return false;
        if (this.game.scoreManager.spendCoins(800)) {
            this.secondDashSlotUnlocked = true;
            this.save();
            return true;
        }
        return false;
    }

    unlockTools() {
        if (this.toolsUnlocked) return false;
        if (this.game.scoreManager.spendCoins(1000)) {
            this.toolsUnlocked = true;
            this.save();
            return true;
        }
        return false;
    }

    buyTool(id) {
        const tool = this.tools[id];
        if (!tool) return false;
        if (this.ownedTools.includes(id)) return false;

        if (this.game.scoreManager.spendCoins(tool.cost)) {
            this.ownedTools.push(id);
            this.save();
            return true;
        }
        return false;
    }

    equipAbility(slot, id) {
        // Unequip if id is null
        if (id === null) {
            this.equippedAbilities[slot] = null;
            this.updatePlayerStats();
            this.save();
            return true;
        }

        // Verify ownership and type
        const ability = this.abilities[id];

        // Determine required type for slot
        let requiredType = slot;
        if (slot === 'dash2') requiredType = 'dash';

        if (ability && this.ownedAbilities.includes(id) && ability.type === requiredType) {
            // Unique Equip Check: Ensure not equipped in the other dash slot
            if (requiredType === 'dash') {
                const otherSlot = (slot === 'dash') ? 'dash2' : 'dash';
                if (this.equippedAbilities[otherSlot] === id) {
                    return false; // Already equipped in the other slot
                }
            }

            this.equippedAbilities[slot] = id;
            this.updatePlayerStats();
            this.save();
            return true;
        }
        return false;
    }

    isOwned(id) {
        return this.ownedAbilities.includes(id);
    }

    getEquipped(slot) {
        return this.equippedAbilities[slot];
    }

    updatePlayerStats() {
        if (this.game.player) {
            this.game.player.updateSpeed();
        }
    }

    // Proxy methods for compatibility/convenience
    buySpeedUpgrade() {
        if (this.currentLevel >= this.maxLevel) return false;
        const cost = this.speedCosts[this.currentLevel];
        if (this.game.scoreManager.spendCoins(cost)) {
            this.currentLevel++;
            this.updatePlayerStats();
            this.save();
            return true;
        }
        return false;
    }

    buyDashUpgrade() {
        if (this.dashCooldownLevel >= this.maxLevel) return false;
        const cost = this.dashCosts[this.dashCooldownLevel];
        if (this.game.scoreManager.spendCoins(cost)) {
            this.dashCooldownLevel++;
            this.updatePlayerStats();
            this.save();
            return true;
        }
        return false;
    }

    getNextCost() {
        if (this.currentLevel >= this.maxLevel) return 0;
        return this.speedCosts[this.currentLevel];
    }

    getNextDashCost() {
        if (this.dashCooldownLevel >= this.maxLevel) return 0;
        return this.dashCosts[this.dashCooldownLevel];
    }

    canAfford(cost) {
        if (cost === undefined) {
            // Fallback for calls without arguments (Basic Speed)
            cost = this.getNextCost();
        }
        if (cost === 0) return false; // Max level or invalid
        return this.game.scoreManager.coins >= cost;
    }

    save() {
        if (this.game.accountManager) {
            this.game.accountManager.saveProgress();
        }
    }

    // Deprecated helpers removed (buyExtraSpeed, buyDashAttack)
    buyExtraSpeed() { return this.buyAbility('extra_speed'); }
    buyDashAttack() { return this.buyAbility('dash_attack'); }

    // Checkers for legacy compat
    get hasExtraSpeed() { return this.equippedAbilities.speed === 'extra_speed'; }
    get hasDashAttack() { return this.equippedAbilities.dash === 'dash_attack' || this.equippedAbilities.dash2 === 'dash_attack'; }
    get hasDashScore() { return this.equippedAbilities.dash === 'dash_score' || this.equippedAbilities.dash2 === 'dash_score'; }

    get hasToolHeart() { return this.equippedTool === 'tool_heart'; }
    get hasToolScore() { return this.equippedTool === 'tool_score'; }
    get hasToolFlag() { return this.equippedTool === 'tool_flag'; }
    get hasToolEdit() { return this.equippedTool === 'tool_edit'; }
}
