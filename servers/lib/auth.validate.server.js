/**
 * Authentication Server Module
 *
 * Module dependencies:
 *  lodash     - https://github.com/lodash/lodash
 *  express    - https://github.com/visionmedia/express
 *
 */
var http       = require('http');
var path       = require('path');
// Third-party libs
var _          = require('lodash');
var express    = require('express');
var passport   = require('passport');
var couchbase  = require('couchbase');

// load at runtime
var aConst, rConst, RequestUtil, SessionServer;

module.exports = AuthValidateServer;

function AuthValidateServer(options){
    try {
        // Glasslab libs
        aConst        = require('./auth.js').Const;
        rConst        = require('./routes.js').Const;
        RequestUtil   = require('./util.js').Request;
        SessionServer = require('./auth.js').SessionServer;

        this.options = _.merge(
            {
                validate: { port: 8083 },
                sessionstore: { readonly: true }
            },
            options
        );

        this.app = express();
        this.app.set('port', this.options.validate.port);
        this.sessionServer = new SessionServer(this.options, this.app, this.setupRoutes.bind(this));
        this.requestUtil   = new RequestUtil(this.options);

        // start server
        http.createServer(this.app).listen(this.app.get('port'), function createServer(){
            console.log('---------------------------------------------');
            console.log('AuthValidate: Server listening on port ' + this.app.get('port'));
            console.log('---------------------------------------------');
        }.bind(this));

    } catch(err){
        console.trace("AuthValidate: Error -", err);
    }
}

AuthValidateServer.prototype.setupRoutes = function() {
    try {
        // GET
        this.app.get(rConst.api.wa_session.validate,    this.validateWASession.bind(this));
        this.app.get(rConst.api.session.validateWithId, this.validateSession.bind(this));
        this.app.get(rConst.api.session.validateNoId,   this.validateSession.bind(this));

        // DEFAULT
        this.app.use(function defaultRoute(req, res) {
            console.log("defaultRoute:", req.path);
            res.redirect(rConst.root);
        }.bind(this));

    } catch(err){
        console.trace("AuthValidate: setupRoutes Error -", err);
    }
};

AuthValidateServer.prototype.validateSession = function(req, res, next) {
    console.log("validate Session:", req.path);
    // only allow local connections
    if(req.connection.remoteAddress == "127.0.0.1")
    {
        if( req.params.id ) {
            // using real session get webapp session
            this.sessionServer.getSession(req.params.id, function(err, result) {
                if(err) {
                    console.error("CouchBase validateSession: Error -", err);
                    this.requestUtil.errorResponse(res, err.toString());
                }

                //console.log("result:", result.value);
                if( result &&
                    result.value &&
                    result.value.passport &&
                    result.value.passport.user) {
                    var data = this.sessionServer.buildWASession(result.value.passport.user.wa_session);

                    data.userId = result.value.passport.user.id;
                    data.collectTelemetry = result.value.passport.user.collectTelemetry;
                    this.requestUtil.jsonResponse(res, data);
                } else {
                    this.requestUtil.errorResponse(res, "missing session");
                }
            }.bind(this));
        } else {
            //console.log("session:", req.session);
            this.sessionServer.getCookieWASession(req, function(err, data){
                if(err) {
                    return this.requestUtil.errorResponse(res, err);
                }

                if( req.session &&
                    req.session.passport &&
                    req.session.passport.user ){
                    data.userId = req.session.passport.user.id;
                    data.collectTelemetry = req.session.passport.user.collectTelemetry;
                }
                this.requestUtil.jsonResponse(res, data);
            }.bind(this));
        }

    } else {
        console.error("CouchBase validateSession invalid remoteAddress ", req.connection.remoteAddress);
        next();
    }
};

AuthValidateServer.prototype.validateWASession = function(req, res, next) {
    console.log("validate WA-Session:", req.path);
    // only allow local connections
    if(req.connection.remoteAddress == "127.0.0.1")
    {
        if( req.params.id ) {
            // using webapp session get real session
            this.sessionServer.getWASession(req.params.id, function(err, result) {
                if(err) {
                    console.error("CouchBase validateSession: Error -", err);
                    this.requestUtil.errorResponse(res, err.toString());
                }

                if( result &&
                    result.value) {
                    console.log("CouchBase SessionStore: value:", result.value);

                    if(result.value.session) {
                        this.sessionServer.getSession(result.value.session, function(err, result) {
                            if(err) {
                                console.error("CouchBase validateSession: Error -", err);
                                this.requestUtil.errorResponse(res, err.toString());
                            }

                            if(result.value.passport.user) {
                                this.requestUtil.jsonResponse(res, result.value.passport);
                            } else {
                                this.requestUtil.errorResponse(res, "No user data");
                            }
                        }.bind(this));

                    } else {
                        // request for missing session
                        res.end();
                    }

                } else {
                    // request for missing session
                    //res.end();
                    console.error("CouchBase validateSession: could not find session");
                    this.requestUtil.errorResponse(res, "could not find session");
                }

            }.bind(this));
        } else {
            this.requestUtil.errorResponse(res, "Missing ID");
        }
    } else {
        console.error("CouchBase validateSession invalid remoteAddress ", req.connection.remoteAddress);
        next();
    }
};