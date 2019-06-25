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
import {Server as KarmaServer} from 'karma';
// import {Instrumenter} from 'isparta';
import {Instrumenter} from 'istanbul';
import webpack from 'webpack-stream';
import makeWebpackConfig from './webpack.make';

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
            integration: [`${serverPath}/**/*.integration.js`], // , 'mocha.global.js'],
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

const lintClientTestScripts = lazypipe()
    .pipe(plugins.eslint, {
        configFile: `${clientPath}/.eslintrc`,
        envs: [
            'browser',
            'es6',
            'mocha'
        ]
    })
    .pipe(plugins.eslint.format);

let lintServerScripts = lazypipe()
    .pipe(plugins.eslint, `${serverPath}/.eslintrc`)
    .pipe(plugins.eslint.format);

let lintServerTestScripts = lazypipe()
    .pipe(plugins.eslint, {
        configFile: `${serverPath}/.eslintrc`,
        envs: [
            'node',
            'es6',
            'mocha'
        ]
    })
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
        timeout: 5000,
        require: [
            './mocha.conf'
        ]
    });

let istanbul = lazypipe()
    .pipe(plugins.istanbul.writeReports)
    .pipe(plugins.istanbulEnforcer, {
        thresholds: {
            global: {
                lines: 80,
                statements: 80,
                branches: 80,
                functions: 80
            }
        },
        coverageDirectory: './coverage',
        rootDirectory : ''
    });

/********************
 * Env
 ********************/

gulp.task('env:all', (done) => {
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
});
gulp.task('env:test', (done) => {
    plugins.env({
        vars: {NODE_ENV: 'test'}
    });
    done();
});
gulp.task('env:prod', (done) => {
    plugins.env({
        vars: {NODE_ENV: 'production'}
    });
    done();
});

/********************
 * Tasks
 ********************/

// INJECT
gulp.task('inject:css', () =>
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
);

gulp.task('inject',
    gulp.series('inject:css'));

// WEBPACK
gulp.task('webpack:dev', function() {
    const webpackDevConfig = makeWebpackConfig({ DEV: true });
    return gulp.src(webpackDevConfig.entry.app)
        .pipe(plugins.plumber())
        .pipe(webpack(webpackDevConfig))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('webpack:dist', function() {
    const webpackDistConfig = makeWebpackConfig({ BUILD: true });
    return gulp.src(webpackDistConfig.entry.app)
        .pipe(webpack(webpackDistConfig))
        .on('error', (err) => {
          console.log(err);
        })
        .pipe(gulp.dest(`${paths.dist}/client`));
});

gulp.task('webpack:test', function() {
    const webpackTestConfig = makeWebpackConfig({ TEST: true });
    return gulp.src(webpackTestConfig.entry.app)
        .pipe(webpack(webpackTestConfig))
        .pipe(gulp.dest('.tmp'));
});

// STYLES
gulp.task('styles', () =>
    gulp.src(paths.client.styles)
        .pipe(styles())
        .pipe(gulp.dest('.tmp/app'))
);

// TRANSPILE
gulp.task('transpile:server', () => {
    return gulp.src(_.union(paths.server.scripts, paths.server.json))
        .pipe(transpileServer())
        .pipe(gulp.dest(`${paths.dist}/${serverPath}`));
});

// LINT

gulp.task('lint:scripts:client', () => {
    return gulp.src(_.union(
        paths.client.scripts,
        _.map(paths.client.test, blob => '!' + blob)
    ))
        .pipe(lintClientScripts());
});

gulp.task('lint:scripts:server', () => {
    return gulp.src(_.union(paths.server.scripts,
        _.map(paths.server.test, blob => '!' + blob)))
        .pipe(lintServerScripts());
});

gulp.task('lint:scripts:clientTest', () => {
    return gulp.src(paths.client.test)
        .pipe(lintClientScripts());
});

gulp.task('lint:scripts:serverTest', () => {
    return gulp.src(paths.server.test)
        .pipe(lintServerTestScripts());
});

gulp.task('lint:scripts',
    gulp.parallel(
        'lint:scripts:client',
        'lint:scripts:server'));

// JSCS
gulp.task('jscs', () => {
  return gulp.src(_.union(paths.client.scripts, paths.server.scripts))
      .pipe(plugins.jscs())
      .pipe(plugins.jscs.reporter());
});

// CLEAN
gulp.task('clean:tmp', () => {
    return del(['.tmp/**/*'], {dot: true})
});

// START
gulp.task('start:client', cb => {
    whenServerReady(() => {
        open('http://localhost:' + '9000', 'chrome'); // config.browserSyncPort);
        cb();
    });
});

gulp.task('start:server', () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    config = require(`./${serverPath}/config/environment`);
    nodemon(`-w ${serverPath} ${serverPath}`)
        .on('log', onServerLog);
});

gulp.task('start:server:prod', () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    config = require(`./${paths.dist}/${serverPath}/config/environment`);
    nodemon(`-w ${paths.dist}/${serverPath} ${paths.dist}/${serverPath}`)
        .on('log', onServerLog);
});

