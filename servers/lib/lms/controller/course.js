
var _      = require('lodash');
var when   = require('when');
var Util   = require('../../core/util.js');
var lConst = require('../lms.const.js');

module.exports = {
    getEnrolledCourses:     getEnrolledCourses,
    enrollInCourse:         enrollInCourse,
    unenrollFromCourse:     unenrollFromCourse,
    unenrollUserFromCourse: unenrollUserFromCourse,
    createCourse:           createCourse,
    getCourse:              getCourse,
    updateCourseInfo:       updateCourseInfo,
    updateGamesInCourse:    updateGamesInCourse
};

var exampleOut = {}, exampleIn = {};

exampleOut.enrollInCourse =
{
    courseCode: "COU34"
};
function enrollInCourse(req, res, next) {

    if( req.session &&
        req.session.passport) {

        if( req.body &&
            req.body.courseCode) {
            var userData = req.session.passport.user;
            var courseCode = req.body.courseCode;

            this.myds.getCourseIdFromCourseCode(courseCode)

                .then(function(courseId) {
                    if(courseId) {
                        return this.myds.isUserInCourse(userData.id, courseId)
                            .then(function(inCourse) {
                                // only if they are NOT in the class
                                if(!inCourse) {
                                    this.myds.addUserToCourse(userData.id, courseId, lConst.role.student)
                                        .then(function() {
                                            this.requestUtil.jsonResponse(res, {});
                                        }.bind(this))
                                } else {
                                    this.requestUtil.errorResponse(res, {error:"already enrolled", key:"already.enrolled"}, 400);
                                }
                            }.bind(this))
                    } else {
                        this.requestUtil.errorResponse(res, {error:"invalid courseCode", key:"code.invalid"}, 400);
                    }
                }.bind(this));
        } else {
            this.requestUtil.errorResponse(res, {error:"missing courseCode", key:"code.missing"}, 401);
        }
    } else {
        this.requestUtil.errorResponse(res, "not logged in");
    }
}

exampleOut.getCourses =
{
    courseId: 123
};
function unenrollFromCourse(req, res, next) {
    if( req.session &&
        req.session.passport) {

        if( req.body &&
            req.body.courseId) {
            var userData = req.session.passport.user;
            var courseId = req.body.courseId;

            this.myds.isUserInCourse(userData.id, courseId)
                .then(function(inCourse) {

                    // only if they are in the class
                    if(inCourse) {
                        this.myds.removeUserFromCourse(userData.id, courseId)
                            .then(function() {
                                this.requestUtil.jsonResponse(res, {});
                            }.bind(this))
                    } else {
                        this.requestUtil.errorResponse(res, "not enrolled in course");
                    }
                }.bind(this));
        } else {
            this.requestUtil.errorResponse(res, "missing courseId");
        }
    } else {
        this.requestUtil.errorResponse(res, "not logged in");
    }
}


exampleOut.unenrollUserFromCourse =
{
    course: 8,
    showMembers: 1,
    user: 176
};
function unenrollUserFromCourse(req, res, next, serviceManager) {
    if( req.session &&
        req.session.passport) {

        if( req.body) {
            if(!req.body.course){
                this.requestUtil.errorResponse(res, "missing course id");
                return;
            }
            if(!req.body.user){
                this.requestUtil.errorResponse(res, "missing user id");
                return;
            }
            var userId   = req.body.user;
            var courseId = req.body.course;

            this.myds.isUserInCourse(userId, courseId)
                .then(function(inCourse) {

                    // only if they are in the class
                    if(inCourse) {
                        this.myds.removeUserFromCourse(userId, courseId)
                            .then(function() {

                                req.query.showMembers = req.body.showMembers;
                                req.params.id = courseId;
                                // get and respond with course
                                serviceManager.internalRoute('/api/v2/lms/course/:courseId/info', 'get', [req, res, next]);

                            }.bind(this))
                    } else {
                        this.requestUtil.errorResponse(res, "not enrolled in course");
                    }
                }.bind(this));
        } else {
            this.requestUtil.errorResponse(res, "missing arguments");
        }
    } else {
        this.requestUtil.errorResponse(res, "not logged in");
    }
}

/*
 /api/v2/lms/courses
 */
exampleOut.getEnrolledCourses =
    [
        {
            "id": 27,
            "dateCreated": 123456789,
            "title": "Test",
            "grade": "7,8",
            "archived": false,
            "archivedDate": null,
            "institution": 18,
            "code": "18ZBD",
            "studentCount": 1,
            "gameIds": [ "AA-1", "AW-1", "SC" ],
            "lockedRegistration": false
        }
    ];

