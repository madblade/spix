/**
 * Express configuration
 */

'use strict';

import express from 'express';
import favicon from 'serve-favicon';
import compression from 'compression';
import errorHandler from 'errorhandler';
import path from 'path';
import config from './environment';
// DB:
// import connectMongo from 'connect-mongo';
// import mongoose from 'mongoose';
// var MongoStore = connectMongo(session);

export default function(app)
{
    var env = app.get('env');

    if (env === 'development' || env === 'test')
    {
        app.use(express.static(path.join(config.root, '.tmp')));
    }

    if (env === 'production')
    {
        app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
    }

    app.set('appPath', path.join(config.root, 'client'));
    app.use(express.static(app.get('appPath')));

    app.use(compression());

    // Persist sessions with MongoStore / sequelizeStore
    // We need to enable sessions for passport-twitter because it's an
    // oauth 1.0 strategy, and Lusca depends on sessions
    // app.use(session({
    //  secret: config.secrets.session,
    //   saveUninitialized: true,
    //   resave: false,
    //   store: new MongoStore({
    //     mongooseConnection: mongoose.connection,
    //     db: 'spix-test-ng2017'
    //   })
    // }));

    /**
     * Lusca - express server security
     * https://github.com/krakenjs/lusca
     */
    // if (env !== 'test' && !process.env.SAUCE_USERNAME) {
    //   app.use(lusca({
    //     csrf: {
    // angular: true
    // },
    // xframe: 'SAMEORIGIN',
    // hsts: {
    //   maxAge: 31536000, //1 year, in seconds
    //   includeSubDomains: true,
    //   preload: true
    // },
    // xssProtection: true
    // }));
    // }

    if (env === 'development')
    {
        const webpackDevMiddleware = require('webpack-dev-middleware');
        const stripAnsi = require('strip-ansi');
        const webpack = require('webpack');
        const makeWebpackConfig = require('../../webpack.make');
        const webpackConfig = makeWebpackConfig({ DEV: true, LOCALSERVER: true });
        const compiler = webpack(webpackConfig);
        const browserSync = require('browser-sync').create();

        /**
         * Run Browsersync and use middleware for Hot Module Replacement
         */
        browserSync.init({
            open: false,
            logFileChanges: false,
            ghostMode: false,
            proxy: `localhost:${config.port}`,
            ws: true,
            middleware: [
                webpackDevMiddleware(compiler, {
                    noInfo: false,
                    stats: {
                        colors: true,
                        timings: true,
                        chunks: false
                    }
                }),
            ],
            port: 9001,
            // port: config.browserSyncPort,
            plugins: ['bs-fullscreen-message']
        });

        /**
         * Reload all devices when bundle is complete
         * or send a fullscreen error message to the browser instead
         */
        compiler.hooks.done.tap('WebpackShellPlugin',
            //.plugin('done',
            function(stats) {
                console.log('webpack done hook');
                if (stats.hasErrors() || stats.hasWarnings()) {
                    return browserSync.sockets.emit('fullscreen:message', {
                        title: 'Webpack Error:',
                        body: stripAnsi(stats.toString()),
                        timeout: 100000
                    });
                }
                browserSync.reload();
            });
    }

    if (env === 'development' || env === 'test')
    {
        app.use(errorHandler()); // Error handler - has to be last
    }
}
