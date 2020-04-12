/* eslint-disable */

'use strict';

import _ from 'lodash';
import del from 'del';
import gulp from 'gulp';
import path from 'path';
import through2 from 'through2';
import gulpLoadPlugins from 'gulp-load-plugins';
import http from 'http';
import open from 'open';
import lazypipe from 'lazypipe';
import nodemon from 'nodemon';
import { Server as KarmaServer } from 'karma';
import webpack from 'webpack-stream';
import makeWebpackConfig from './webpack.make';
import shell from 'gulp-shell';

let plugins = gulpLoadPlugins();
let config;

const clientPath = 'client';
const serverPath = 'server';
const paths = {
    client: {
        assets: `${clientPath}/assets/**/*`,
        images: `${clientPath}/assets/images/**/*`,
        revManifest: `${clientPath}/assets/rev-manifest.json`,
        scripts: [
            `${clientPath}/**/!(*.spec|*.mock).js`
        ],
        styles: [`${clientPath}/style/*.css`],
        mainStyle: `${clientPath}/style/app.css`,
        shaders: `${clientPath}/app/engine/graphics/shaders/**/*.glsl`,
        test: [`${clientPath}/app/**/*.{spec,mock}.js`]
    },
    server: {
        scripts: [
            `${serverPath}/**/!(*.spec|*.integration).js`,
            `!${serverPath}/config/local.env.sample.js`
        ],
        json: [`${serverPath}/**/*.json`],
        test: {
            // One can add globals.
            // integration: [`${serverPath}/**/*.integration.js`], // , 'mocha.global.js'],
            unit: [`${serverPath}/**/*.spec.js`] // , 'mocha.global.js']
        }
    },
    karma: 'karma.conf.js',
    dist: 'dist'
};

/********************
 * Helper functions
 ********************/

function onServerLog(log) {
    console.log(plugins.util.colors.white('[') +
        plugins.util.colors.yellow('nodemon') +
        plugins.util.colors.white('] ') +
        log.message);
}

function checkAppReady(cb) {
    let options = {
        host: 'localhost',
        port: config.port
    };
    http
        .get(options, () => cb(true))
        .on('error', () => cb(false));
}

// Call page until first success
function whenServerReady(cb) {
    let serverReady = false;
    let appReadyInterval = setInterval(() =>
        checkAppReady(ready => {
            if (!ready || serverReady) {
                return;
            }
            clearInterval(appReadyInterval);
            serverReady = true;
            cb();
        }),
        100);
}

/********************
 * Reusable pipelines
 ********************/

let lintClientScripts = lazypipe()
    .pipe(plugins.eslint, `${clientPath}/.eslintrc`)
    .pipe(plugins.eslint.format);

let lintServerScripts = lazypipe()
    .pipe(plugins.eslint, `${serverPath}/.eslintrc`)
    .pipe(plugins.eslint.format);

let transpileServer = lazypipe()
    .pipe(plugins.sourcemaps.init)
    .pipe(plugins.babel, {
        plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-runtime'
        ]
    })
    .pipe(plugins.sourcemaps.write, '.');

let mocha = lazypipe()
    .pipe(plugins.mocha, {
        reporter: 'spec',
        cubeRadius: 5000,
        require: [
            './mocha.conf'
        ]
    });

/********************
 * Env
 ********************/

var envall = (done) => {
    let localConfig;
    try {
        localConfig = require(`./${serverPath}/config/local.env`);
    } catch (e) {
        localConfig = {};
    }
    plugins.env({
        vars: localConfig
    });
    done();
};

var envtest = (done) => {
    plugins.env({
        vars: {NODE_ENV: 'test'}
    });
    done();
};

var envprod = (done) => {
    plugins.env({
        vars: {NODE_ENV: 'production'}
    });
    done();
};

/********************
 * Tasks
 ********************/

// Inject
var injectcss = () =>
    gulp.src(paths.client.mainStyle)
        .pipe(plugins.inject(
            gulp.src(
                _.union(paths.client.styles, ['!' + paths.client.mainStyle]), {read: false}
                )
                .pipe(plugins.sort()),
            {
                starttag: '/* inject:css */',
                endtag: '/* endinject */',
                transform: filepath => {
                    let newPath = filepath
                        .replace(`/${clientPath}/style/`, '')
                        .replace(/_(.*).css/, (match, p1, offset, string) => p1);
                    // console.log(newPath);
                    return `@import '${newPath}';`;
                }
            })
        )
        .pipe(gulp.dest(`${clientPath}/style/`))
