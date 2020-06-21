/**
 * Inventory display.
 * (quick items slots)
 */

'use strict';

import $                        from 'jquery';

let HUDInventoryModule =
{
    initInventory()
    {
        $('#item0').html(`
            <img src="app/assets/icons/block-planks.jpg" />
        `);
        $('#item1').html(`
            <img src="app/assets/icons/katana.png" />
        `);
        $('#item2').html(`
            <img src="app/assets/icons/bow.png" />
        `);
        // $('#item3').html(`
        //      <img src="app/assets/icons/portal-gun.png" />
        // `);
        $('#item4').html(`
            <img src="app/assets/icons/world-gun.png" />
        `);
    }
};

export { HUDInventoryModule };
