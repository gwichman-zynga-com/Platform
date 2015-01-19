var _         = require('lodash');
var when      = require('when');
//
var Util      = require('../../core/util.js');
var dConst    = require('../dash.const.js');
var fs = require('fs');

module.exports = {
    getActiveGamesBasicInfo: getActiveGamesBasicInfo,
    getGamesBasicInfo:       getGamesBasicInfo,
    getActiveGamesDetails:   getActiveGamesDetails,
    getMyGames:              getMyGames,
    reloadGameFiles:         reloadGameFiles,
    migrateInfoFiles:        migrateInfoFiles,
    getDeveloperProfile:     getDeveloperProfile,
    getDeveloperGameIds:     getDeveloperGameIds,
    getDeveloperGamesInfo:   getDeveloperGamesInfo,
    updateDeveloperGameInfo: updateDeveloperGameInfo
};

var exampleIn = {};
var exampleOut = {};

// no input
function getActiveGamesBasicInfo(req, res){
    try {
        var loginType = "guest";
        var promise = null;
        var gameIds;
        var outGames = [];
        if( req.session &&
            req.session.passport &&
            req.session.passport.user ) {
            var userData = req.session.passport.user;
            loginType = userData.loginType;

            promise = this.dashStore.getLicensedGameIdsFromUserId(userData.id);
        } else {
            promise = Util.PromiseContinue();
        }

        promise.then(function(licenseGameIds){
            // ensure licenseGameIds is object
            if(!licenseGameIds) { licenseGameIds = {}; }

            // TODO: replace with promise
            this.getListOfVisibleGameIds()
                .then(function(ids){
                    gameIds = ids;
                    var promiseList = [];
                    gameIds.forEach(function (gameId) {
                        promiseList.push(this.getGameBasicInfo(gameId));
                    }.bind(this) );
                    return when.all(promiseList);
                }.bind(this) )
                .then(function(promiseList){
                    for(var i = 0; i < gameIds.length; i++) {
                        var gameId = gameIds[i];

                        var info = _.cloneDeep(promiseList[i]);

                        // TODO: move license check to it's own function
                        info.license.valid = false;
                        if(info.license.type == "free") {
                            info.license.valid = true;
                        }
                        else if(info.license.type == "loginType") {
                            info.license.loginType = info.license.loginType.split(',');
                            if( _.contains(info.license.loginType, loginType) ) {
                                info.license.valid = true;
                            }
                        } else {
                            // check license
                            info.license.valid = licenseGameIds.hasOwnProperty(gameId);
                        }

                        // no maintenance message and if invalid lic, replace with invalid lic message
                        if(!info.maintenance && !info.license.valid) {
                            info.maintenance = { message: info.license.message.invalid };
                        }

                        outGames.push( info );
                    }

                    this.requestUtil.jsonResponse(res, outGames);

                }.bind(this) );
        }.bind(this) )

        // catch all errors
        .then(null, function(err) {
            this.requestUtil.errorResponse(res, err);
        }.bind(this) );

    } catch(err) {
        console.trace("Reports: Get Game Basic Info Error -", err);
        this.stats.increment("error", "GetGameBasicInfo.Catch");
    }
}


