/**
 * Main application routes
 */

'use strict';

import path from 'path';

export default function(app) {
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
    app.route('/*')
        .get((req, res) => {
            res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
        });
}