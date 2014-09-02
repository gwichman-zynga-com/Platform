
var path      = require('path');
var _         = require('lodash');
var when      = require('when');
var mailChimp = require('mailchimp').MailChimpAPI;
var lConst    = require('../../lms/lms.const.js');
var aConst    = require('../../auth/auth.const.js');
var Util      = require('../../core/util.js');

module.exports = {
    getUserProfileData:  getUserProfileData,
    registerUserV1:      registerUserV1,
    registerUserV2:      registerUserV2,
    validateEmailCode:   validateEmailCode,
    validateBetaCode:    validateBetaCode,
    registerManager:     registerManager,
    getUserDataById:     getUserDataById,
    updateUserData:      updateUserData,
    resetPasswordSend:   resetPasswordSend,
    resetPasswordVerify: resetPasswordVerify,
    resetPasswordUpdate: resetPasswordUpdate,
};

var exampleIn = {};
var exampleOut = {};


function getUserProfileData(req, res, next) {

    if( req.session &&
        req.session.passport &&
        req.session.passport.user) {
        var userData = req.session.passport.user;
        // check perms before returning user info
        this.webstore.getUserInfoById(userData.id)
            // ok, send data
            .then(function(userData){

                // if not student then make instructor (hiding internal manager and admin users)
                if(userData.role != lConst.role.student) {
                    userData.role = lConst.role.instructor;
                }

                this.requestUtil.jsonResponse(res, userData);
            }.bind(this))
            // error
            .then(null, function(err){
                this.requestUtil.errorResponse(res, err);
            }.bind(this))
    } else {
        this.requestUtil.errorResponse(res, "not logged in");
    }
}

function getUserDataById(req, res, next) {
    if( req.session &&
        req.session.passport &&
        req.session.passport.user &&
        req.params &&
        req.params.hasOwnProperty("userId")) {
        var loginUserSessionData = req.session.passport.user;

        // check perms before returning user info
        this.webstore.getUserInfoById(req.params.userId)
            .then(function(userData){
                return this.checkUserPerminsToUserData(userData, loginUserSessionData)
            }.bind(this))
            // ok, send data
            .then(function(userData){

                // if not student then make instructor (hiding internal manager and admin users)
                if(userData.role != lConst.role.student) {
                    userData.role = lConst.role.instructor;
                }

                this.requestUtil.jsonResponse(res, userData);
            }.bind(this))
            // error
            .then(null, function(err){
                this.requestUtil.errorResponse(res, err);
            }.bind(this))
    } else {
        this.requestUtil.errorResponse(res, "not logged in");
    }
}

/**
 * Registers a user with role of instructor or student
 * 1. get institution
 * 2. create the new user
 * 3. if student, enroll them in the course
 */
