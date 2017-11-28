/**
 *
 */

'use strict';

var InventoryModule = {

    getInventory: function() {
        var items = new Uint8Array(256);
        items[0] = 1;

        return {
            _items: items,
            getItem: function(id) {
                if (id !== parseInt(id, 10) || id < 0 || id > 256) return -1;
                return this._items[id];
            },
            setItem: function(id, item) {
                if (id !== parseInt(id, 10) || id < 0 || id > 256) return;
                this._items[id] = item;
            }
        };
    }

};

export { InventoryModule };