// no input
function getGamesBasicInfo(req, res){
    try {
        var loginType = "guest";
        var promise = null;
        var gameIds;
        var outGames = [];
        if( req.session &&
            req.session.passport &&
            req.session.passport.user ) {
            var userData = req.session.passport.user;
            loginType = userData.loginType;

            promise = this.dashStore.getLicensedGameIdsFromUserId(userData.id);
        } else {
            promise = Util.PromiseContinue();
        }

        promise.then(function(licenseGameIds){
                // ensure licenseGameIds is object
                if(!licenseGameIds) { licenseGameIds = {}; }

                // TODO: replace with promise
                this.getListOfAllGameIds()
                    .then(function(ids){
                        gameIds = ids;
                        var promiseList = [];
                        gameIds.forEach(function (gameId) {
                            promiseList.push(this.getGameBasicInfo(gameId));
                        }.bind(this) );
                        return when.all(promiseList);
                    }.bind(this) )
                    .then(function(promiseList){
                        for(var i = 0; i < gameIds.length; i++) {
                            var gameId = gameIds[i];

                            var info = _.cloneDeep(promiseList[i]);

                            // TODO: move license check to it's own function
                            info.license.valid = false;
                            if(info.license.type == "free") {
                                info.license.valid = true;
                            }
                            else if(info.license.type == "loginType") {
                                info.license.loginType = info.license.loginType.split(',');
                                if( _.contains(info.license.loginType, loginType) ) {
                                    info.license.valid = true;
                                }
                            } else {
                                // check license
                                info.license.valid = licenseGameIds.hasOwnProperty(gameId);
                            }

                            // no maintenance message and if invalid lic, replace with invalid lic message
                            if(!info.maintenance && !info.license.valid) {
                                info.maintenance = { message: info.license.message.invalid };
                            }

                            outGames.push( info );
                        }

                        this.requestUtil.jsonResponse(res, outGames);

                    }.bind(this) );
            }.bind(this) )

            // catch all errors
            .then(null, function(err) {
                this.requestUtil.errorResponse(res, err);
            }.bind(this) );

    } catch(err) {
        console.trace("Reports: Get Game Basic Info Error -", err);
        this.stats.increment("error", "GetGameBasicInfo.Catch");
    }
}


function getActiveGamesDetails(req, res){
    try {
        var loginType = "guest";
        var promise = null;
        var outGames = [];
        if( req.session &&
            req.session.passport &&
            req.session.passport.user ) {
            var userData = req.session.passport.user;
            loginType = userData.loginType;

            promise = this.dashStore.getLicensedGameIdsFromUserId(userData.id);
        } else {
            promise = Util.PromiseContinue();
        }

        promise.then(function(licenseGameIds) {
            // ensure licenseGameIds is object
            if(!licenseGameIds) { licenseGameIds = {}; }

            // TODO: replace with promise
            return this.getListOfVisibleGameIds()

        }.bind(this) )
        .then(function(games){
            var promiseList = [];
            games.forEach(function(gameId){
                promiseList.push(this.getGameDetails(gameId));
            }.bind(this) );
            return when.all(promiseList);
        }.bind(this) )
        .then(function(promiseList){
            // promiseList, once resolved, contains details from various games
            promiseList.forEach(function(gameDetails){
                var info = _.cloneDeep(gameDetails);

                // TODO: move license check to it's own function
                info.license.valid = false;
                if(info.license.type == "free") {
                    info.license.valid = true;
                }
                else if(info.license.type == "loginType") {
                    info.license.loginType = info.license.loginType.split(',');
                    if( _.contains(info.license.loginType, loginType) ) {
                        info.license.valid = true;
                    }
                } else {
                    // check license
                    info.license.valid = licenseGameIds.hasOwnProperty(gameId);
                }

                // no maintenance message and if invalid lic, replace with invalid lic message
                if(!info.maintenance && !info.license.valid) {
                    info.maintenance = { message: info.license.message.invalid };
                }
                outGames.push( info );
            }.bind(this) );
            this.requestUtil.jsonResponse(res, outGames);
        }.bind(this) )

        // catch all errors
        .then(null, function(err) {
            this.requestUtil.errorResponse(res, err);
        }.bind(this) );

    } catch(err) {
        console.trace("Reports: Get Game Basic Info Error -", err);
        this.stats.increment("error", "GetGameBasicInfo.Catch");
    }
}