function registerUserV1(req, res, next) {
    this.stats.increment("info", "Route.Register.User");
    //console.log("Auth registerUserRoute - body:", req.body);

    req.body.username  = Util.ConvertToString(req.body.username);
    req.body.firstName = Util.ConvertToString(req.body.firstName);
    req.body.lastName  = Util.ConvertToString(req.body.lastName);
    req.body.password  = Util.ConvertToString(req.body.password);
    req.body.type      = Util.ConvertToString(req.body.type);

    if( !(
        req.body.username &&
            req.body.firstName &&
            req.body.lastName &&
            req.body.password  &&
            req.body.type &&
            _.isNumber(req.body.associatedId)
        ) )
    {
        this.stats.increment("error", "Route.Register.User.MissingFields");
        this.requestUtil.errorResponse(res, "missing some fields", 400);
        return;
    }

    var role = lConst.role.student;
    var courseId, institutionId;

    var registerErr = function(err, code){
        if(!code) code = 500;

        this.stats.increment("error", "Route.Register.User");
        console.error("AuthServer registerUser Error:", err);
        this.requestUtil.jsonResponse(res, err, code);
    }.bind(this);

    var register = function(institutionId){
        var userData = {
            username:      req.body.username,
            firstName:     req.body.firstName,
            lastName:      req.body.lastName,
            email:         req.body.email,
            password:      req.body.password,
            role:          role,
            institutionId: institutionId,
            loginType:     aConst.login.type.glassLabV2
        };

        this.registerUser(userData)
            .then(function(userId){
                // if student, enroll in course
                if(role == lConst.role.student) {
                    // courseId
                    this.stats.increment("info", "AddUserToCourse");
                    this.lmsStore.addUserToCourse(userId, courseId, role)
                        .then(function(){
                            this.stats.increment("info", "Route.Register.User."+Util.String.capitalize(role)+".Created");
                            this.glassLabLogin(req, res, next);
                        }.bind(this))
                        // catch all errors
                        .then(null, registerErr);
                } else {
                    this.stats.increment("info", "Route.Register.User."+Util.String.capitalize(role)+".Created");
                    this.glassLabLogin(req, res, next);
                }
            }.bind(this))
            // catch all errors
            .then(null, registerErr);
    }.bind(this);

    // is institution -> instructor
    if(req.body.type.toLowerCase() == aConst.code.type.institution) {
        role = lConst.role.instructor;
        // validate institution Id (associatedId == institutionId)
        institutionId = req.body.associatedId;
        this.lmsStore.getInstitution(institutionId)
            // register, passing in institutionId
            .then(function(data){
                if( data &&
                    data.length &&
                    institutionId == data[0].ID) {
                    register(institutionId);
                } else {
                    this.stats.increment("error", "Route.Register.User.InvalidInstitution");
                    registerErr({"error": "institution not found"});
                }
            }.bind(this))
            // catch all errors
            .then(null, registerErr);
    } else {
        // else student
        // get institution Id from course
        courseId = req.body.associatedId;
        this.lmsStore.getInstitutionIdFromCourse(courseId)
            // register, passing in institutionId
            .then(function(data){
                if(data && data.length) {
                    institutionId = data[0].institutionId;
                    register(institutionId);
                } else {
                    this.stats.increment("error", "Route.Register.User.InvalidInstitution");
                    registerErr({"error": "institution not found"});
                }
            }.bind(this))
            // catch all errors
            .then(null, registerErr);
    }

    this.stats.increment("info", "Route.Register.User."+Util.String.capitalize(role));
};

/**
 * Registers a user with role of manager
 * 1. validate institution not already taken
 * 2. validate license key
 * 3. create the new user
 *    1. validate email and unique
 *    2. validate username unique
 * 4. create institution
 * 5. create code with institutionId
 * 6. update license institutionId, redeemed(true), expiration(date -> now + LICENSE_VALID_PERIOD)
 * 7. update user with institutionId
 */
function registerManager(req, res, next) {
    // make sure inputs are strings
    req.body.email     = Util.ConvertToString(req.body.email);
    req.body.firstName = Util.ConvertToString(req.body.firstName);
    req.body.lastName  = Util.ConvertToString(req.body.lastName);
    req.body.password  = Util.ConvertToString(req.body.password);
    req.body.key       = Util.ConvertToString(req.body.key);

    this.stats.increment("info", "Route.Register.Manager");
    //console.log("Auth registerManagerRoute - body:", req.body);
    if( !(
        req.body.email  &&
            req.body.firstName &&
            req.body.lastName &&
            req.body.password &&
            req.body.institution &&
            req.body.key
        ) )
    {
        this.stats.increment("error", "Route.Register.Manager.MissingFields");
        this.requestUtil.errorResponse(res, "missing some fields", 400);
    }

    // copy email to username for login
    req.body.username = req.body.email;
    var user = req.session.passport.user;
    var cookie = "";
    if(user){
        cookie = aConst.sessionCookieName+"="+user[aConst.webappSessionPrefix];
    }
    // TODO: refactor this and create license system
    /*
     this.requestUtil.forwardRequestToWebApp({ cookie: cookie }, req, null,
     function(err, sres, data){
     if(err) {
     this.requestUtil.errorResponse(res, err, 500);
     }

     if(sres.statusCode == 200) {
     this.stats.increment("info", "Route.Register.Manager.Created");
     this.glassLabLogin(req, res, next);
     } else {
     this.stats.increment("error", "Route.Register.Manager.ForwardRequest");

     // don't use requestUtil response as it could contain custom headers, thus writing head
     res.writeHead(sres.statusCode, sres.headers);
     res.end(data);
     }
     }.bind(this));

     // validate email

     // validate license key
     .then(function(){
     return this.license.checkLicense(req.body.key)
     }.bind(this))

     // validate institution not already taken
     .then(function(){
     return this.license.checkInstitution(req.body.institution)
     }.bind(this))

     // catch all errors
     .then(null, function(err, code){

     }.bind(this));
     */
};

