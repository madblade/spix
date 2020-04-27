/**
 * Utility statics for items.
 */

let ItemType = Object.freeze({
    NONE: 0,

    // Blocks
    BLOCK_GRASS: 1,
    BLOCK_STONE: 2,
    BLOCK_DIRT: 3,
    BLOCK_WOOD: 4,
    BLOCK_PLANKS: 5,
    BLOCK_STONEBRICKS: 6,
    BLOCK_BRICKS: 7,
    BLOCK_SAND: 17,
    BLOCK_IRON: 18,
    // ...
    // server-side: (model_world / model)

    // Weapons
    KATANA: 257,
    NAGAMAKI: 258,  // long handle longsword
    NODACHI: 259,   // sephiroth longsword
    YARI: 260,      // straight spear
    NAGINATA: 261,  // curved spear

    YA: 300,        // arrow
    YUMI: 301,      // longbow
    TEPPO: 302,     // arquebus
    // ...

    // Special items
    PORTAL_GUN_SINGLE: 513,
    PORTAL_GUN_DOUBLE: 514,
    // ...
});

let ItemsModelModule = {

    isItemIDSupported(item) {
        if (typeof item !== 'number') return false;
        for (let i in ItemType) {
            if (!ItemType.hasOwnProperty(i)) continue;
            if (ItemType[i] === item) return true;
        }
        return false;
    }

};

export { ItemsModelModule, ItemType };
