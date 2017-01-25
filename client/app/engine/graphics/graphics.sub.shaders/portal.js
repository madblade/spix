/**
 *
 */

'use strict';

extend(App.Engine.Graphics.prototype, {

    getPortalVertexShader: function() {
        return [
            //"varying vec2 vUv;",
            "varying vec4 pos_frag;",
            "",
            "void main() {",
            "",
            //"vUv = uv;",
            "pos_frag = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
            "gl_Position = pos_frag;",
            "}"
        ].join('\n');
    },

    getPortalFragmentShader: function() {
        return [
            "uniform sampler2D texture1;",
            //"varying vec2 vUv;",
            "varying vec4 pos_frag;",
            "",
            "void main() {",
            "",
            "vec2 ratio = pos_frag.xy / pos_frag.w;",
            "vec2 correctedUv = (ratio + vec2(1.0))*0.5;",
            "gl_FragColor = texture2D( texture1, correctedUv );",
            "}"
        ].join('\n');
    }

});