exampleIn.updateUserData = {
    "userId":        25,
    "username":      "test2",
    "firstName":     "test",
    "lastName":      "2",
    "email":         "test2@email.com",
    "password":      "test"
};
function updateUserData(req, res, next, serviceManager) {
    this.stats.increment("info", "Route.Update.User");
    //console.log("Auth updateUserRoute - body:", req.body);
    if( !(req.body.userId) )
    {
        this.stats.increment("error", "Route.Update.User.MissingId");
        //this.requestUtil.errorResponse(res, "missing the userId", 400);
        this.requestUtil.errorResponse(res, {key:"user.update.general"}, 400);
        return;
    }

    var loginUserSessionData = req.session.passport.user;

    var userData = {
        id:            req.body.userId,
        loginType:     aConst.login.type.glassLabV2
    };
    // add body data to userData
    userData = _.merge(userData, req.body);

    // legacy
    if(req.body.institutionId || req.body.institution) {
        userData.institutionId = req.body.institutionId || req.body.institution;
    }

    // wrap getSession in promise
    this._updateUserData(userData, loginUserSessionData)
        // save changed data
        .then(function(data) {
            if(data.changed) {
                // update session user data
                req.session.passport.user = data.user;
                this.stats.increment("info", "Route.Update.User.Changed");
                return serviceManager.updateUserDataInSession(req.session)
                    .then(function() {
                        return data.user;
                    }.bind(this));
            } else {
                return data.user;
            }
        }.bind(this))
        // all ok
        .then(function(userData){
            this.stats.increment("info", "Route.Update.User.Done");
            this.requestUtil.jsonResponse(res, userData);
        }.bind(this))
        // error
        .catch(function(err){
            this.stats.increment("error", "Route.Update.User");
            console.error("Auth - updateUserRoute error:", err);
            //this.requestUtil.errorResponse(res, err, 400);
            this.requestUtil.errorResponse(res, {key:"user.update.general"}, 400);
        }.bind(this) );
};


/**
 * Registers a user with role of instructor or student
 * 1. get institution
 * 2. create the new user
 * 3. if student, enroll them in the course
 */

//var example = {};
//var example.input  = {
//    "username":      "charosez",
//    "firstName":     "charles",
//    "lastName":      "tai",
//    "password":      "bubbles",
//    "email":         "charles@glasslabgames.org",
//    "role":          "instructor",
//    "loginType":     "glasslabv2"
//}