/*
 /api/v2/lms/courses?showMembers=true
 */
exampleOut.getEnrolledCourses_WithMembers =[
    {
        "id": 8,
        "dateCreated": 123456789,
        "title": "test2",
        "grade": "9,10",
        "lockedRegistration": false,
        "archived": false,
        "archivedDate": null,
        "institution": 10,
        "code": "YD8WV",
        "gameIds": [ "AA-1", "AW-1", "SC" ],
        "studentCount": 2,
        "users":
            [
                {
                    "id": 175,
                    "lastName": "test2_s1",
                    "firstName": "test2_s1",
                    "username": "test2_s1",
                    "email": "",
                    "role": "student"
                },
                {
                    "id": 176,
                    "lastName": "test2_s2",
                    "firstName": "test2_s2",
                    "username": "test2_s2",
                    "email": "",
                    "role": "student"
                }
            ]
    },
    {
        "id": 9,
        "dateCreated": 123456789,
        "title": "test3",
        "grade": "7",
        "lockedRegistration": false,
        "archived": false,
        "archivedDate": null,
        "institution": 10,
        "gameIds": [ "AA-1", "AW-1", "SC" ],
        "code": "SK1FC",
        "studentCount": 0,
        "users": []
    }
];
function getEnrolledCourses(req, res, next) {

    if( req.session &&
        req.session.passport) {
        var userData = req.session.passport.user;

        this.myds.getEnrolledCourses(userData.id)
            .then(function(courses){

                var getCourses = _getCourses.bind(this)

                var showMembers = false;
                if( req.query.hasOwnProperty("showMembers") ) {
                    showMembers = parseInt(req.query.showMembers);
                }

                getCourses(courses, showMembers)
                    .then(function(courses){
                            this.requestUtil.jsonResponse(res, courses);
                        }.bind(this),
                        function(err){
                            this.requestUtil.errorResponse(res, err);
                        }.bind(this)
                    );

            }.bind(this))
            .then(null, function(err){
                this.requestUtil.errorResponse(res, err);
            }.bind(this))
    } else {
        this.requestUtil.errorResponse(res, "not logged in");
    }
}

/*
 http://localhost:8001/api/v2/lms/course/create

 title   - required
 grade   - required
 gameIds - required
 institution - optional
 */
exampleIn.createCourse = {
    "title": "test",
    "grade": "7",
    "institution": 10,
    "gameIds": ["SC", "AA-1"]
};

exampleOut.createCourse = {
    "id": 16,
    "title": "test1",
    "grade": "7, 8, 9",
    "locked": false,
    "archived": false,
    "archivedDate": null,
    "institution": 10,
    "code": "VMZ2P",
    "studentCount": 0,
    "freePlay": false,
    "gameIds": ['SC', 'AA-1']
};
function createCourse(req, res, next, serviceManager)
{
    if( req.body &&
        req.body.title &&
        req.body.grade ) {
        var userData = req.session.passport.user;

        if(!req.body.gameIds ||
           !_.isArray(req.body.gameIds) ) {
            this.requestUtil.errorResponse(res, {error: "gameIds missing or not array", key:"gameids.invalid"});
            return;
        }

        // check if instructor, manager or admin
        if( userData.role == lConst.role.instructor ||
            userData.role == lConst.role.manager ||
            userData.role == lConst.role.admin ) {

            var courseData = {
                title:       req.body.title,
                grade:       req.body.grade,
                institution: req.body.institution,
                gameIds:     req.body.gameIds,
                id:    0,
                code: "",
                studentCount: 0,
                freePlay: false,
                locked:   false,
                archived: false,
                archivedDate: null
            };

            // validate gameId's
            // TODO: replace using internal route, but needs callback when route is done
            var dash = serviceManager.get("dash").service;
            var gameIds = dash.getListOfGameIds();
            for(var i = 0; i < courseData.gameIds.length; i++){
                var found = false;
                // check if gameId is in the course
                for(var j = 0; j < gameIds.length; j++) {
                    if(courseData.gameIds[i] == gameIds[j]) {
                        found = true;
                        break;
                    }
                }

                if(!found) {
                    this.requestUtil.errorResponse(res, {error: "gameId '"+courseData.gameIds[i]+"' is not valid", key:"gameid.invalid"});
                    return; // exit function
                }
            }

            this.myds.createCourse(userData.id, courseData.title, courseData.grade, courseData.institution)
                .then(function(courseId){
                    courseData.id = courseId;

                    if( userData.role == lConst.role.instructor ||
                        userData.role == lConst.role.manager) {
                        return this.myds.addGamesToCourse(courseId, courseData.gameIds)
                                .then(function() {
                                    return this.myds.addUserToCourse(userData.id, courseId, lConst.role.instructor);
                                }.bind(this));
                    }
                }.bind(this))

                .then(function(){
                    courseData.code = this._generateCode();
                    return this.myds.addCode(courseData.code, courseData.id, lConst.code.type.course)
                        .then(function(){
                            this.requestUtil.jsonResponse(res, courseData);
                        }.bind(this));
                }.bind(this))

                // error catchall
                .then(null, function(err){
                    this.requestUtil.errorResponse(res, err, 400);
                }.bind(this));
        } else {
            this.requestUtil.errorResponse(res, "user does not have permission");
        }
    } else {
        this.requestUtil.errorResponse(res, "missing arguments");
    }
}

