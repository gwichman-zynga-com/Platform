
var _         = require('lodash');
var when      = require('when');
var lConst    = require('../../lms/lms.const.js');
//

module.exports = {
    getReport:          getReport,
    getReportInfo:      getReportInfo,
    getTotalTimePlayed: getTotalTimePlayed
};

var exampleIn = {}, exampleOut = {};

// http://localhost:8001/api/v2/dash/reports/sowo/game/AA-1/course/93
// http://localhost:8001/api/v2/dash/reports/sowo?gameId=AA-1&courseId=93
exampleIn.getSOWO = {
    gameId: "AA-1",
    courseId: 1
};
exampleOut.getSOWO =
    [
        {"results": {"watchout": [
            {"total": 6, "overPercent": 1, "timestamp": 1409012387023, "id": "wo1", "name": "Contradictory Mechanic", "description": "Student is struggling with claim-data pairs. They are consistently using evidence that contradicts their claim. More core construction practice is needed."},
            {"total": 2, "overPercent": 0.5, "timestamp": 1408658285716, "id": "wo3", "name": "Straggler", "description": "Struggling with identifying strengths and weaknesses of claim-data pairs."}
        ], "shoutout": [
            {"total": 10, "overPercent": 2.6666666666666665, "timestamp": 1409012387031, "id": "so1", "name": "Nailed It!", "description": "Outstanding performance at identifying weaknesses of claim-data pairs."}
        ]}, "gameId": "AA-1", "userId": "25", "assessmentId": "sowo"},
        {"gameId": "AA-1", "userId": "250", "assessmentId": "sowo", "results": {"watchout": [
            {"total": 6, "overPercent": 1, "timestamp": 1409256462557, "id": "wo1", "name": "Contradictory Mechanic", "description": "Student is struggling with claim-data pairs. They are consistently using evidence that contradicts their claim. More core construction practice is needed."}
        ], "shoutout": []}}
    ];
function getReport(req, res, next) {
    try {
        if (!req.params.reportId) {
            this.requestUtil.errorResponse(res, {key:"report.reportId.missing", error: "missing reportId"});
            return;
        }
        if (!req.params.gameId) {
            this.requestUtil.errorResponse(res, {key:"report.gameId.missing", error: "missing gameId"});
            return;
        }
        if (!req.params.courseId) {
            this.requestUtil.errorResponse(res, {key:"report.courseId.missing", error: "missing courseId"});
            return;
        }

        var reportId = req.params.reportId.toLowerCase();
        var courseId = parseInt(req.params.courseId);
        // gameId is not case sensitive
        var gameId = req.params.gameId.toUpperCase();

        // TODO: change to promise
        // check if valid gameId
        if(!this.isValidGameId(gameId)) {
            this.requestUtil.errorResponse(res, {key:"report.gameId.invalid", error: "invalid gameId"});
            return;
        }

        if(reportId == 'sowo') {
            _getSOWO.call(this, req, res, reportId, gameId, courseId);
        }
        else if(reportId == 'achievements') {
            _getAchievements.call(this, req, res, reportId, gameId, courseId);
        }
        else if(reportId == 'mission-progress') {
            _getMissionProgress.call(this, req, res, reportId, gameId, courseId);
        }
        else {
            this.requestUtil.errorResponse(res, {key:"report.reportId.invalid", error: "invalid reportId"});
        }
    } catch(err) {
        console.trace("Reports: Get Reports Error -", err);
        this.stats.increment("error", "getReport.Catch");
    }
}


// http://localhost:8001/api/v2/dash/reports/sowo?gameId=AA-1&courseId=93
exampleIn.getSOWO = {
    gameId: "AA-1",
    courseId: 1
};
exampleOut.getSOWO = [

];
function _getSOWO(req, res, reportId, gameId, courseId) {
    var assessmentId = reportId;

    // get user list in class
    // TODO: use service route
    var lmsService = this.serviceManager.get("lms").service;
    lmsService.getStudentsOfCourse(courseId)
        .then(function(users){
            // shortcut no users
            if(!users) return;

            var outList = [];
            var userMap = {};
            var promistList = [];

            //console.log("users:", users);

            // get SOWO data per game per user
            users.forEach(function(user){
                var userId = user.id;

                 //console.log("getAssessmentResults gameId:", gameId, ", userId:", userId, ", assessmentId:", assessmentId);
                 var p = this.telmStore.getAssessmentResults(userId, gameId, assessmentId)
                    .then(function(assessmentData){
                         // shortcut invalid assessmentData
                         if(!assessmentData || !assessmentData.results) return;

                         // create copy of data for output
                         var outAssessmentData = _.cloneDeep(assessmentData);

                         // TODO: replace this with promise
                         // find assessment by ID
                         var assessment = this.getGameAssessmentInfo(gameId);

                         for(var i = 0; i < assessment.length; i++) {
                             if(assessment[i].id == assessmentId) {
                                 // merge in sowo info from game assessment info

                                 // output is array not object
                                 outAssessmentData.results.shoutout = [];
                                 // shoutout rules
                                 for(var j in assessmentData.results.shoutout) {
                                     var so = assessmentData.results.shoutout[j];
                                     // don't need to expose the gameSessionId
                                     delete so.gameSessionId;
                                     so.id = j;

                                     outAssessmentData.results.shoutout.push( _.merge(
                                         so,
                                         assessment[i].rules[ j ] )
                                     );
                                    //console.log("shoutout:", assessmentData.results.shoutout[j]);
                                 }

                                 // output is array not object
                                 outAssessmentData.results.watchout = [];
                                 // watchout rules
                                 for(var j in assessmentData.results.watchout) {
                                     var wo = assessmentData.results.watchout[j];
                                     // don't need to expose the gameSessionId
                                     delete wo.gameSessionId;
                                     wo.id = j;

                                     outAssessmentData.results.watchout.push( _.merge(
                                         wo,
                                         assessment[i].rules[ j ] )
                                     );

                                     //console.log("shoutout:", assessmentData.results.watchout[j]);
                                 }

                                 // done!
                                 break;
                             }
                         }

                         outList.push(outAssessmentData);
                    }.bind(this));

                promistList.push(p);
            }.bind(this));


            when.all(promistList)
                .then(function(){
                    // all done
                    this.requestUtil.jsonResponse(res, outList);
                }.bind(this));
        }.bind(this));
}


