
module.exports = {
    index: "index.html",
    // --------------------------------------------------------------------------------------
    statics: [
        {
            requireAuth: true,
            routes: [
                "/welcome",
                "/classes",
                "/reports",
                "/roster",
                "/class",
                "/report",
                "/create",
                "/code",
                "/missions",
                "/challenge",
                "/license",
                "/admin"
            ],
            file: "index"
        }
    ],

    // --------------------------------------------------------------------------------------
    apis: [
    // ---------------------------------------------------
    // Version 2
    // ---------------------------------------------------
        {
            api: "/api/v2/data/config/:id",
            service: "data",
            controller: "config",
            method: {
                get: "index"
            }
        },
        {
            api: "/api/v2/data/session/start",
            service: "data",
            controller: "session",
            method: {
                post: "startSessionV2"
            }
        },
        {
            api: "/api/v2/data/session/end",
            service: "data",
            controller: "session",
            method: {
                post: "endSessionV2"
            }
        },
        {
            api: "/api/v2/data/events",
            service: "data",
            controller: "events",
            method: {
                post: "sendBatchTelemetryV2"
            }
        },
        // ---------------------------------------------------
        {
            requireAuth: true,
            api: "/api/v2/lms/courses",
            service: "lms",
            controller: "course",
            method: {
                get: "getEnrolledCourses"
            }
        },
        {
            requireAuth: true,
            api: "/api/v2/lms/course/create",
            service: "lms",
            controller: "course",
            method: {
                post: "createCourse"
            }
        },
        {
            api: "/api/v2/lms/course/code/valid",
            service: "lms",
            controller: "course",
            method: {
                post: "validCode"
            }
        },
        {
            api: "/api/v2/lms/course/code/newcode",
            service: "lms",
            controller: "course",
            method: {
                post: "newCode"
            }
        },
        {
            requireAuth: true,
            api: "/api/v2/lms/course/enroll",
            service: "lms",
            controller: "course",
            method: {
                post: "enrollInCourse"
            }
        },
        {
            requireAuth: true,
            api: "/api/v2/lms/course/unenroll",
            service: "lms",
            controller: "course",
            method: {
                post: "unenrollFromCourse"
            }
        },
        {
            requireAuth: true,
            api: "/api/v2/lms/course/:id",
            service: "lms",
            controller: "course",
            method: {
                get: "showCourse",
                post: "updateCourse",
                "delete": "deleteCourse"
            }
        },
        // ---------------------------------------------------
        {
            api: "/api/v2/auth/user/register",
            service: "auth",
            controller: "user",
            method: {
                post: "registerUserV2"
            }
        },
        {
            requireAuth: true,
            api: "/api/v2/auth/user/:id",
            service: "auth",
            controller: "user",
            method: {
                get: "showUser",
                post: "updateUser"
            }
        },
        {
            api: "/api/v2/auth/login/glasslab",
            service: "auth",
            controller: "login",
            method: {
                post: "glassLabLogin"
            }
        },
        {
            api: "/api/v2/auth/resetpassword/send",
            service: "auth",
            controller: "resetpassword",
            method: {
                post: "resetPasswordSendLink"
            }
        },
        {
            api: "/api/v2/auth/resetpassword/update",
            service: "auth",
            controller: "resetpassword",
            method: {
                post: "resetPasswordUpdate"
            }
        },
        {
            api: "/api/v2/auth/resetpassword/verify",
            service: "auth",
            controller: "resetpassword",
            method: {
                post: "resetPasswordVerifyLink"
            }
        },
    // ---------------------------------------------------
    // Version 1
    // ---------------------------------------------------
        {
            api: "/api/config",
            service: "data",
            controller: "config",
            method: {
                get: "index"
            }
        },
        {
            api: "/api/user/login",
            service: "auth",
            controller: "login",
            method: {
                post: "glassLabLogin"
            }
        },
        {
            requireAuth: true,
            api: "/api/user/:id",
            service: "auth",
            controller: "user",
            method: {
                get: "showUser",
                post: "updateUser"
            }
        },
        {
            requireAuth: true,
            api: "/api/course",
            service: "lms",
            controller: "course",
            method: {
                get: "getEnrolledCourses"
            }
        },
        {
            requireAuth: true,
            api: "/api/course/create",
            service: "lms",
            controller: "course",
            method: {
                post: "createCourse"
            }
        },
        {
            requireAuth: true,
            api: "/api/course/:id",
            service: "lms",
            controller: "course",
            method: {
                get: "getCourse"
            }
        },
        {
            requireAuth: true,
            api: "/api/course/update",
            service: "lms",
            controller: "course",
            method: {
                post: "updateCourse"
            }
        },
        {
            requireAuth: true,
            api: "/api/course/unenroll/:id",
            service: "lms",
            controller: "course",
            method: {
                post: "unenrollUserFromCourse"
            }
        },
        {
            api: "/api/user/resetpassword/send",
            service: "auth",
            controller: "user",
            method: {
                post: "resetPasswordSend"
            }
        },
        {
            api: "/api/user/resetpassword/verify/:code",
            service: "auth",
            controller: "user",
            method: {
                get: "resetPasswordVerify"
            }
        },
        {
            api: "/api/user/resetpassword/update",
            service: "auth",
            controller: "user",
            method: {
                post: "resetPasswordUpdate"
            }
        }
    ]

};