;

var inject =
    gulp.series(injectcss);

// Webpack
var webpackdev = function(packLocal){ return function() {
    const webpackDevConfig = makeWebpackConfig({ DEV: true, LOCALSERVER: !!packLocal });
    return gulp.src(webpackDevConfig.entry.app)
        .pipe(plugins.plumber())
        .pipe(webpack(webpackDevConfig))
        .pipe(gulp.dest('.tmp'));
}};

var webpackdist = function(packLocal){ return function() {
    const webpackDistConfig = makeWebpackConfig({ BUILD: true, LOCALSERVER: !!packLocal });
    return gulp.src(webpackDistConfig.entry.app)
        .pipe(webpack(webpackDistConfig))
        .on('error', (err) => {
          console.log(err);
        })
        .pipe(gulp.dest(`${paths.dist}/client`));
}};

// var webpacktest = function() {
//     const webpackTestConfig = makeWebpackConfig({ TEST: true });
//     return gulp.src(webpackTestConfig.entry.app)
//         .pipe(webpack(webpackTestConfig))
//         .pipe(gulp.dest('.tmp'));
// };

// Transpile
var transpileserver = () => {
    return gulp.src(_.union(paths.server.scripts, paths.server.json))
        .pipe(transpileServer())
        .pipe(gulp.dest(`${paths.dist}/${serverPath}`));
};

// Code style
var lintscriptsclient = () => {
    return gulp.src(_.union(
        paths.client.scripts,
        _.map(paths.client.test, blob => '!' + blob)
    ))
        .pipe(lintClientScripts());
};

var lintscriptsserver = () => {
    return gulp.src(_.union(paths.server.scripts,
        _.map(paths.server.test, blob => '!' + blob)))
        .pipe(lintServerScripts());
};

gulp.task('lint:scripts',
    gulp.series(
        lintscriptsserver,
        lintscriptsclient,
    ));

// Clean
var cleantmp = () => {
    return del(['.tmp/**/*'], {dot: true})
};

// Start
var startclientdev = cb => {
    whenServerReady(() => {
        open('http://localhost:' + '9000', 'chrome'); // config.browserSyncPort);
        cb();
    });
};

var startclient = cb => {
    whenServerReady(() => {
        open('http://localhost:' + '8080', 'chrome'); // config.browserSyncPort);
        cb();
    });
};

var startserver = () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    config = require(`./${serverPath}/config/environment`);
    nodemon(`-w ${serverPath} ${serverPath}`)
        .on('log', onServerLog);
};

var startserverprod = () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    config = require(`./${paths.dist}/${serverPath}/config/environment`);
    nodemon(`-w ${paths.dist}/${serverPath} ${paths.dist}/${serverPath}`)
        .on('log', onServerLog);
};

var startserverdebug = () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    config = require(`./${serverPath}/config/environment`);
    // nodemon(`-w ${serverPath} --debug=5858 --debug-brk ${serverPath}`)
    nodemon(`-w ${serverPath} --inspect-brk ${serverPath}`)
        .on('log', onServerLog);
};

// Unit
var mochaunit = (d) => {
    return gulp.src(paths.server.test.unit)
        .pipe(mocha({ reporter: 'list', exit: true }))
        .once('error', () => {
            process.exit(1);
        })
        .once('end', () => {
            d();
        });
};

// var mochaintegration = () => {
//     return gulp.src(paths.server.test.integration)
//         .pipe(mocha({exit: true}));
// };

// Coverage

var coverageunit =
    shell.task([
        `cross-env NODE_ENV=test nyc --reporter=html mocha ${paths.server.test.unit[0]}`,
    ])
;

// var coverageintegration =
//     shell.task([
//         `cross-env NODE_ENV=test nyc --reporter=html mocha ${paths.server.test.integration[0]}`,
//     ])
// ;

gulp.task('test:server',
    gulp.series(
        envall,
        envtest,
        mochaunit //,
        // mochaintegration
    ));

gulp.task('coverage:server',
    gulp.series(
        coverageunit
    ));