// http://localhost:8001/api/v2/dash/reports/achievements?gameId=AA-1&courseId=93
exampleIn._getAchievements = {
    gameId: "AA-1",
    courseId: 93
};
exampleOut._getAchievements = [
    {
        "userId": 25,
        "achievements": [
            {
                "group":    "21st.Century.Skills",
                "subGroup": "a",
                "item":     "Bold",
                "won":      true
            },
            {
                "group":    "21st.Century.Skills",
                "subGroup": "a",
                "item":     "Persistent",
                "won":      false
            }
        ],
        "totalTimePlayed": 123456789
    }
];
function _getAchievements(req, res, reportId, gameId, courseId) {

    var loginUserSessionData = req.session.passport.user;
    if(loginUserSessionData.role == lConst.role.student) {
        this.requestUtil.errorResponse(res, {error: "invalid access"});
        return;
    }

    //console.log("userIds:", userIds);
    // validate users in teachers class
    this.lmsStore.isUserInCourse(loginUserSessionData.id, courseId)
        .then(function(verified) {
            if(verified) {
                var lmsService = this.serviceManager.get("lms").service;
                return lmsService.getStudentsOfCourse(courseId);
            } else {
                this.requestUtil.errorResponse(res, {error: "invalid access"});
            }
        }.bind(this))

        .then(function(userInfo) {
            if(userInfo) {
                var userIds = _.pluck(userInfo, "id");
                return this.telmStore.getMultiGamePlayInfo(userIds, gameId);
            } else {
                this.requestUtil.errorResponse(res, {error: "invalid access"});
            }
        }.bind(this))

        .then(function(playerInfoList) {
            var achievements = [];
            //console.log("playerInfoList:", playerInfoList);

            for(var userId in playerInfoList) {
                var info = playerInfoList[userId];
                //console.log("info:", info);

                var userAchievements = {
                    userId: userId,
                    achievements: [],
                    totalTimePlayed: info.totalTimePlayed || 0
                };

                userAchievements.achievements = this.getListOfAchievements(gameId, info.achievement);
                achievements.push(userAchievements);
            }

            //console.log("getAchievements:", achievements);
            this.requestUtil.jsonResponse(res, achievements);
        }.bind(this))

        // error
        .then(null, function(err){
            if(err == 'none found') {
                // empty list
                this.requestUtil.jsonResponse(res, {});
            } else {
                this.requestUtil.errorResponse(res, err);
            }
        }.bind(this));
}

