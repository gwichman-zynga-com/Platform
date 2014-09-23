var aConst = require('./auth/auth.js').Const;


module.exports = {
    // old
    "course.not.unique":    "course.notUnique",
    "code.missing":         "user.enroll.code.missing",
    "code.invalid":         "user.enroll.code.invalid",
    "already.enrolled":     "user.enroll.code.used",
    "email.not.unique":     "user.notUnique.email",
    "username.not.unique":  "user.notUnique.screenName",
    "missing.code.pass":    "user.passwordReset.code.missing",
    "code.expired":         "user.passwordReset.code.expired",
    "email.no.exist":       "user.passwordReset.user.emailNotExist",
    "invalid":              "user.login.invalid",
    "institution.exists":   "user.notUnique.institution",
    "invalid.hash":         "user.passwordReset.code.invalid",
    "missing":              "user.login.missing",
    "missing.data":         "Game data missing",

    // new
    "course.general":                       "We encountered an error. Please try again.",
    "course.locked":                        "Course Registration is Locked at the moment. Please try again later.",
    "course.notUnique.name":                "Class names must be unique. Please choose a different class name.",
    "user.permit.invalid":                  "Your role does not have permission to access this feature",
    "user.enroll.general":                  "There was an error with the information you entered.",
    "user.enroll.code.missing":             "The class code is missing.",
    "user.enroll.code.invalid":             "The class code is invalid.",
    "user.enroll.code.used":                "You have already enrolled for this class",
    "user.unenroll.general":                "There was an error with the information you entered.",
    "user.unenroll.notEnrolled":            "You are not enrolled in this class",
    "user.update.general":                  "We encountered an issue and cannot update your information at this time.",
    "user.create.general":                  "There was an error with the information you entered.",
    "user.create.input.missing.username":   "Missing Username",
    "user.create.input.missing.password":   "Missing Password",
    "user.create.input.missing.firstName":  "Missing First Name",
    "user.create.input.missing.email":      "Missing Email",
    "user.notUnique.email":                 "The email address is already in use by another user. Please provide a different email address.",
    "user.notUnique.screenName":            "The screen name is already in use by another user.",
    // not used any more
    //"user.notUnique.institution":  "The institution name is already in use. Please provide a different institution name.",
    "user.login.general":                   "There was an error with the information you entered.",
    "user.login.invalid":                   "The email address or password you provided does not match our records. Please try again.",
    "user.login.invalidHashCode":            "The hash code you entered is invalid.",
    "user.login.missing":                   "You forgot to enter your email address or password.",
    "user.login.notVerified":               "Please verify your email account",
    "user.login.betaPending":               "Your account is currently pending approval by our admin. We will notify you of your beta status via email shortly. If you have any questions, please let us know at: " + aConst.support.email,
    "user.login.notLoggedIn":               "You are not logged in",
    "user.passwordReset.general":           "We encountered an error. Please try again.",
    "user.passwordReset.code.missing":      "The code is invalid.",
    "user.passwordReset.code.expired":      "Oops, your code has expired. You'll need to go through the password reset process again.",
    "user.passwordReset.code.invalid":      "The URL provided is not valid. Please try cutting and pasting again from the email you received with password reset information.",
    "user.passwordReset.user.emailNotExist":"This email address does not exist in our system.",
    "user.verifyEmail.general":             "We encountered an error. Please try again.",
    "user.verifyEmail.code.missing":        "The code you entered is invalid.",
    "user.verifyEmail.code.expired":        "Oops, your code has expired. You'll need another verification code.",
    "user.verifyEmail.accountDeleted":      "Your account has been deleted because you didn't verify your email account in the time allotted. Please try registering your account again.",
    "user.verifyEmail.code.invalid":        "The URL provided is not valid. Please try cutting and pasting again from the email you received with verification information.",
    "user.verifyEmail.user.emailNotExist":  "This email address does not exist in our system.",
    "user.welcomeEmail.general":            "We encountered an error sending your welcome email. Please try again",
    // config
    "data.gameId.general":                  "We encountered an error. Please try again.",
    "data.gameId.missing":                  "This game Id does not exist in our system",
    "data.gameId.invalid":                  "This game Id is not in our list of valid games",
    "data.gameConfig.missing":              "You did not input game config"

};
