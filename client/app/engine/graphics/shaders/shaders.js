/**
 *
 */

'use strict';

import PortalFragment  from './portal/portal.fragment.glsl';
import PortalVertex    from './portal/portal.vertex.glsl';

var ShadersModule = {

    getPortalVertexShader: function() {
        console.log('Portal Vertex Shader : ' + PortalVertex);
        return PortalVertex;
        /*[
            'varying vec4 pos_frag;',
            '',
            'void main() {',
            '',
            '   pos_frag = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
            '',
            '   gl_Position = pos_frag;',
            '}'
        ].join('\n');*/
    },

    getPortalFragmentShader: function() {
        console.log('Portal Fragment Shader : ' + PortalFragment);
        return PortalFragment;
        /*[
            'uniform sampler2D texture1;',
            '',
            'varying vec4 pos_frag;',
            '',
            'void main() {',
            '',
            '   vec2 ratio = pos_frag.xy / pos_frag.w;',
            '   vec2 correctedUv = (ratio + vec2(1.0)) * 0.5;',
            '',
            '   gl_FragColor = texture2D(texture1, correctedUv);',
            '}'
        ].join('\n');*/
    }

};

export { ShadersModule };
