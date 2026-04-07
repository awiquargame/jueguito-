class ParticleManager {
    constructor(game) {
        this.game = game;

        this.shapes = {
            'square': { id: 'square', name: 'Cuadrado', price: 0, rarity: 'COMÚN' },
            'circle': { id: 'circle', name: 'Círculo', price: 1000, rarity: 'RARO' },
            'triangle': { id: 'triangle', name: 'Triángulo', price: 2000, rarity: 'RARO' },
            'star': { id: 'star', name: 'Estrella', price: 5000, rarity: 'ÉPICO' },
            'neon_burst': { id: 'neon_burst', name: 'Neon Burst', price: 8000, rarity: 'ÉPICO' },
            'glitch': { id: 'glitch', name: 'Glitch Mode', price: 12000, rarity: 'LEGENDARIO' },
            'pulse': { id: 'pulse', name: 'Pulse Core', price: 15000, rarity: 'LEGENDARIO' },
            'speed_lines': { id: 'speed_lines', name: 'Speed Trails', price: 20000, rarity: 'LEGENDARIO' }
        };

        this.quantities = {
            'normal': { id: 'normal', name: 'Partículas Normales', multiplier: 1.0, price: 0, rarity: 'COMÚN' },
            'high': { id: 'high', name: 'Más Partículas', multiplier: 2.0, price: 2500, rarity: 'ÉPICO' },
            'extreme': { id: 'extreme', name: 'Caos Total', multiplier: 4.0, price: 10000, rarity: 'LEGENDARIO' }
        };

        // Persistence
        this.currentShapeId = localStorage.getItem('neon_survive_particle_shape') || 'square';
        this.currentQuantityId = localStorage.getItem('neon_survive_particle_quantity') || 'normal';
        this.purchasedShapes = JSON.parse(localStorage.getItem('neon_survive_purchased_shapes')) || ['square'];
        this.purchasedQuantities = JSON.parse(localStorage.getItem('neon_survive_purchased_quantities')) || ['normal'];

        // Validation
        if (!this.shapes[this.currentShapeId]) this.currentShapeId = 'square';
        if (!this.quantities[this.currentQuantityId]) this.currentQuantityId = 'normal';
    }

    getShapes() {
        return Object.values(this.shapes);
    }

    getQuantities() {
        return Object.values(this.quantities);
    }

    getCurrentShape() {
        return this.shapes[this.currentShapeId];
    }

    getCurrentQuantity() {
        return this.quantities[this.currentQuantityId];
    }

    isShapeOwned(id) {
        return this.purchasedShapes.includes(id);
    }

    isQuantityOwned(id) {
        return this.purchasedQuantities.includes(id);
    }

    buyShape(id) {
        const shape = this.shapes[id];
        if (!shape || this.isShapeOwned(id)) return false;

        if (this.game.scoreManager.spendCoins(shape.price)) {
            this.purchasedShapes.push(id);
            localStorage.setItem('neon_survive_purchased_shapes', JSON.stringify(this.purchasedShapes));
            return true;
        }
        return false;
    }

    buyQuantity(id) {
        const qty = this.quantities[id];
        if (!qty || this.isQuantityOwned(id)) return false;

        if (this.game.scoreManager.spendCoins(qty.price)) {
            this.purchasedQuantities.push(id);
            localStorage.setItem('neon_survive_purchased_quantities', JSON.stringify(this.purchasedQuantities));
            return true;
        }
        return false;
    }

    selectShape(id) {
        if (this.isShapeOwned(id)) {
            this.currentShapeId = id;
            localStorage.setItem('neon_survive_particle_shape', id);
            return true;
        }
        return false;
    }

    selectQuantity(id) {
        if (this.isQuantityOwned(id)) {
            this.currentQuantityId = id;
            localStorage.setItem('neon_survive_particle_quantity', id);
            return true;
        }
        return false;
    }
}
