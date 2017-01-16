/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.getPortalVertexShader = function() {
    return ["varying vec2 vUv;",
            "void main() {",
                "vUv = uv;",
                "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
            "}"].join('\n');
};

App.Engine.Graphics.prototype.getPortalFragmentShader = function() {
    return ["uniform sampler2D texture1;",
            "varying vec2 vUv;",
            "void main() {",
                "gl_FragColor = texture2D( texture1, vUv );",
            "}"].join('\n');
};
