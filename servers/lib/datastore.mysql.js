/*
 MySQL Module
 */
var mysql = require('mysql');

function MySQL(settings){
    this.settings = {
        host     : settings.host,
        user     : settings.user,
        password : settings.password,
        database : settings.database,
        multipleStatements : true,
        autoCloseConnection: true,
        querySentTime      : 1000
    };

    this.connection = null;
    this.batch = { queries: [], callbacks: [] };

    this.reconnectCount = 0;
    this.reconnectMax = 5;
    this.reconnectTimer = null;
    this.reconnectTimeDefault = 1000;
    this.reconnectTimeDefault += Math.round(this.reconnectTimeDefault*Math.random());
    this.reconnectTime = this.reconnectTimeDefault;

    this.querySentTimer = null;
    this.querySentTime = 1000;

    if(settings.reconnectTimeout) {
        this.reconnectTimeDefault = settings.reconnectTimeout;
        this.reconnectTimeDefault += Math.round(this.reconnectTimeDefault*Math.random());
        this.reconnectTime = this.reconnectTimeDefault;
    }

    if(settings.reconnectMaxTries) {
        this.reconnectMax = settings.reconnectMaxTries;
    }

    if(settings.querySentTime) {
        this.querySentTime = settings.querySentTime;
    }
}

MySQL.prototype.escape = mysql.escape;

MySQL.prototype.clearTimers = function() {
    if(this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    // stop trying to sending queries
    if(this.querySentTimer) {
        clearInterval(this.querySentTimer);
        this.querySentTimer = null;
    }
};

MySQL.prototype.testConnection = function(done){
    // test connection
    this.connect(function(){
        if(this.connection) {
            this.connection.end();
            this.connection = null;

            if(done) done();
        }
    }.bind(this));
}

MySQL.prototype.connect = function(callback)
{
    if(this.connection) {
        this.connection.end();
        this.connection = null;
    }

    this.clearTimers();

    try {
        this.connection = mysql.createConnection(this.settings);

        if(this.connection) {
            this.connection.connect(function(err) {
                if (err) {
                    console.error("MySQL: connect error -", err);
                    this.reconnect();
                } else {
                    if(!this.settings.autoCloseConnection || (this.reconnectCount != 0)) {
                        console.log("MySQL: connected");
                    }

                    this.reconnectCount = 0;
                    this.reconnectTime = this.reconnectTimeDefault;

                    if(!this.connection){
                        this.reconnect();
                        return;
                    }

                    // all connected run callback
                    if(callback) {
                        callback();
                    }
                }
            }.bind(this));

            this.connection.on("error", function(err) {
                console.error("MySQL: error -", err);
                if(err.code === "PROTOCOL_CONNECTION_LOST") {
                    this.reconnect();
                }
            }.bind(this));
        }
    }
    catch(e) {
        console.trace(e);
        console.error("MySQL: failed -", e);
        this.connection = null;
    }
};

MySQL.prototype.query = function(query, callback) {
    this.connect(function(){
        if(this.connection) {
            // send query
            this.connection.query( query, function(){
                if(this.settings.autoCloseConnection) {
                    if(this.connection) {
                        this.connection.end();
                        this.connection = null;
                    }
                }

                callback.apply(callback, arguments);
            }.bind(this));
        } else {
            console.trace("MySQL: query - no connection");
        }
    }.bind(this));
}

/*
 don't use with multi selects
 */
MySQL.prototype.addQuery = function(query, callback) {
    this.batch.queries.push(query);
    this.batch.callbacks.push(callback);
};

MySQL.prototype.sendQueries = function() {
    if(this.batch.queries.length > 0) {
        if(this.connection) {
            // send batch queries
            this.connection.query( this.batch.queries.join(';'), function(err){
                this.batch.queries = [];

                if(this.settings.autoCloseConnection) {
                    if(this.connection) {
                        this.connection.end();
                        this.connection = null;
                    }
                }

                for(var c in this.batch.callbacks) {
                    this.batch.callbacks[c].apply(this.batch.callbacks[c], arguments);
                }
                this.batch.callbacks = [];
            }.bind(this));
        }
        else {
            if(this.settings.autoCloseConnection) {
                this.connect(function() {
                    // start timer
                    this.querySentTimer = setInterval(function(){
                        this.sendQueries();
                    }.bind(this), this.querySentTime);
                }.bind(this));
            }
        }
    }
};

MySQL.prototype.reconnect = function() {
    if(this.connection) {
        this.connection.end();
        this.connection = null;
    }

    if(this.reconnectTimer == null) {
        if(this.reconnectCount < this.reconnectMax) {
            console.warn("MySQL: Reconnecting in", Math.round(this.reconnectTime/1000), "seconds");

            this.reconnectTimer = setTimeout(this.connect.bind(this), this.reconnectTime);
            this.reconnectTime += this.reconnectTime + Math.round(this.reconnectTime*Math.random());

            this.reconnectCount++;
        }
    }
};

module.exports = MySQL;