// http://localhost:8001/api/v2/dash/myGames
// returns list of games a user has added to there classes
// 1) get list of all classes for this user
// 2) for each class get list of games
// 3) use full list of games to build set of distinct
exampleOut.getMyGames = [
    {
        gameId: "SC",
        enabled: true,
        maintenance: {
            message: "Coming Soon!"
        },
        shortName: "SimCityEdu",
        longName: "SimCityEDU: Pollution Challenge!",
        description: "SimCityEDU: Pollution Challenge!",
        settings: {
            missionProgressLock: false
        },
        license: {
            type: "tier",
            valid: false
        },
        thumbnail: {
            small: "assets/thumb-game-SC.png",
            large: "assets/thumb-game-SC.png"
        },
        developer: {
            id: "GL",
            name: "GlassLab, Inc.",
            logo: {
                small: "assets/glasslab-logo.png",
                large: "assets/glasslab-logo-2x.png"
            }
        }
    },
    {
        gameId: "AA-1",
        enabled: true,
        shortName: "Mars Generation One",
        longName: "Mars Generation One - Argubot Academy EDU",
        description: "Put your powers of persuasion to the ultimate test, on a whole new planet! Argubot Academy EDU is an adventure game for iOS tablets. Designed for students in grades 6-8, the game develops persuasion and reasoning skills for STEM &amp; 21st century careers.",
        settings: { },
        license: {
            type: "free",
            valid: true
        },
        thumbnail: {
            small: "assets/thumb-game-AA-1.png",
            large: "assets/thumb-game-AA-1.png"
        },
        developer: {
            id: "GL",
            name: "GlassLab, Inc.",
            logo: {
                small: "assets/glasslab-logo.png",
                large: "assets/glasslab-logo-2x.png"
            }
        }
    }
];
function getMyGames(req, res) {
    try {
        var userData = req.session.passport.user;

        // 1) get list of all classes for this user
        this.lmsStore.getCourseIdsFromUserId(userData.id)
            .then(function(courseIds) {
                // 3) use full list of games to build set of distinct
                return this.telmStore.multiGetDistinctGamesForCourses( courseIds );
            }.bind(this))
            // distinct games
            .then(function(games) {
                var gamesList = [];
                for(var gameId in games) {

                    // TODO: replace with promise
                    gamesList.push( this.getGameBasicInfo(gameId) );
                }

                return when.all(gamesList);
            }.bind(this) )
            .then(function(gamesList){
                this.requestUtil.jsonResponse(res, gamesList);
            }.bind(this) )

            // catch all errors
            .then(null, function(err) {
                this.requestUtil.errorResponse(res, err);
            }.bind(this) );

    } catch(err) {
        console.trace("Reports: Get MyGames Error -", err);
        this.stats.increment("error", "GetMyGames.Catch");
    }
}

function migrateInfoFiles(req, res){
    if( !(req.params.code &&
        _.isString(req.params.code) &&
        req.params.code.length) ) {
        // if has no code
        this.requestUtil.errorResponse(res, {key:"dash.access.invalid"}, 401);
        return;
    }

    // code saved as a constant
    if( req.params.code !== dConst.code ) {
        // If the code is not valid
        this.requestUtil.errorResponse(res, {key:"dash.access.invalid"}, 401);
        return;
    }
    this._migrateGameFiles(true)
        .then(function(){
            return this._loadGameFiles();
        }.bind(this))
        .then(function(){
            res.end('{"migration": "complete"}');
        })
        .then(null, function(err){
            console.trace("Dash: Migrate Info Error -", err);
            var error = {
                migration: "failed",
                error: err
            };
            res.end(JSON.stringify(error));
            this.stats.increment("error", "MigrateInfo.Catch");
        }.bind(this));
}

function reloadGameFiles(req, res){
    if( !(req.params.code &&
        _.isString(req.params.code) &&
        req.params.code.length) ) {
        // if has no code
        this.requestUtil.errorResponse(res, {key:"dash.access.invalid"}, 401);
        return;
    }

    // code saved as a constant
    if( req.params.code !== dConst.code ) {
        // If the code is not valid
        this.requestUtil.errorResponse(res, {key:"dash.access.invalid"}, 401);
        return;
    }
    this._loadGameFiles()
        .then(function(){
            res.end('{"status": "complete"}');
        })
        .then(null, function(err){
            console.trace("Dash: Reload Game Files Error -", err);
            var error = {
                status: 'failed',
                error: err
            };
            res.end(JSON.stringify(error));
            this.stats.increment("error", "ReloadGameFiles.Catch");
        }.bind(this));
}

