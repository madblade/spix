/**
 * Player inventory (current player only).
 */

'use strict';

import extend               from '../../../extend.js';
import { ItemsModelModule } from './items';

let InventoryModel = function()
{
    this.activeItemId = 0;
    this.inventorySize = 256;

    // Gameplay items
    this.items = new Uint16Array(this.inventorySize);

    // Clothes and armor
    this.outfit = new Uint8Array(0);

    this.reset();
};

extend(InventoryModel.prototype, {

    reset()
    {
        // this.setItem(0, ItemType.BLOCK_PLANKS);
        // this.setItem(1, ItemType.KATANA);
        // this.setItem(2, ItemType.YUMI);
        // this.setItem(3, ItemType.PORTAL_GUN_SINGLE);
        // this.setItem(4, ItemType.PORTAL_GUN_DOUBLE);
    },

    // These would be client methods.
    // getActiveItem()
    // {
    //     return this.items[this.activeItemId];
    // },
    // setActiveItem(id)
    // {
    //     if (id !== parseInt(id, 10) || id < 0 || id > this.inventorySize)
    //         console.error('[Model/Inventory] Invalid inventory slot.');
    //     this.activeItemId = id;
    //     return this.items[id];
    // },

    getItem(id)
    {
        if (id !== parseInt(id, 10) || id < 0 || id > this.inventorySize)
            console.error('[Model/Inventory] Invalid inventory slot.');
        return this.items[id];
    },

    setItem(id, item)
    {
        if (id !== parseInt(id, 10) || id < 0 || id > this.inventorySize)
            console.warn('[Model/Inventory] Invalid inventory slot.');
        if (!this.isItemIDSupported(item))
            console.warn('[Model/Inventory] Invalid item ID.');
        this.items[id] = item;
    }

});

extend(InventoryModel.prototype, ItemsModelModule);

export { InventoryModel };
