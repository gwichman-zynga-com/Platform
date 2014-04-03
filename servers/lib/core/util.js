/**
 * Util Module
 *
 * Module dependencies:
 *   when - https://github.com/cujojs/when
 *
 */
var moment = require('moment');
var when   = require('when');
var _      = require('lodash');

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function convertToString(item) {
    if(!item) {
        item = "";
    }
    else if(!_.isString(item)) {
        item = item.toString();
    }
    return item;
}

function promiseContinue(){
    return when.promise( function(resolve){
        resolve();
    });
}

// build valid URI/URL
function buildUri(options, path) {
    var uri = "";

    if(options.protocol) {
        uri += options.protocol+"//";
    } else {
        uri += "http://";
    }

    if(options.host) {
        uri += options.host;
    } else {
        uri += "localhost";
    }

    if(options.port) {
        uri += ":"+options.port;
    }

    if(path && _.isString(path)) {
        // make sure first char is a slash
        if(path.charAt(0) != '/') {
            uri += "/";
        }
        uri += path;
    }

    return uri;
}

// seconds from Unix Epoch
function getTimeStamp(dt){
    if(!dt) {
        dt = moment.utc();
    } else if (dt instanceof Date) {
        dt = moment.utc(dt);
    }

    return dt.unix();
}

function getExpressLogger(options, express, stats){
    express.logger.token('remote-addy', function(req, res){
        if( req.headers.hasOwnProperty('x-forwarded-for') ){
            return req.headers['x-forwarded-for'];
        } else {
            return req.connection.remoteAddress;
        }
    });

    return express.logger(function(t, req, res){
        var rTime = t['response-time'](req, res);
        var contentLength = t['res'](req, res, 'content-length');
        var status = t['status'](req, res);
        var url = t['url'](req, res);

        if(stats) {
            // split url by /
            var URL = url;
            if(URL.charAt(0) == '/') {
                URL = URL.slice(1);
            }
            URL = URL.replace('//', '/');

            var ulist = URL.split('/');
            // capitalize each key
            if(ulist.length > 0) {
                // merge to dots
                URL = ulist.join('.');
            } else {
                URL = "Root";
            }

            stats.gauge("info", "Route.ResponseTime."+URL, rTime);

            if(ulist.length > 0 &&
                ulist[0] == 'api') {
                stats.gauge("info", "Route.Api.ResponseTime", rTime);
            } else {
                stats.gauge("info", "Route.Static.ResponseTime", rTime);
            }

            stats.saveRoot();
            if(ulist.length > 0 &&
                ulist[0] == 'api') {
                stats.setRoot('Route.Api');
            } else {
                // static
                stats.setRoot('Route.Static');
            }
            stats.gauge("info", "ResponseTime", rTime);
            stats.restoreRoot();
        }

        // status is null
        if(!status) {
            console.error("Error null status for response!!!");
            status = "";
        }

        return t['remote-addy'](req, res)+' - - ['+
            t['date'](req, res)+'] "'+
            t['method'](req, res)+' '+
            url+' HTTP/'+
            t['http-version'](req, res)+'" '+
            status+' '+
            (contentLength || '-')+' "'+
            (t['referrer'](req, res) || '-')+'" "'+
            (t['user-agent'](req, res) || '-')+'" ('+
            rTime+' ms)';
    });

    /*
     var logFormat = ':remote-addy - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" (:response-time ms)';
     return express.logger(logFormat);
     */
}

module.exports = {
    Request: require('./util.request.js'),
    Stats:   require('./util.stats.js'),
    Email:   require('./util.email.js'),
    ConvertToString:  convertToString,
    PromiseContinue:  promiseContinue,
    GetExpressLogger: getExpressLogger,
    GetTimeStamp:     getTimeStamp,
    BuildURI:         buildUri,
    String: {
        capitalize: capitalize
    }
};