function registerUserV2(req, res, next, serviceManager) {
    this.stats.increment("info", "Route.Register.User");

    var regData = {
        username:      "",
        firstName:     "",
        lastName:      "",
        password:      "",
        email:         "",
        role:          req.body.role,
        loginType:     aConst.login.type.glassLabV2
    };

    if(regData.role == lConst.role.student) {
        regData.username   = Util.ConvertToString(req.body.username);
        regData.password   = Util.ConvertToString(req.body.password);
        regData.firstName  = Util.ConvertToString(req.body.firstName);

        // optional
        regData.lastName   = Util.ConvertToString(req.body.lastName);
        regData.regCode    = Util.ConvertToString(req.body.regCode);

        if(!regData.username) {
            //this.requestUtil.errorResponse(res, "missing username", 400);
            this.requestUtil.errorResponse(res, {key:"user.create.input.missing.username"}, 400);
            return;
        }
        if(!regData.password) {
            //this.requestUtil.errorResponse(res, "missing password", 400);
            this.requestUtil.errorResponse(res, {key:"user.create.input.missing.password"}, 400);
            return;
        }
        if(!regData.firstName) {
            //this.requestUtil.errorResponse(res, "missing firstName", 400);
            this.requestUtil.errorResponse(res, {key:"user.create.input.missing.firstName"}, 400);
            return;
        }
    }
    else if(regData.role == lConst.role.instructor) {
        // email and username is the same
        req.body.username  = req.body.email;
        regData.username   = Util.ConvertToString(req.body.username);
        regData.password   = Util.ConvertToString(req.body.password);
        regData.firstName  = Util.ConvertToString(req.body.firstName);
        regData.lastName   = Util.ConvertToString(req.body.lastName);
        regData.email      = Util.ConvertToString(req.body.email);

        if(!regData.username) {
            //this.requestUtil.errorResponse(res, "missing email", 400);
            this.requestUtil.errorResponse(res, {key:"user.create.input.missing.email"}, 400);
            return;
        }
        if(!regData.password) {
            //this.requestUtil.errorResponse(res, "missing password", 400);
            this.requestUtil.errorResponse(res, {key:"user.create.input.missing.password"}, 400);
            return;
        }
        if(!regData.firstName) {
            //this.requestUtil.errorResponse(res, "missing firstName", 400);
            this.requestUtil.errorResponse(res, {key:"user.create.input.missing.firstName"}, 400);
            return;
        }
        if(!regData.email) {
            //this.requestUtil.errorResponse(res, "missing email", 400);
            this.requestUtil.errorResponse(res, {key:"user.create.input.missing.email"}, 400);
            return;
        }
    } else {
        //this.requestUtil.errorResponse(res, "invalid role", 401);
        this.requestUtil.errorResponse(res, {key:"user.create.invalid.role"}, 401);
        return;
    }

    var registerErr = function(err, code){
        if(!code) code = 500;

        if(err.statusCode) {
            code = err.statusCode;
        }

        if(!err.key) {
            err.key = "user.create.general";
        }

        this.stats.increment("error", "Route.Register.User");
        //console.error("AuthServer registerUser Error:", err);
        //this.requestUtil.jsonResponse(res, err, code);
        this.requestUtil.errorResponse(res, err, code);
    }.bind(this);


    var register = function(regData, courseId) {
        this.registerUser(regData)
            .then(function(userId){

                // if student
                if( regData.role == lConst.role.student) {

                    // if courseId then enroll in class
                    if(courseId) {
                        // courseId
                        this.stats.increment("info", "AddUserToCourse");
                        this.lmsStore.addUserToCourse(userId, courseId, regData.role)
                            .then(function() {
                                this.stats.increment("info", "Route.Register.User."+Util.String.capitalize(regData.role)+".Created");
                                serviceManager.internalRoute('/api/v2/auth/login/glasslab', 'post', [req, res, next]);
                            }.bind(this))
                            // catch all errors
                            .then(null, registerErr);
                    } else {
                        this.stats.increment("info", "Route.Register.User."+Util.String.capitalize(regData.role)+".Created");
                        serviceManager.internalRoute('/api/v2/auth/login/glasslab', 'post', [req, res, next]);
                    }
                }
                // if instructor or manager
                else if( regData.role == lConst.role.instructor ||
                         regData.role == lConst.role.manager)
                {
                    var promise;
                    if(req.body.newsletter) {
                        promise = subscribeToNewsletter(
                            this.options.auth.email.mailChimp.apiKey,
                            this.options.auth.email.mailChimp.mailListName,
                            regData)
                            // errors
                            .then(null, function(err){
                                this.stats.increment("error", "Route.Register.User.SubscribeToNewsletter");
                                console.error("Auth: RegisterUserV2 - Error", err);
                                this.requestUtil.errorResponse(res, {key:"user.create.general"}, 500);
                            }.bind(this))
                    } else {
                        // do nothing api
                        promise = Util.PromiseContinue();
                    }

                    promise
                        .then(function(){
                            // beta
                            return sendBetaConfirmEmail.call(this, regData.email, req.protocol, req.headers.host);
                            // send email verification code
//                            return sendVerifyEmail.call(this, regData.email, req.protocol, req.headers.host);
                        }.bind(this))
                        // all ok
                        .then(function(){
                            this.stats.increment("info", "Route.Register.User."+Util.String.capitalize(regData.role)+".Created");
                            this.requestUtil.jsonResponse(res, 200);
                            // Disabled auto login after registering
                            // serviceManager.internalRoute('/api/v2/auth/login/glasslab', 'post', [req, res, next]);
                        }.bind(this))
                        // error
                        .then(null, function(err){
                            this.stats.increment("error", "Route.Register.User.sendRegisterEmail");
                            console.error("Auth: RegisterUserV2 - Error", err);
                            this.requestUtil.errorResponse(res, {key:"user.create.general"}, 500);
                        }.bind(this))

                }
            }.bind(this))
            // catch all errors
            .then(null, registerErr);
    }.bind(this);


    // instructor
    if(regData.role == lConst.role.instructor) {
        register(regData);
    }
    // else student
    else if(regData.role == lConst.role.student) {
        if(regData.regCode)
        {
            // get course Id from course code
            this.lmsStore.getCourseIdFromCourseCode(regData.regCode)
                // register, passing in institutionId
                .then(function(courseId){
                    if(courseId) {
                        // get rid of reg code, not longer needed
                        delete regData.regCode;

                        register(regData, courseId);
                    } else {
                        this.stats.increment("error", "Route.Register.User.InvalidInstitution");
                        registerErr({key:"user.enroll.code.invalid"}, 404);
                    }
                }.bind(this))
                // catch all errors
                .then(null, registerErr);
        } else {
            register(regData);
        }
    }

    this.stats.increment("info", "Route.Register.User."+Util.String.capitalize(regData.role));
}

