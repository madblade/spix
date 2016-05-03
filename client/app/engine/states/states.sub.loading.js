/**
 *
 */

'use strict';

App.Engine.StateManager.prototype.startLoading = function () {
    $('#loader')
        .addClass('sk-folding-cube')
        .append(
        '<div class="sk-cube1 sk-cube"></div>' +
        '<div class="sk-cube2 sk-cube"></div>' +
        '<div class="sk-cube4 sk-cube"></div>' +
        '<div class="sk-cube3 sk-cube"></div>'
    );
};

App.Engine.StateManager.prototype.endLoading = function () {
    var loader = $('#loader');
    loader.fadeOut(200, function() {
        loader.empty().removeClass('sk-folding-cube');
    });
};
