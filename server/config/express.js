/**
 * Express configuration
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (app) {
    var env = app.get('env');

    app.set('views', _environment2.default.root + '/server/views');
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.use((0, _compression2.default)());
    app.use(_bodyParser2.default.urlencoded({ extended: false }));
    app.use(_bodyParser2.default.json());
    app.use((0, _methodOverride2.default)());
    app.use((0, _cookieParser2.default)());
    app.use(_passport2.default.initialize());

    /**
     * Lusca - express server security
     * https://github.com/krakenjs/lusca
     */
    if ('test' !== env) {
        app.use((0, _lusca2.default)({
            csrf: false,
            xframe: 'SAMEORIGIN',
            hsts: {
                maxAge: 31536000, // 1 year, in seconds
                includeSubDomains: true,
                preload: true
            },
            xssProtection: true
        }));
    }

    app.set('appPath', _path2.default.join(_environment2.default.root, 'client'));

    if ('production' === env) {
        app.use((0, _serveFavicon2.default)(_path2.default.join(_environment2.default.root, 'client', 'favicon.ico')));
        app.use(_express2.default.static(app.get('appPath')));
        app.use((0, _morgan2.default)('dev'));
    }

    if ('development' === env) {
        app.use(require('connect-livereload')());
    }

    if ('development' === env || 'test' === env) {
        app.use(_express2.default.static(_path2.default.join(_environment2.default.root, '.tmp')));
        app.use(_express2.default.static(app.get('appPath')));
        app.use((0, _morgan2.default)('dev'));
        app.use((0, _errorhandler2.default)()); // Error handler - has to be last
    }
};

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _serveFavicon = require('serve-favicon');

var _serveFavicon2 = _interopRequireDefault(_serveFavicon);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _methodOverride = require('method-override');

var _methodOverride2 = _interopRequireDefault(_methodOverride);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _errorhandler = require('errorhandler');

var _errorhandler2 = _interopRequireDefault(_errorhandler);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lusca = require('lusca');

var _lusca2 = _interopRequireDefault(_lusca);

var _environment = require('./environment');

var _environment2 = _interopRequireDefault(_environment);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=express.js.map
