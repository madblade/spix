/**
 *
 */

'use strict';

import PortalFragment  from './portal/portal.fragment.glsl';
import PortalVertex    from './portal/portal.vertex.glsl';
import SkyFragment     from './sky/sky.fragment.glsl';
import SkyVertex       from './sky/sky.vertex.glsl';

let ShadersModule = {

    getPortalVertexShader() {
        return PortalVertex;
    },

    getPortalFragmentShader() {
        return PortalFragment;
    },

    getSkyVertexShader() {
        return PortalVertex;
    },

    getSkyFragmentShader() {
        return PortalFragment;
    }

};

export { ShadersModule };
