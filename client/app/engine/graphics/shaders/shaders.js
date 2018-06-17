/**
 *
 */

'use strict';

import PortalFragment  from './portal/portal.fragment.glsl';
import PortalVertex    from './portal/portal.vertex.glsl';
import SkyFragment     from './sky/sky.fragment.glsl';
import SkyVertex       from './sky/sky.vertex.glsl';
import PlanetFragment  from './sky/planet.fragment.glsl';
import PlanetVertex    from './sky/planet.vertex.glsl';

let ShadersModule = {

    getPortalVertexShader() {
        return PortalVertex;
    },

    getPortalFragmentShader() {
        return PortalFragment;
    },

    getSkyVertexShader() {
        return SkyVertex;
    },

    getSkyFragmentShader() {
        return SkyFragment;
    },

    getPlanetVertexShader() {
        return PlanetVertex;
    },

    getPlanetFragmentShader() {
        return PlanetFragment;
    }

};

export { ShadersModule };
