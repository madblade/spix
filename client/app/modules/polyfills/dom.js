/**
 *
 */

'use strict';

import $ from 'jquery';

$.fn.center = function() {
    this.css('position', 'absolute');
    let topPx = Math.max(0, ($(window).height() - $(this).outerHeight()) / 2 +
        $(window).scrollTop());
    let leftPx = Math.max(0, ($(window).width() - $(this).outerWidth()) / 2 +
        $(window).scrollLeft());

    this.css('left', `${leftPx}px`);
    this.css('top', `${topPx}px`);

    return this;
};

$(window).resize(function() {
    $('.settings').center();
    $('.reticle').center();
});

export { $ };
