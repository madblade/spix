/**
 *
 */

'use strict';

extend(App.Engine.Graphics.prototype, {

    createLight: function(whatLight) {
        var light;

        switch (whatLight) {
            case 'hemisphere':
                light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
                break;

            default:
                light = new THREE.AmbientLight(0x404040);
        }

        return light;
    }

});