function sendBetaConfirmEmail(email, protocol, host) {
    if( !(email &&
        _.isString(email) &&
        email.length) ) {
        this.requestUtil.errorResponse(res, {key:"user.verifyEmail.user.emailNotExist"}, 401);
    }

    var verifyCode = Util.CreateUUID();
    var expirationTime = Util.GetTimeStamp() + aConst.verifyCode.expirationInterval;

    return this.glassLabStrategy.getUserByEmail(email)
        .then(function(userData) {
            userData.verifyCode           = verifyCode;
            userData.verifyCodeExpiration = expirationTime;
            userData.verifyCodeStatus     = aConst.verifyCode.status.beta;

            return this.glassLabStrategy.updateUserData(userData)
                .then(function(){
                    var emailData = {
                        subject: "Playfully.org Beta confirmation",
                        to:   aConst.betaAdmin.email,
                        user: userData,
                        code: verifyCode,
                        host: protocol+"://"+host
                    };

                    var email = new Util.Email(
                        this.options.auth.email,
                        path.join(__dirname, "../email-templates"),
                        this.stats);
                    email.send('beta-verify', emailData)
                        .then(function(){
                            // all ok
                        }.bind(this))
                        // error
                        .then(null, function(err){
                            console.err('failed to send email:',  err);
                        }.bind(this));

                }.bind(this));
        }.bind(this))
        // catch all errors
        .then(null, function(err) {
            if( err.error &&
                err.error == "user not found") {
                this.requestUtil.errorResponse(res, {key:"user.verifyEmail.user.emailNotExist"}, 400);
            } else {
                console.error("AuthService: sendVerifyEmail Error -", err);
                this.requestUtil.errorResponse(res, {key:"user.verifyEmail.general"}, 400);
            }
        }.bind(this))
}

