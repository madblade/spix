/**
 *
 */

'use strict';

App.State.StateManager.prototype.registerLoading = function() {
    this.registerState('loading', this.startLoading, this.endLoading);
};

App.State.StateManager.prototype.startLoading = function () {
    $('#announce')
        .addClass('sk-folding-cube')
        .append(
        '<div class="sk-cube1 sk-cube"></div>' +
        '<div class="sk-cube2 sk-cube"></div>' +
        '<div class="sk-cube4 sk-cube"></div>' +
        '<div class="sk-cube3 sk-cube"></div>'
    );
};

App.State.StateManager.prototype.endLoading = function () {
    return new Promise(function(resolve) {
        var loader = $('#announce');
        loader.fadeOut(200, function() {
            loader.empty().removeClass('sk-folding-cube');
            resolve();
        });
    });
};
