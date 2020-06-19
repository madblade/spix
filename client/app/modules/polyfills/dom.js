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

(function(jQuery) {
    let toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
    let toBind = 'onwheel' in document || document.documentMode >= 9 ?
        ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    let slice  = Array.prototype.slice;
    let nullLowestDeltaTimeout; let lowestDelta;

    if (jQuery.event.fixHooks) {
        for (let i = toFix.length; i;) {
            jQuery.event.fixHooks[toFix[--i]] = jQuery.event.mouseHooks;
        }
    }

    let special = jQuery.event.special.mousewheel = {
        version: '3.1.12',

        setup() {
            if (this.addEventListener) {
                for (let j = toBind.length; j;) {
                    this.addEventListener(toBind[--j], handler, false);
                }
            } else {
                this.onmousewheel = handler;
            }
            // Store the line height and page height for this particular element
            jQuery.data(this, 'mousewheel-line-height', special.getLineHeight(this));
            jQuery.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },

        teardown() {
            if (this.removeEventListener) {
                for (let j = toBind.length; j;) {
                    this.removeEventListener(toBind[--j], handler, false);
                }
            } else {
                this.onmousewheel = null;
            }
            // Clean up the data we added to the element
            jQuery.removeData(this, 'mousewheel-line-height');
            jQuery.removeData(this, 'mousewheel-page-height');
        },

        getLineHeight(elem) {
            let $elem = jQuery(elem);
            let $parent = $elem['offsetParent' in jQuery.fn ? 'offsetParent' : 'parent']();
            if (!$parent.length) {
                $parent = jQuery('body');
            }
            return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
        },

        getPageHeight(elem) {
            return jQuery(elem).height();
        },

        settings: {
            adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
            normalizeOffset: true  // calls getBoundingClientRect for each event
        }
    };

    jQuery.fn.extend({
        mousewheel(fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel(fn) {
            return this.unbind('mousewheel', fn);
        }
    });

    function handler(...argts) {
        let event = argts[0];
        let orgEvent   = event || window.event;
        let args       = slice.call(argts, 1);
        let delta      = 0;
        let deltaX     = 0;
        let deltaY     = 0;
        let absDelta   = 0;
        let offsetX    = 0;
        let offsetY    = 0;
        event = jQuery.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ('detail'      in orgEvent) { deltaY = orgEvent.detail * -1;      }
        if ('wheelDelta'  in orgEvent) { deltaY = orgEvent.wheelDelta;       }
        if ('wheelDeltaY' in orgEvent) { deltaY = orgEvent.wheelDeltaY;      }
        if ('wheelDeltaX' in orgEvent) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
            deltaX = deltaY * -1;
            deltaY = 0;
        }

        // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
        delta = deltaY === 0 ? deltaX : deltaY;

        // New school wheel delta (wheel event)
        if ('deltaY' in orgEvent) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ('deltaX' in orgEvent) {
            deltaX = orgEvent.deltaX;
            if (deltaY === 0) { delta  = deltaX * -1; }
        }

        // No change actually happened, no reason to go any further
        if (deltaY === 0 && deltaX === 0) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if (orgEvent.deltaMode === 1) {
            let lineHeight = jQuery.data(this, 'mousewheel-line-height');
            delta  *= lineHeight;
            deltaY *= lineHeight;
            deltaX *= lineHeight;
        } else if (orgEvent.deltaMode === 2) {
            let pageHeight = jQuery.data(this, 'mousewheel-page-height');
            delta  *= pageHeight;
            deltaY *= pageHeight;
            deltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

        if (!lowestDelta || absDelta < lowestDelta) {
            lowestDelta = absDelta;

            // Adjust older deltas if necessary
            if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                lowestDelta /= 40;
            }
        }

        // Adjust older deltas if necessary
        if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
            // Divide all the things by 40!
            delta  /= 40;
            deltaX /= 40;
            deltaY /= 40;
        }

        // Get a whole, normalized value for the deltas
        delta  = Math[delta  >= 1 ? 'floor' : 'ceil'](delta  / lowestDelta);
        deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
        deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);

        // Normalise offsetX and offsetY properties
        if (special.settings.normalizeOffset && this.getBoundingClientRect) {
            let boundingRect = this.getBoundingClientRect();
            offsetX = event.clientX - boundingRect.left;
            offsetY = event.clientY - boundingRect.top;
        }

        // Add information to the event object
        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        event.offsetX = offsetX;
        event.offsetY = offsetY;
        // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.
        event.deltaMode = 0;

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120
        if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

        return (jQuery.event.dispatch || jQuery.event.handle).apply(this, args);
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting jQuery.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }
}($));

$(window).resize(function() {
    $('.settings').center();
    $('.reticle').center();
});

export { $ };