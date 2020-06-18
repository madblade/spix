'use strict';

// Production specific configuration
// =================================
module.exports = {
    // Server IP
    ip:     process.env.OPENSHIFT_NODEJS_IP ||
    process.env.IP ||
    undefined,
    // Notice: set ip to '::' instead of '127.0.0.1' for ipv6
    // ip: '::',

    // Server port
    port:   process.env.OPENSHIFT_NODEJS_PORT ||
    process.env.PORT || 8080
};