function validateBetaCode(req, res, next) {
    console.log('request:', req.params.code);
    if( !(req.params.code &&
        _.isString(req.params.code) &&
        req.params.code.length) ) {

        this.requestUtil.errorResponse(res, {key:"user.verifyEmail.code.missing"}, 401);
    }
    // 1) validate the code and get user data
    this.glassLabStrategy.findUser("verify_code", req.params.code)
        .then(function(userData) {
            // check if code expired
            if(Util.GetTimeStamp() > userData.verifyCodeExpiration) {
                this.requestUtil.errorResponse(res, {key:"user.verifyEmail.code.expired"}, 400);
            } else {

                if(userData.verifyCodeStatus === aConst.verifyCode.status.beta) {
                    // change status to verified
                    userData.verifyCodeStatus = aConst.verifyCode.status.sent;
                    userData.verifyCodeExpiration = "NULL";
                    userData.verifyCode = "NULL";

                    return this.glassLabStrategy.updateUserData(userData)
                        .then(function() {
                            this.requestUtil.jsonResponse(res, 200);
                            return userData;
                        }.bind(this));
                } else {
                    this.requestUtil.errorResponse(res, {key:"user.verifyEmail.general"}, 400);
                }
            }
        }.bind(this),
        function(err) {
            if( err.error &&
                err.error == "user not found") {
                this.requestUtil.errorResponse(res, {key:"user.verifyEmail.code.missing"}, 400);
            } else {
                console.error("AuthService: validateBetaCode Error -", err);
                this.requestUtil.errorResponse(res, {key:"user.verifyEmail.general"}, 400);
            }
        }.bind(this))
        .then(function(userData) {
            // send verification email to registered user
            return sendVerifyEmail.call(this, userData.email, req.protocol, req.headers.host);
        }.bind(this))
        .then(null, function(err) {
            console.log(err);
            this.requestUtil.errorResponse(res, {key:"user.verifyEmail.general"});
        });

}

function sendVerifyEmail(email , protocol, host) {
    if( !(email &&
        _.isString(email) &&
        email.length) ) {
        this.requestUtil.errorResponse(res, {key:"user.verifyEmail.user.emailNotExist"}, 401);
    }

    var verifyCode = Util.CreateUUID();
    var expirationTime = Util.GetTimeStamp() + aConst.verifyCode.expirationInterval;

    return this.glassLabStrategy.getUserByEmail(email)
        .then(function(userData) {
            userData.verifyCode           = verifyCode;
            userData.verifyCodeExpiration = expirationTime;
            userData.verifyCodeStatus     = aConst.verifyCode.status.sent;

            return this.glassLabStrategy.updateUserData(userData)
                .then(function(){
                    var emailData = {
                        subject: "Playfully.org - Verify your email",
                        to:   userData.email,
                        user: userData,
                        code: verifyCode,
                        host: protocol+"://"+host
                    };

                    var email = new Util.Email(
                        this.options.auth.email,
                        path.join(__dirname, "../email-templates"),
                        this.stats);
                    email.send('register-verify', emailData)
                        .then(function(){
                            // all ok
                        }.bind(this))
                        // error
                        .then(null, function(err){
                            console.err('failed to send email:',  err);
                        }.bind(this));

                }.bind(this));
        }.bind(this))
        // catch all errors
        .then(null, function(err) {
            if( err.error &&
                err.error == "user not found") {
                this.requestUtil.errorResponse(res, {key:"user.verifyEmail.user.emailNotExist"}, 400);
            } else {
                console.error("AuthService: sendVerifyEmail Error -", err);
                this.requestUtil.errorResponse(res, {key:"user.verifyEmail.general"}, 400);
            }
        }.bind(this))


}


