/**
 *
 */

'use strict';

import PortalFragment  from './portal/portal.fragment.glsl';
import PortalVertex    from './portal/portal.vertex.glsl';

let ShadersModule = {

    getPortalVertexShader() {
        return PortalVertex;
    },

    getPortalFragmentShader() {
        return PortalFragment;
    }

};

export { ShadersModule };
