/**
 * @author mrdoob / http://mrdoob.com/
 * refactored by madblade
 */

var pointerModule = (function () {

    var element = document.body;
    var hasPointerLock = true;
    var plc, plwc, plmc;

    if ('webkitPointerLockElement' in document) {
        element.requestPointerLock = element.webkitRequestPointerLock;
        plwc = function(event) {
            app.uiEngine.threeControlsEnabled = document.webkitPointerLockElement === element;
        };
        document.addEventListener('webkitpointerlockchange', plwc, false);

    } else if ('mozPointerLockElement' in document) {
        element.requestPointerLock = element.mozRequestPointerLock;
        plmc = function(event) {
            app.uiEngine.threeControlsEnabled = document.mozPointerLockElement === element;
        };
        document.addEventListener('mozpointerlockchange', plmc, false);

    } else if ('pointerLockElement' in document) {
        plc = function(event) {
            app.uiEngine.threeControlsEnabled = document.pointerLockElement === element;
        };
        document.addEventListener('pointerlockchange', plc, false);

    } else {
        hasPointerLock = false;
        console.log('ERROR: POINTER LOCK NOT SUPPORTED.');
    }

    return {};
})();