function validateEmailCode(req, res, next) {

    if( !(req.params.code &&
        _.isString(req.params.code) &&
        req.params.code.length) ) {

        this.requestUtil.errorResponse(res, {key:"user.verifyEmail.code.missing"}, 401);
    }
        // 1) validate the code and get user data
        this.glassLabStrategy.findUser("verify_code", req.params.code)
            .then(function(userData) {
                // check if code expired
                if(Util.GetTimeStamp() > userData.verifyCodeExpiration) {
                    this.requestUtil.errorResponse(res, {key:"user.verifyEmail.code.expired"}, 400);
                } else {

                    if(userData.verifyCodeStatus === aConst.verifyCode.status.sent) {
                        // change status to verified
                        userData.verifyCodeStatus = aConst.verifyCode.status.verified;
                        userData.verifyCodeExpiration = "NULL";
                        userData.verifyCode = "NULL";

                        return this.glassLabStrategy.updateUserData(userData)
                            .then(function() {
                                this.requestUtil.jsonResponse(res, {});
                                return userData;
                            }.bind(this));
                    } else {
                        this.requestUtil.errorResponse(res, {key:"user.verifyEmail.general"}, 400);
                    }
                }
            }.bind(this),
                function(err) {
                    // potential cases if user not found:
                    // 1. incorrect verification code
                    // TODO account for:
                    // 2. user account deleted because user did not verify email in time
                    if( err.error &&
                        err.error == "user not found") {
                        this.requestUtil.errorResponse(res, {key:"user.verifyEmail.code.missing"}, 400);
                    } else {
                        console.error("AuthService: validateEmailCode Error -", err);
                        this.requestUtil.errorResponse(res, {key:"user.verifyEmail.general"}, 400);
                    }
            }.bind(this))
            .then(function(userData) {
                // 2) send welcome email
                return sendWelcomeEmail.call(this, this.options.auth.email, userData, req.protocol, req.headers.host);
            }.bind(this))
            .then(null, function(err) {
                console.log(err);
                this.requestUtil.errorResponse(res, {key:"user.welcomeEmail.general"});
            })
            // catch all errors
;

    }


function sendWelcomeEmail(emailOptions, regData, protocol, host){
    var verifyCode = Util.CreateUUID();
    // store code
    // 1) store code
    /*
     var emailData = {
     user: regData,
     code: verifyCode
     };
     */
    // TODO
    // instructor, manager or admin (all require email)
    // 2) send email
    var emailData = {
        subject: "Welcome to Playfully.org!",
        to:   regData.email,
        user: regData,
        host: protocol+"://"+host
    };
    var email = new Util.Email(
        emailOptions,
        path.join(__dirname, "../email-templates"),
        this.stats);

    return email.send('register-welcome', emailData);
}


function subscribeToNewsletter(apiKey, mailListName, regData){
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------

    try {
        var api = new mailChimp(apiKey, { version : '2.0' });
    } catch (err) {
        reject(err);
        return;
    }

    api.call('lists', 'list', {
        filters: {
            list_name: mailListName
        }
    }, function (err, listData) {
        if (err) {
            reject(err);
            return;
        }

        //console.log(listData);
        // find correct id
        var mailListId = "";
        if(listData.data) {
            for(var i = 0; i < listData.data.length; i++) {
                if(listData.data[i].name == mailListName) {
                    mailListId = listData.data[i].id;
                }
            }

            if(mailListId && mailListId.length > 0) {
                var subscribeParams = {
                    id: mailListId,
                    email: {
                        email: regData.email
                    },
                    merge_vars: {
                        FNAME: regData.firstName,
                        LNAME: regData.lastName
                    }
                };
                api.call('lists', 'subscribe', subscribeParams, function (err, subscribeData) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    //console.log( subscribeData );
                    resolve();
                });
            }
        }

    });
// ------------------------------------------------
}.bind(this));
// end promise wrapper
}


exampleIn.resetPasswordSend =
{
    "email": "asdasd@test.com"
};
function resetPasswordSend(req, res, next) {
    if( req.body.email &&
        _.isString(req.body.email) &&
        req.body.email.length) {
        var email = req.body.email;
        var resetCode = Util.CreateUUID();

        var expirationTime = Util.GetTimeStamp() + aConst.passwordReset.expirationInterval;

        // 1) valid user email and get the user data
        //    update user account with code
        this.glassLabStrategy.getUserByEmail(email)
            .then(function(userData) {
                userData.resetCode           = resetCode;
                userData.resetCodeExpiration = expirationTime;
                userData.resetCodeStatus     = aConst.passwordReset.status.sent;

                return this.glassLabStrategy.updateUserData(userData)
                    .then(function(){
                        //
                        // 2) send email
                        var emailData = {
                            subject: "Your Playfully.org Password",
                            to:   userData.email,
                            user: userData,
                            code: resetCode,
                            host: req.protocol+"://"+req.headers.host
                        };

                        var email = new Util.Email(
                            this.options.auth.email,
                            path.join(__dirname, "../email-templates"),
                            this.stats);
                        email.send('password-reset', emailData)
                            .then(function(){
                                // all ok
                                this.requestUtil.jsonResponse(res, {});
                            }.bind(this))
                            // error
                            .then(null, function(err){
                                this.requestUtil.errorResponse(res, err, 500);
                            }.bind(this));

                    }.bind(this));
            }.bind(this))

            // catch all errors
            .then(null, function(err) {
                if( err.error &&
                    err.error == "user not found") {
                    this.requestUtil.errorResponse(res, {key:"user.passwordReset.user.emailNotExist"}, 400);
                } else {
                    console.error("AuthService: resetPasswordSend Error -", err);
                    this.requestUtil.errorResponse(res, {key:"user.passwordReset.general"}, 400);
                }
            }.bind(this))

    } else {
        this.requestUtil.errorResponse(res, {key:"user.passwordReset.user.emailNotExist"}, 401);
    }
}