gulp.task('start:server:debug', () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    config = require(`./${serverPath}/config/environment`);
    // nodemon(`-w ${serverPath} --debug=5858 --debug-brk ${serverPath}`)
    nodemon(`-w ${serverPath} --inspect --debug-brk ${serverPath}`)
        .on('log', onServerLog);
});

// WATCH
gulp.task('watch', () => {
    var testFiles = _.union(
        paths.client.test,
        paths.server.test.unit,
        paths.server.test.integration);

    plugins.watch(_.union(paths.server.scripts, testFiles))
        .pipe(plugins.plumber())
        .pipe(lintServerScripts());

    plugins.watch(_.union(paths.server.test.unit, paths.server.test.integration))
        .pipe(plugins.plumber())
        .pipe(lintServerTestScripts());
});

// UNIT TESTING
gulp.task('mocha:unit', (d) => {
    return gulp.src(paths.server.test.unit)
        .pipe(mocha({ reporter: 'list', exit: true }))
        .once('error', () => {
            process.exit(1);
        })
        .once('end', () => {
            d();
        });
});

gulp.task('mocha:integration', () => {
    return gulp.src(paths.server.test.integration)
        .pipe(mocha({exit: true}));
});

// COVERAGE TESTING
gulp.task('coverage:pre', () => {
  return gulp.src(paths.server.scripts)
    // Covering files
    .pipe(plugins.istanbul({
        // instrumenter: Instrumenter, // Use the isparta instrumenter (code coverage for ES6)
        instrumenter: Instrumenter, // Use the istanbul instrumenter (code coverage for ES6)
        includeUntested: true
    }))
    // Force `require` to return covered files
    .pipe(plugins.istanbul.hookRequire());
});

gulp.task('coverage:unit', () => {
    return gulp.src(paths.server.test.unit)
        .pipe(mocha({exit: true}))
        .pipe(istanbul())
        // Creating the reports after tests ran
});

gulp.task('coverage:integration', () => {
    return gulp.src(paths.server.test.integration)
        .pipe(mocha({exit: true}))
        .pipe(istanbul())
        // Creating the reports after tests ran
});

gulp.task('test:server',
    gulp.series(
        'env:all',
        'env:test',
        'mocha:unit',
        'mocha:integration'
    ));

gulp.task('test:server:coverage',
    gulp.series('coverage:pre',
        'env:all',
        'env:test',
        'coverage:unit',
        'coverage:integration'));

gulp.task('test:client', done => {
    new KarmaServer({
      configFile: `${__dirname}/${paths.karma}`,
      singleRun: true
    }, err => {
        done(err);
        process.exit(err);
    }).start();
});

gulp.task('test',
    gulp.series(
        'test:server',
        'test:client'));

