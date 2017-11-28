/**
 * A kind for requestAnimationFrame compatibility.
 */

'use strict';

(function() {
    let vendors = ['ms', 'moz', 'webkit', 'o'];
    let lastTime = 0;

    if (!('performance' in window)) {
        window.performance = {};
    }

    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); };
    }

    if (!('now' in window.performance)) {
        let nowOffset = Date.now();
        if (performance.timing && performance.timing.navigationStart) {
            nowOffset = performance.timing.navigationStart;
        }
        window.performance.now = function() { return Date.now() - nowOffset; };
    }

    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[`${vendors[x]}RequestAnimationFrame`];
        window.cancelAnimationFrame = window[`${vendors[x]}CancelAnimationFrame`] ||
            window[`${vendors[x]}CancelRequestAnimationFrame`];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            let currTime = Date.now();
            let timeToCall = Math.max(0, 16 - (currTime - lastTime));
            let id = window.setTimeout(function() {callback(currTime + timeToCall);},
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());
