/**
 * @author mrdoob / http://mrdoob.com/
 * refactored by madblade
 */

var pointerModule = (function () {

    var element = document.body;

    if ('webkitPointerLockElement' in document) {
        element.requestPointerLock = element.webkitRequestPointerLock;
        document.addEventListener('webkitpointerlockchange', function(e) {
            app.uiEngine.threeControlsEnabled = document.webkitPointerLockElement === element;
        }, false);

    } else if ('mozPointerLockElement' in document) {
        element.requestPointerLock = element.mozRequestPointerLock;
        document.addEventListener('mozpointerlockchange', function(e) {
            app.uiEngine.threeControlsEnabled = document.mozPointerLockElement === element;
        }, false);

    } else if ('pointerLockElement' in document) {
        document.addEventListener('pointerlockchange', function(e) {
            app.uiEngine.threeControlsEnabled = document.pointerLockElement === element;
        }, false);

    } else {
        console.log('ERROR: POINTER LOCK NOT SUPPORTED.');
    }

    return {};
})();