/*
 GET http://localhost:8001/api/v2/lms/course/107/info?showMembers=1
*/
exampleOut.getCourse = {
    "id": 16,
    "title": "test1",
    "grade": "7, 8, 9",
    "locked": false,
    "archived": false,
    "archivedDate": null,
    "institution": 10,
    "code": "VMZ2P",
    "studentCount": 0,
    "freePlay": false,
    "gameIds": ['SC', 'AA-1']
};
function getCourse(req, res, next) {

    if( req.session &&
        req.session.passport) {
        var userData = req.session.passport.user;

        if( req.params &&
            req.params.hasOwnProperty("courseId") ) {
            var courseId = req.params.courseId;

            // check if enrolled in course
            var showMembers = false;
            var promise;
            if( userData.role == lConst.role.instructor ||
                userData.role == lConst.role.manager ||
                userData.role == lConst.role.admin ) {
                // only show members if not student
                if( req.query.hasOwnProperty("showMembers") ) {
                    showMembers = parseInt(req.query.showMembers);
                }

                // do nothing promise
                promise = when.promise(function(resolve){resolve(1)}.bind(this));
            } else {
                // check if enrolled
                promise = this.myds.isEnrolledInCourse(userData.id, courseId);
            }

            promise
                .then(function(){
                    return this.myds.getCourse(courseId);
                }.bind(this))
                .then(function(course){

                    if( !course ){
                        this.requestUtil.errorResponse(res, "invalid course id");
                        return;
                    }

                    var courses    = [];
                    courses.push(course); // add course

                    var getCourses = _getCourses.bind(this)
                    getCourses(courses, showMembers)
                        .then(function(courses){
                            if( courses &&
                                courses.length > 0) {
                                this.requestUtil.jsonResponse(res, courses[0]);
                            } else {
                                this.requestUtil.errorResponse(res, "missing course");
                            }
                        }.bind(this),
                        function(err){
                            this.requestUtil.errorResponse(res, err);
                        }.bind(this)
                    );

                }.bind(this))
                .then(null, function(err){
                    this.requestUtil.errorResponse(res, err);
                }.bind(this))
        } else {
            this.requestUtil.errorResponse(res, "missing course id");
        }
    } else {
        this.requestUtil.errorResponse(res, "not logged in");
    }
}


function _getCourses(courses, showMembers){
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------
    if( courses &&
        courses.length) {

        // added empty object for reduce to work
        courses.unshift({});

        when.reduce(courses, function(data, course, i){
            if(course.id) {
                //console.log("id:", course.id);

                // convert showMembers to int and then check it's value
                var p;
                if(showMembers) {
                    // init user
                    course.users = [];

                    p = this.myds.getStudentsOfCourse(course.id)
                        .then(function(studentList) {
                            course.users = _.clone(studentList);
                            return this.myds.getGamesForCourse(course.id);
                        }.bind(this));
                } else {
                    p = this.myds.getGamesForCourse(course.id);
                }

                p.then(function(gameIds) {
                    course.gameIds = _.clone(gameIds);
                    // need to return something for reduce to continue
                    return 1;
                }.bind(this));

                return p;
            }
        }.bind(this))
            .then(null, function(err){
                reject(err);
            }.bind(this))

            .done(function(){
                //console.log("done");
                // added empty object for reduce to work
                courses.shift();
                resolve(courses);
            }.bind(this))
    } else {
        resolve(courses);
    }
// ------------------------------------------------
}.bind(this));
// end promise wrapper
}

/*
 POST http://localhost:8001/api/v2/lms/course/107/info

 title - required
 grade - required
 institutionId - optional
 archived - optional
 */
