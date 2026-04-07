class SkinManager {
    constructor(scoreManager) {
        this.scoreManager = scoreManager;

        // New Skins System: Categories/Themes
        this.skins = [
            // --- BASIC COLORS (0 - 500) ---
            { id: 'classic_cyan', name: 'Original Cyan', type: 'color', color: '#00FFFF', price: 0, rarity: 'COMÚN', description: "El clásico de neón." },
            { id: 'soft_pink', name: 'Soft Pink', type: 'color', color: '#FF69B4', price: 100, rarity: 'COMÚN', description: "Dulce pero letal." },
            { id: 'lime_green', name: 'Lime Green', type: 'color', color: '#32CD32', price: 200, rarity: 'COMÚN', description: "Visibilidad máxima." },
            { id: 'electric_blue', name: 'Electric Blue', type: 'color', color: '#1E90FF', price: 300, rarity: 'COMÚN', description: "Voltaje puro." },
            { id: 'golden_sun', name: 'Golden Sun', type: 'color', color: '#FFD700', price: 400, rarity: 'COMÚN', description: "Brilla con luz propia." },
            { id: 'silver_moon', name: 'Silver Moon', type: 'color', color: '#C0C0C0', price: 500, rarity: 'COMÚN', description: "Reflejos lunares." },

            // --- ELEMENTAL / ANIMATED (750 - 2500) ---
            { id: 'magma', name: 'Magma', type: 'animated', color: '#FF4500', price: 750, rarity: 'RARO', description: "Flujo volcánico." },
            { id: 'plasma', name: 'Plasma', type: 'animated', color: '#CC00FF', price: 1000, rarity: 'RARO', description: "Energía ionizada." },
            { id: 'biolum', name: 'Biolum', type: 'animated', color: '#00FFAA', price: 1250, rarity: 'RARO', description: "Luz de las profundidades." },
            { id: 'thunder', name: 'Thunder', type: 'special', color: '#FFFF00', price: 1500, rarity: 'RARO', description: "Tormenta eléctrica." },
            { id: 'arctic', name: 'Arctic', type: 'animated', color: '#E0FFFF', price: 2000, rarity: 'RARO', description: "Cero absoluto." },
            { id: 'necro', name: 'Necro', type: 'animated', color: '#333333', price: 2500, rarity: 'RARO', description: "Energía oscura." },

            // --- SHAPE SHIFTERS (3000 - 7500) ---
            { id: 'delta', name: 'Delta', type: 'shape', shape: 'triangle', color: '#FF0000', price: 3000, rarity: 'ÉPICO', description: "Geometría afilada." },
            { id: 'rhombus', name: 'Rhombus', type: 'shape', shape: 'diamond', color: '#FFFFFF', price: 4000, rarity: 'ÉPICO', description: "Diamante puro." },
            { id: 'gemstone', name: 'Gemstone', type: 'shape', shape: 'pentagon', color: '#00FF00', price: 5000, rarity: 'ÉPICO', description: "Belleza tallada." },
            { id: 'hex_tech', name: 'Hex-Tech', type: 'shape', shape: 'hexagon', color: '#0088FF', price: 6000, rarity: 'ÉPICO', description: "Vaguardia técnica." },
            { id: 'heptagon', name: 'Heptagon', type: 'shape', shape: 'heptagon', color: '#AA00FF', price: 7000, rarity: 'ÉPICO', description: "Siete caras de poder." },
            { id: 'star_link', name: 'Star-Link', type: 'shape', shape: 'star', color: '#FFFF00', price: 8000, rarity: 'ÉPICO', description: "Brillo estelar." },

            // --- LEGENDARY / SPECIAL (10000 - 25000) ---
            { id: 'matrix', name: 'The Matrix', type: 'special', color: '#00FF00', price: 10000, rarity: 'LEGENDARIO', description: "Ves el código binario." },
            { id: 'rainbow', name: 'Rainbow', type: 'special', color: '#FFFFFF', price: 12500, rarity: 'LEGENDARIO', description: "Todo el espectro." },
            { id: 'supernova', name: 'Supernova', type: 'special', color: '#FFAA00', price: 15000, rarity: 'LEGENDARIO', description: "Explosión estelar." },
            { id: 'god_mode', name: 'God Mode', type: 'special', color: '#FFD700', price: 20000, rarity: 'LEGENDARIO', description: "Poder divino." },
            { id: 'chronos', name: 'Chronos', type: 'special', color: '#00AAAA', price: 25000, rarity: 'LEGENDARIO', description: "El tiempo es tuyo." }
        ];

        this.currentSkinId = localStorage.getItem('neon_survive_skin_v2') || 'classic_cyan';
        this.purchasedSkins = JSON.parse(localStorage.getItem('neon_survive_purchased_skins_v2')) || ['classic_cyan'];

        // Migration Check: If user had old skins, maybe give them coins? 
        // For now, fresh start as requested.

        // Validation
        if (!this.skins.find(s => s.id === this.currentSkinId)) {
            this.currentSkinId = 'classic_cyan';
        }
    }

    getSkins() {
        return this.skins;
    }

    getCurrentSkin() {
        return this.skins.find(s => s.id === this.currentSkinId) || this.skins[0];
    }

    isOwned(skinId) {
        return this.purchasedSkins.includes(skinId);
    }

    buySkin(skinId) {
        const skin = this.skins.find(s => s.id === skinId);
        if (!skin || this.isOwned(skinId)) return false;

        if (this.scoreManager.spendCoins(skin.price)) {
            this.purchasedSkins.push(skinId);
            localStorage.setItem('neon_survive_purchased_skins_v2', JSON.stringify(this.purchasedSkins));
            this.saveData();
            if (this.scoreManager.game.accountManager) {
                this.scoreManager.game.accountManager.saveProgress();
            }
            return true;
        }
        return false;
    }

    selectSkin(id) {
        if (this.isOwned(id)) {
            this.currentSkinId = id;
            this.saveData();
            if (this.scoreManager.game.accountManager) {
                this.scoreManager.game.accountManager.saveProgress();
            }
            return true;
        }
        return false;
    }

    saveData() {
        localStorage.setItem('neon_survive_skin_v2', this.currentSkinId);
    }
}
