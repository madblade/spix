/**
 *
 */

'use strict';

App.State.StateManager.prototype.register.push(function(scope) {
    scope.registerState('loading', scope.startLoading, scope.endLoading);
});

extend(App.State.StateManager.prototype, {

    startLoading: function () {
        $('#announce')
            .append('<div style="" class="title noselect"><p>spix<br/>engineering version</p></div>')
            .append('<div id="cube" class="sk-folding-cube">' +
            '<div class="sk-cube1 sk-cube"></div>' +
            '<div class="sk-cube2 sk-cube"></div>' +
            '<div class="sk-cube4 sk-cube"></div>' +
            '<div class="sk-cube3 sk-cube"></div>' +
            '</div>').center();
    },

    endLoading: function () {
        return new Promise(function(resolve) {
            var loader = $('#announce');
            loader.fadeOut(200, function() {
                loader.empty().removeClass('sk-folding-cube');
                resolve();
            });
        });
    }

});