exampleIn.updateCourse = {
    "title": "test61",
    "grade": "7"
};
function updateCourseInfo(req, res, next, serviceManager)
{
    if( req.body &&
        req.body.title &&
        req.body.grade ) {
        var userData = req.session.passport.user;

        if( !req.params ||
            !req.params.hasOwnProperty("courseId") ) {
            this.requestUtil.errorResponse(res, "missing course id");
            return;
        }
        var courseId = req.params.courseId;

        // check if instructor, manager or admin
        if( userData.role == lConst.role.instructor ||
            userData.role == lConst.role.manager ||
            userData.role == lConst.role.admin ) {

            var courseData = {
                id:            courseId,
                title:         req.body.title,
                grade:         req.body.grade,
                institutionId: req.body.institution,
                archived:      req.body.archived
            };

            if(courseData.archived) {
                courseData.archivedDate = Util.GetTimeStamp();
            }

            this.myds.updateCourseInfo(userData.id, courseData)
                .then(function() {
                    serviceManager.internalRoute('/api/v2/lms/course/:courseId/info', 'get', [req, res, next]);
                }.bind(this))

                // error catchall
                .then(null, function(err) {
                    this.requestUtil.errorResponse(res, err, 400);
                }.bind(this));
        } else {
            this.requestUtil.errorResponse(res, "user does not have permission");
        }
    } else {
        this.requestUtil.errorResponse(res, "missing arguments or invalid");
    }
}

/*
 POST http://localhost:8001/api/v2/lms/course/107/games
 */
exampleIn.updateGamesInCourse = {
    "gameIds": ["SC"]
};
function updateGamesInCourse(req, res, next, serviceManager)
{
    if( req.body &&
        req.body.gameIds &&
        _.isArray(req.body.gameIds) ) {
        var userData = req.session.passport.user;
        var updateGameIds = req.body.gameIds;

        if( !req.params ||
            !req.params.hasOwnProperty("courseId") ) {
            this.requestUtil.errorResponse(res, "missing course id");
            return;
        }
        var courseId = req.params.courseId;

        // check if instructor, manager or admin
        if( userData.role == lConst.role.instructor ||
            userData.role == lConst.role.manager ||
            userData.role == lConst.role.admin ) {

            // validate gameId's
            // TODO: replace using internal route, but needs callback when route is done
            var dash = serviceManager.get("dash").service;
            var gameIds = dash.getListOfGameIds();
            for(var i = 0; i < updateGameIds.length; i++){
                var found = false;
                // check if gameId is in the course
                for(var j = 0; j < gameIds.length; j++) {
                    if(updateGameIds[i] == gameIds[j]) {
                        found = true;
                        break;
                    }
                }

                if(!found) {
                    this.requestUtil.errorResponse(res, {error: "gameId '"+updateGameIds[i]+"' is not valid", key:"gameid.invalid"});
                    return; // exit function
                }
            }

            this.myds.getGamesForCourse(courseId)
                .then(function (currentGameIds) {
                    var addGameIds = [];
                    var removeGameIds = [];

                    // find gameIds to remove
                    for (var i = 0; i < currentGameIds.length; i++) {
                        var found = false;
                        for (var j = 0; j < updateGameIds.length; j++) {
                            if (updateGameIds[j] == currentGameIds[i]) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            removeGameIds.push(currentGameIds[i]);
                        }
                    }

                    // find gameIds to add
                    for (var i = 0; i < updateGameIds.length; i++) {
                        var found = false;
                        for (var j = 0; j < currentGameIds.length; j++) {
                            if (currentGameIds[j] == updateGameIds[i]) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            addGameIds.push(updateGameIds[i]);
                        }
                    }

                    var promiseList = [];
                    if(removeGameIds.length > 0) {
                        //console.log("updateCourse removeGameIds:", removeGameIds);
                        promiseList.push(this.myds.removeGamesInCourse(courseId, removeGameIds));
                    }
                    if(addGameIds.length > 0) {
                        //console.log("updateCourse addGameIds:", addGameIds);
                        promiseList.push(this.myds.addGamesToCourse(courseId, addGameIds));
                    }
                    return when.all(promiseList);
                }.bind(this))

                .then(function () {
                    serviceManager.internalRoute('/api/v2/lms/course/:courseId/info', 'get', [req, res, next]);
                }.bind(this))

                // error catchall
                .then(null, function (err) {
                    this.requestUtil.errorResponse(res, err, 400);
                }.bind(this));

        } else {
            this.requestUtil.errorResponse(res, "user does not have permission");
        }
    } else {
        this.requestUtil.errorResponse(res, "missing arguments or invalid");
    }
}