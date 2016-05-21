/**
 * @author mrdoob / http://mrdoob.com/
 * refactored by madblade
 */

var pointerModule = (function () {

    var element = document.body;
    var hasPointerLock = true;

    if ('webkitPointerLockElement' in document) {
        element.requestPointerLock = element.webkitRequestPointerLock;
        var plc = function(event) {
            app.uiEngine.threeControlsEnabled = document.webkitPointerLockElement === element;
        };
        document.addEventListener('webkitpointerlockchange', plc, false);

    } else if ('mozPointerLockElement' in document) {
        element.requestPointerLock = element.mozRequestPointerLock;
        var plc = function(event) {
            app.uiEngine.threeControlsEnabled = document.mozPointerLockElement === element;
        };
        document.addEventListener('mozpointerlockchange', plc, false);

    } else if ('pointerLockElement' in document) {
        var plc = function(event) {
            app.uiEngine.threeControlsEnabled = document.pointerLockElement === element;
        };
        document.addEventListener('pointerlockchange', plc, false);

    } else {
        hasPointerLock = false;
        console.log('ERROR: POINTER LOCK NOT SUPPORTED.');
    }

    return {};
})();
