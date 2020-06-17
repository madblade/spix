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
    BLOCK_LEAVES: 8,

    BLOCK_WATER: 16,

    BLOCK_SAND: 17,
    BLOCK_IRON: 18,
    BLOCK_OBSIDIAN: 19,

    ORE_GOLD: 20,
    ORE_COAL: 21,
    ORE_DIAMOND: 22,
    ORE_REDSTONE: 23,
    // ...
    // server-side: (model_world / model)

    BLOCK_WOOL_WHITE: 32,
    BLOCK_WOOL_GREY: 33,
    BLOCK_WOOL_CYAN: 34,
    BLOCK_WOOL_ORANGE: 35,
    BLOCK_WOOL_DARK_PURPLE: 36,
    BLOCK_WOOL_LIGHT_PURPLE: 37,
    BLOCK_WOOL_DARK_BLUE: 38,
    BLOCK_WOOL_LIGHT_BLUE: 39,
    BLOCK_WOOL_BROWN: 40,
    BLOCK_WOOL_YELLOW: 41,
    BLOCK_WOOL_DARK_GREEN: 42,
    BLOCK_WOOL_LIGHT_GREEN: 43,
    BLOCK_WOOL_RED: 44,
    BLOCK_WOOL_ROSE: 45,
    BLOCK_WOOL_BLACK: 46,
    BLOCK_WOOL_DARK_GREY: 47,
    BLOCK_LAPIS: 48,
    BLOCK_SPONGE: 49,
    BLOCK_BEDROCK: 50,
    BLOCK_MOSSY_STONE: 51,
    BLOCK_CRACKED_STONE: 52,
    BLOCK_ENDER: 53,
    BLOCK_NETHER: 54,
    BLOCK_DIAMOND: 55,
    BLOCK_GOLD: 56,

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

    isItemNaught(item)
    {
        return item === ItemType.NONE;
    },

    isItemBlock(item)
    {
        return item > ItemType.NONE && item < 256;
    },

    isItemX(item)
    {
        return item === ItemType.PORTAL_GUN_SINGLE ||
            item === ItemType.PORTAL_GUN_DOUBLE;
    },

    isItemX2(item)
    {
        return item === ItemType.PORTAL_GUN_SINGLE;
    },

    isItemPlaceable(item)
    {
        return ItemsModelModule.isItemBlock(item) ||
            ItemsModelModule.isItemX(item);
    },

    isItemMelee(item)
    {
        return item >= ItemType.KATANA && item < ItemType.YA;
    },

    isItemRanged(item)
    {
        return item >= ItemType.YUMI && item < 512;
    },

    isItemUseable(item)
    {
        return ItemsModelModule.isItemMelee(item) ||
            ItemsModelModule.isItemRanged(item);
    },

    isItemIDSupported(item)
    {
        if (typeof item !== 'number') return false;
        for (let i in ItemType) {
            if (!ItemType.hasOwnProperty(i)) continue;
            if (ItemType[i] === item) return true;
        }
        return false;
    }

};

export { ItemsModelModule, ItemType };