/********************
 * Build
 ********************/

gulp.task('clean:dist', () => {
    return del([`${paths.dist}/!(.git*|.openshift|Procfile)**`], {dot: true});
});

gulp.task('build:images', () => {
    return gulp.src(paths.client.images)
        .pipe(plugins.imagemin([
            plugins.imagemin.optipng({optimizationLevel: 5}),
            plugins.imagemin.jpegtran({progressive: true}),
            plugins.imagemin.gifsicle({interlaced: true}),
            plugins.imagemin.svgo({plugins: [{removeViewBox: false}]})
        ]))
        .pipe(plugins.rev())
        .pipe(gulp.dest(`${paths.dist}/${clientPath}/assets/images`))
        .pipe(plugins.rev.manifest(`${paths.dist}/${paths.client.revManifest}`, {
            base: `${paths.dist}/${clientPath}/assets`,
            merge: true
        }))
        .pipe(gulp.dest(`${paths.dist}/${clientPath}/assets`));
});

gulp.task('revReplaceWebpack', function() {
    return gulp.src('dist/client/app.*.js')
        .pipe(plugins.revReplace({manifest: gulp.src(`${paths.dist}/${paths.client.revManifest}`)}))
        .pipe(gulp.dest('dist/client'));
});

gulp.task('copy:extras', () => {
    return gulp.src([
        `${clientPath}/favicon.ico`,
        `${clientPath}/robots.txt`,
        `${clientPath}/.htaccess`
    ], { dot: true })
        .pipe(gulp.dest(`${paths.dist}/${clientPath}`));
});

/**
 * turns 'bootstrap/fonts/font.woff' into 'bootstrap/font.woff'
 */
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
gulp.task('copy:fonts:dev', () => {
    return gulp.src('node_modules/{bootstrap,font-awesome}/fonts/*')
        .pipe(flatten())
        .pipe(gulp.dest(`${clientPath}/assets/fonts`));
});
gulp.task('copy:fonts:dist', () => {
    return gulp.src('node_modules/{bootstrap,font-awesome}/fonts/*')
        .pipe(flatten())
        .pipe(gulp.dest(`${paths.dist}/${clientPath}/assets/fonts`));
});

gulp.task('copy:assets', () => {
    return gulp.src([paths.client.assets, '!' + paths.client.images])
        .pipe(gulp.dest(`${paths.dist}/${clientPath}/assets`));
});

gulp.task('copy:server', () => {
    return gulp.src([
        'package.json'
    ], {cwdbase: true})
        .pipe(gulp.dest(paths.dist));
});

// MAIN TASKS
gulp.task('build',
    gulp.series(
        gulp.parallel(
            'clean:dist',
            'clean:tmp'),
        'inject',
        'transpile:server',
        gulp.parallel(
            'build:images'),
        gulp.parallel(
            'copy:extras',
            'copy:assets',
            'copy:fonts:dist',
            'copy:server',
            'webpack:dist'),
        // 'revReplaceWebpack'
    ));

gulp.task('serve',
    gulp.series(
        gulp.parallel(
            'clean:tmp',
            // 'lint:scripts', // TODO [FFF] correct errors here
            'inject',
            'copy:fonts:dev',
            'env:all'),
        'webpack:dev',
        gulp.parallel(
            'start:server',
            'start:client'),
        'watch'));

// TODO [FFF] update to karma-webpack 4

gulp.task('serve:debug',
    gulp.series(
        gulp.parallel(
            'clean:tmp',
            'lint:scripts',
            'inject',
            'copy:fonts:dev',
            'env:all'),
        'webpack:dev',
        gulp.parallel(
            'start:server:debug',
            'start:client'),
        'watch'));

gulp.task('serve:dist',
    gulp.series(
        'build',
        'env:all',
        'env:prod',
        gulp.parallel(
            'start:server:prod',
            'start:client')));