gulp.task('test:client', done => {
    new KarmaServer({
      configFile: `${__dirname}/${paths.karma}`,
      singleRun: true
    }, err => {
        done(err);
        process.exit(err);
    }).start();
});

// gulp.task('test',
//     gulp.series(
//         'test:server',
//         'test:client'));

/********************
 * Build
 ********************/

var cleandist = () => {
    return del([`${paths.dist}/!(.git*|Procfile)**`], {dot: true});
};

var buildimages = () => {
    return gulp.src(paths.client.images)
        // .pipe(imagemin([
        //     imagemin.optipng({optimizationLevel: 5}),
        //     imagemin.mozjpeg({progressive: true}),
        //     imagemin.gifsicle({interlaced: true}),
        //     imagemin.svgo({plugins: [{removeViewBox: false}]})
        // ]))
        .pipe(plugins.rev())
        .pipe(gulp.dest(`${paths.dist}/${clientPath}/assets/images`))
        .pipe(plugins.rev.manifest(`${paths.dist}/${paths.client.revManifest}`, {
            base: `${paths.dist}/${clientPath}/assets`,
            merge: true
        }))
        .pipe(gulp.dest(`${paths.dist}/${clientPath}/assets`));
};

var revReplaceWebpack = function() {
    return gulp.src('dist/client/app.*.js')
        .pipe(plugins.revReplace({manifest: gulp.src(`${paths.dist}/${paths.client.revManifest}`)}))
        .pipe(gulp.dest('dist/client'));
};

var copyextras = () => {
    return gulp.src([
        `${clientPath}/favicon.ico`,
        `${clientPath}/robots.txt`,
        `${clientPath}/.htaccess`
    ], { dot: true })
        .pipe(gulp.dest(`${paths.dist}/${clientPath}`));
};

// turns 'bootstrap/fonts/font.woff' into 'bootstrap/font.woff'
function flatten() {
    return through2.obj(function(file, enc, next) {
        if(!file.isDirectory()) {
            try {
                let dir = path.dirname(file.relative).split(path.sep)[0];
                let fileName = path.normalize(path.basename(file.path));
                file.path = path.join(file.base, path.join(dir, fileName));
                this.push(file);
            } catch(e) {
                this.emit('error', new Error(e));
            }
        }
        next();
    });
}

var copyfontsdev = () => {
    return gulp.src('node_modules/{bootstrap,font-awesome}/fonts/*')
        .pipe(flatten())
        .pipe(gulp.dest(`${clientPath}/assets/fonts`));
};
var copyfontsdist = () => {
    return gulp.src('node_modules/{bootstrap,font-awesome}/fonts/*')
        .pipe(flatten())
        .pipe(gulp.dest(`${paths.dist}/${clientPath}/assets/fonts`));
};

var copyassets = () => {
    return gulp.src([paths.client.assets, '!' + paths.client.images])
        .pipe(gulp.dest(`${paths.dist}/${clientPath}/assets`));
};

var copyserver = () => {
    return gulp.src([
        'package.json'
    ], {cwdbase: true})
        .pipe(gulp.dest(paths.dist));
};

var bundleServerInClient = true;

// MAIN TASKS
gulp.task('serve',
    gulp.series(
        gulp.parallel(
            cleantmp,
            // lintscripts, // TODO [FFF] correct errors here
            inject,
            copyfontsdev,
            envall),
        webpackdev(bundleServerInClient),
        gulp.parallel(
            startserver,
            startclientdev
        ),
    ));

// TODO [FFF] update to karma-webpack 4

gulp.task('serve:debug',
    gulp.series(
        gulp.parallel(
            cleantmp,
            // 'lint:scripts',
            inject,
            copyfontsdev,
            envall),
        webpackdev(bundleServerInClient),
        gulp.parallel(
            startserverdebug,
            startclientdev),
    ));


gulp.task('build',
    gulp.series(
        gulp.parallel(
            cleandist,
            cleantmp
        ),
        inject,
        transpileserver,
        gulp.parallel(
            buildimages
        ),
        gulp.parallel(
            copyextras,
            copyassets,
            copyfontsdist,
            copyserver,
            webpackdist(bundleServerInClient)
        ),
        // revReplaceWebpack
    ));

gulp.task('serve:dist',
    gulp.series(
        'build',
        envall,
        envprod,
        gulp.parallel(
            startserverprod,
            startclient)));