function getDeveloperProfile(req, res){
    var userId = req.user.id;
    if(req.user.role !== "developer"){
        this.requestUtil.errorResponse(res, {key:"dash.access.invalid"},401);
        return;
    }
    getDeveloperGameIds.call(this,userId)
        .then(function(output){
            res.end(JSON.stringify(output));
        })
        .then(null, function(err){
            console.trace("Dash: Get Developer Profile Error -", err);
            this.requestUtil.errorResponse(res, err);
            this.stats.increment("error", "GetDeveloperProfile.Catch");
        }.bind(this));
}

function getDeveloperGameIds(userId, hidden){
    return when.promise(function(resolve, reject){
        this.telmStore.getDeveloperProfile(userId)
            .then(function(values){
                var gameIds = {};
                if(hidden){
                    resolve(values);
                    return;
                }
                _(values).forEach(function(value, key){
                    if(value.verifyCodeStatus === "verified") {
                        gameIds[key] = {};
                    }
                });
                resolve(gameIds);
            }.bind(this))
            .then(null, function(err){
                reject(err);
            }.bind(this));
    }.bind(this));
}

function getDeveloperGamesInfo(req, res){
    var userId = req.user.id;
    if(req.user.role !== "developer"){
        this.requestUtil.errorResponse(res, {key:"dash.access.invalid"},401);
        return;
    }
    getDeveloperGameIds.call(this,userId)
        .then(function(gameIds){
            var basic;
            var basicGameInfo = {};
            _(gameIds).forEach(function(value, gameId){
                basic = this._games[gameId].info.basic;
                basicGameInfo[gameId] = basic;
            }.bind(this));
            var output = JSON.stringify(basicGameInfo);
            res.end(output);
        }.bind(this))
        .then(null, function(err){
            console.trace("Dash: Get Developer Profile Error -", err);
            this.requestUtil.errorResponse(res, err);
            this.stats.increment("error", "GetDeveloperGamesInfo.Catch");
        }.bind(this));
}

function updateDeveloperGameInfo(req, res){
    var userId = req.user.id;
    var gameId = req.params.gameId;
    if(req.user.role !== "developer"){
        this.requestUtil.errorResponse(res, {key:"dash.access.invalid"},401);
        return;
    }
    var data = {
        basic: req.body.basic
    };

    if(!data.basic){
        this.requestUtil.errorResponse(res, {key:"dash.info.missing"},401);
        return;
    }
    getDeveloperGameIds.call(this,userId)
        .then(function(gameIds){
            if(gameIds[gameId]){
                return this.telmStore.getGameInformation(gameId, true);
            }
            return "no access"
        }.bind(this))
        .then(function(results){
            if(typeof results === "string"){
                return results;
            }
            var basic = results.basic;
            if(JSON.stringify(basic) === JSON.stringify(data.basic)){
                return "no change";
            }
            results.basic = data.basic;
            return _writeToInfoJSONFiles(gameId, JSON.stringify(results, null, 4));
        })
        .then(function(status){
            if(typeof status === "string"){
                return status;
            }
            return this.telmStore.updateGameInformation(gameId, data);
        }.bind(this))
        .then(function(status){
            if(status !== "no object" && status !== "no access"){
                this._games[gameId].info.basic = data.basic;
                res.end('{"update":"complete"}');
            } else{
                this.requestUtil.errorResponse(res, {key:"dash.access.invalid"});
            }
        }.bind(this))
        .then(null, function(err){
            var error = {
                update: "failed",
                error: err
            };
            error = JSON.stringify(error);
            console.trace("Dash: Update Developer Game Info Error -", err);
            this.requestUtil.errorResponse(res, error, 401);
            this.stats.increment("error", "UpdateDeveloperGameInfo.Catch");
        }.bind(this));
}

function _writeToInfoJSONFiles(gameId, data){
    return when.promise(function(resolve, reject){
        fs.writeFile(__dirname + "/../games/" + gameId.toLowerCase() + "/info.json", data, function(err){
            if(err){
                reject(err);
                return;
            }
            resolve();
        });
    });
}