function resetPasswordVerify(req, res, next) {
    if( req.params.code &&
        _.isString(req.params.code) &&
        req.params.code.length) {

        // 1) validate the code and get user data
        this.glassLabStrategy.findUser("reset_code", req.params.code)
            .then(function(userData) {
                if(Util.GetTimeStamp() > userData.resetCodeExpiration) {
                    this.requestUtil.errorResponse(res, {key:"user.passwordReset.code.expired"}, 400);
                } else {
                    if(userData.resetCodeStatus == aConst.passwordReset.status.sent) {
                        // update status
                        userData.resetCodeStatus = aConst.passwordReset.status.inProgress;

                        // remove password as this is not changing, so password is not updated
                        delete userData.password;

                        return this.glassLabStrategy.updateUserData(userData)
                            .then(function() {
                                this.requestUtil.jsonResponse(res, {});
                            }.bind(this));
                    } else {
                        this.requestUtil.errorResponse(res, {key:"user.passwordReset.code.expired"}, 400);
                    }
                }
            }.bind(this))

            // catch all errors
            .then(null, function(err) {
                if( err.error &&
                    err.error == "user not found") {
                    this.requestUtil.errorResponse(res, {key:"user.passwordReset.code.expired"}, 400);
                } else {
                    console.error("AuthService: resetPasswordVerify Error -", err);
                    this.requestUtil.errorResponse(res, {key:"user.passwordReset.general"}, 400);
                }
            }.bind(this));

    } else {
        this.requestUtil.errorResponse(res, {key:"user.passwordReset.code.missing"}, 401);
    }
}

exampleIn.resetPasswordUpdate = {
    "password":"123",
    "code":"c987c960-b6fc-11e3-9058-7d52ee769e0e"
};
function resetPasswordUpdate(req, res, next) {
    if( req.body.code &&
        _.isString(req.body.code) &&
        req.body.code.length &&
        req.body.password &&
        _.isString(req.body.password) &&
        req.body.password.length) {

        // 1) validate the code and get user data
        this.glassLabStrategy.findUser("reset_code", req.body.code)
            .then(function(userData) {
                if(Util.GetTimeStamp() > userData.resetCodeExpiration) {
                    this.requestUtil.errorResponse(res, {key:"user.passwordReset.code.expired"}, 400);
                } else if(userData.resetCodeStatus == aConst.passwordReset.status.inProgress) {
                    return this.glassLabStrategy.encryptPassword(req.body.password)
                        .then(function(password) {
                            // update status
                            userData.password = password;
                            userData.resetCodeStatus = "NULL";
                            userData.resetCodeExpiration = "NULL";
                            userData.resetCode = "NULL";

                            return this.glassLabStrategy.updateUserData(userData);
                        }.bind(this))
                        .then(function() {
                            this.requestUtil.jsonResponse(res, {});
                        }.bind(this));
                }
            }.bind(this))

            // catch all errors
            .then(null, function(err) {
                console.error("AuthService: resetPasswordUpdate Error -", err);
                this.requestUtil.errorResponse(res, {key:"user.passwordReset.general"}, 400);
            }.bind(this));

    } else {
        this.requestUtil.errorResponse(res, {key:"user.passwordReset.code.missing"}, 401);
    }
}


