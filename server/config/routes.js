/**
 * Main application routes
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (app) {
    // Add routes below
    // app.use('/api/users', require('./api/user'));
    // app.use('/auth', require('./auth').default);

    // Undefined asset or api routes should return a 404
    // app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    //  .get((req, res) => {
    //      res.status(404);
    //      res.render(
    //          '404', // Path in folder 'server/views'
    //          {},
    //          function(err, html) {
    //              if (err) return res.status(404).json(result);
    //              res.send(html);
    //          }
    //      );
    //  });

    // All other routes should redirect to the index.html
    app.route('/*').get(function (req, res) {
        res.sendFile(_path2.default.resolve(app.get('appPath') + '/index.html'));
    });
};

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=routes.js.map