exampleIn.getTotalTimePlayed = {
    gameId: "AA-1",
    userIds: [1, 2]
};
function getTotalTimePlayed(req, res) {
    try {
        if( !(req.session &&
            req.session.passport &&
            req.session.passport.user &&
            req.session.passport.user.id ) ) {
            this.requestUtil.errorResponse(res, {error: "not logged in"});
            return;
        }

        var loginUserSessionData = req.session.passport.user;
        if(loginUserSessionData.role == lConst.role.student) {
            this.requestUtil.errorResponse(res, {error: "invalid access"});
            return;
        }

        if(!req.query.gameId) {
            this.requestUtil.errorResponse(res, {error: "missing gameId"});
            return;
        }

        if(!req.query.userIds) {
            this.requestUtil.errorResponse(res, {error: "missing userIds"});
            return;
        }

        var gameId  = req.query.gameId;
        var userIds = req.query.userIds;

        // make sure userId is array
        if(!_.isArray(userIds)) {
            var id = parseInt(userIds);
            if(_.isNaN(id)) {
                this.requestUtil.errorResponse(res, {error: "invalid parameter"});
                return;
            }
            userIds = [ id ];
        }

        //console.log("userIds:", userIds);
        // validate users in teachers class
        this.lmsStore.isMultiUsersInInstructorCourse(userIds, loginUserSessionData.id)
            .then(function(verified) {
                if(verified) {

                    var promiseList = [];

                    userIds.forEach(function(userId) {
                        var p = this.telmStore.getGamePlayInfo(userId, gameId)
                            .then(function (info) {
                                if (info) {
                                    return info.totalTimePlayed;
                                }
                            }.bind(this))
                            .then(function (totalTimePlayed) {
                                // if totalTime set to zero try getting from saved game
                                if (totalTimePlayed != 0) {
                                    console.log("totalTimePlayed from PlayInfo - userId:", userId, ", totalTimePlayed:", totalTimePlayed);
                                    // ensure it's a float and make it seconds
                                    return parseFloat(totalTimePlayed);
                                }

                                // TODO: remove this!!! but will need to write a migrate script to pull old over to use user pref
                                return this.telmStore.getUserGameData(userId, gameId)
                                    .then(function (gameData) {
                                        if (gameData) {
                                            // Look in save file for total TimePlayed

                                            var totalTimePlayed = 0;
                                            if (gameData &&
                                                gameData.hasOwnProperty('ExplorationManager') &&
                                                gameData.ExplorationManager &&
                                                gameData.ExplorationManager.hasOwnProperty('ExplorationManager') &&
                                                gameData.ExplorationManager.ExplorationManager &&
                                                gameData.ExplorationManager.ExplorationManager.hasOwnProperty('m_totalTimePlayed') &&
                                                gameData.ExplorationManager.ExplorationManager.m_totalTimePlayed) {

                                                console.log("totalTimePlayed from SaveGame - userId:", userId, ", totalTimePlayed:", totalTimePlayed);
                                                // ensure it's a float and make it seconds
                                                totalTimePlayed = parseFloat(gameData.ExplorationManager.ExplorationManager.m_totalTimePlayed);
                                            }

                                            return totalTimePlayed;
                                        }
                                    }.bind(this))
                            }.bind(this))
                            .then(function (totalTimePlayed) {
                                // create object, with userId and totalTimePlayed
                                var data = {};
                                data[userId] = totalTimePlayed;
                                return data;
                            }.bind(this));
                        promiseList.push(p);
                    }.bind(this));

                    // join all results
                    var reduceList = when.reduce(promiseList, function(list, item){
                        list = _.merge(list, item);
                        return list;
                    }.bind(this));

                    reduceList.then(function(list){
                        this.requestUtil.jsonResponse(res, list);
                    }.bind(this));
                } else {
                    this.requestUtil.errorResponse(res, {error: "invalid access"});
                }
            }.bind(this))
            // error
            .then(null, function(err){
                this.requestUtil.errorResponse(res, err);
            }.bind(this));

    } catch(err) {
        console.trace("Reports: Get Achievements Error -", err);
        this.stats.increment("error", "GetAchievements.Catch");
    }
}

function getReportInfo(req, res){
    if (!req.params.reportId) {
        this.requestUtil.errorResponse(res, {key:"report.reportId.missing", error: "missing reportId"});
        return;
    }
    if (!req.params.gameId) {
        this.requestUtil.errorResponse(res, {key:"report.gameId.missing", error: "missing gameId"});
        return;
    }

    var reportId = req.params.reportId.toLowerCase();
    // gameId is not case sensitive
    var gameId = req.params.gameId.toUpperCase();

    // TODO: change to promise
    // check if valid gameId
    if(!this.isValidGameId(gameId)) {
        this.requestUtil.errorResponse(res, {key:"report.gameId.invalid", error: "invalid gameId"});
        return;
    }

    this.requestUtil.jsonResponse(res, this.getGameReportInfo(gameId, reportId) );
}

function _getMissionProgress(req, res, reportId, gameId, courseId) {
    var lmsService = this.serviceManager.get("lms").service;
    lmsService.getStudentsOfCourse(courseId)
        .then(function(userList){

            for(var i in userList){
                cmp.push( this.getMissionTimePlayed(userList[i].id, courseId, gameId) );
            }

            var p = when.reduce(cmp, function(allUsers, userData){
                return allUsers.push(userData);
            }, []);

            p.then(function(allUsers){
                this.requestUtil.jsonResponse(res, allUsers );
            })

        });
}

function getMissionTimePlayed(userId, gameId, courseId){
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------

    var userData = {
        gameId: gameId,
        userId: userId
    };
    this.dashStore.getCompletedMissions(userId, courseId, gameId)
        .then(function(missionProgress){
            userData.missions = missionProgress;

            return this.telmStore.getGamePlayInfo(userId, gameId);
        })
        .then(function(ttp){
            userData.totalTimePlayed = ttp;

            // merge missionProgress + userData
            resolve(userData);
        });

// ------------------------------------------------
}.bind(this));
// end promise wrapper
}