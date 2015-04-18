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

    // general
    "general.notFound":                     "Page not found!",
    // new
    "course.general":                       "We encountered an error. Please try again.",
    "course.locked":                        "Course Registration is Locked at the moment. Please try again later.",
    "course.notUnique.name":                "Class names must be unique. Please choose a different class name.",
    "course.cannot.enable":                 "This action would not enable any premium games",
    //user
    "user.permit.invalid":                  "Your role does not have permission to access this feature",
    "user.enroll.general":                  "There was an error with the information you entered.",
    "user.enroll.code.missing":             "The class code is missing.",
    "user.enroll.code.invalid":             "The class code is invalid.",
    "user.enroll.code.used":                "You have already enrolled for this class",
    "user.unenroll.general":                "There was an error with the information you entered.",
    "user.unenroll.notEnrolled":            "You are not enrolled in this class",
    "user.enroll.sdk.course.invalid":       "The class you tried to join does not have this game",
    "user.enroll.sdk.course.missing":       "The course id is missing",
    "user.enroll.sdk.game.missing":         "the game id is missing",
    "user.update.general":                  "We encountered an issue and cannot update your information at this time.",
    "user.create.general":                  "There was an error with the information you entered.",
    "user.create.input.missing.username":   "Missing Username",
    "user.create.input.missing.password":   "Missing Password",
    "user.create.input.missing.firstName":  "Missing First Name",
    "user.create.input.missing.email":      "Missing Email",
    "user.create.input.missing.state":      "Missing State",
    "user.create.input.missing.school":     "Missing School",
    "user.notUnique.email":                 "The email address is already in use by another user. Please provide a different email address.",
    "user.notUnique.screenName":            "The screen name is already in use by another user.",
    "user.delete.information":              "There was an error with the information you entered.",
    "user.delete.access":                   "You can only delete student accounts in your classes",
    "user.delete.general":                  "We encountered an error and cannot delete the account at this time",
    "user.delete.owner.license":            "We cannot delete the user account of an active license owner.  First cancel the license",
    // not used any more
    //"user.notUnique.institution":  "The institution name is already in use. Please provide a different institution name.",
    "user.login.general":                   "There was an error with the information you entered.",
    "user.login.internal":                  "We have encountered an error. Please try again later",
    "user.login.invalid":                   "The screen name/email address or password you provided does not match our records. Please try again.",
    "user.login.invalidHashCode":           "The hash code you entered is invalid.",
    "user.login.missing":                   "You forgot to enter your screen name/email address or password.",
    "user.login.notVerified":               "Please check your email to complete creating your account",
    "user.login.betaPending":               "Your account is currently pending approval by our admin. We will notify you of your beta status via email shortly. If you have any questions, please let us know at: " + aConst.support.email,
    "user.login.approvePending":            "Your account is currently pending approval by our admin. We will notify you of your registration status via email shortly. If you have any questions, please let us know at: " + aConst.support.email,
    "user.login.notLoggedIn":               "You are not logged in",
    "user.passwordReset.general":           "We encountered an error. Please try again.",
    "user.passwordReset.code.missing":      "The code is invalid.",
    "user.passwordReset.code.expired":      "Oops, your code has expired. You'll need to go through the password reset process again.",
    "user.passwordReset.code.invalid":      "The URL provided is not valid. Please try cutting and pasting again from the email you received with password reset information.",
    "user.passwordReset.user.emailNotExist":"This email address does not exist in our system.",
    "user.verifyEmail.general":             "We encountered an error. Please try again later. If you have any questions, please let us know at: " + aConst.support.email,
    "user.verifyEmail.code.missing":        "The code you entered is invalid.",
    "user.verifyEmail.code.expired":        "Oops, your code has expired. You'll need another verification code.",
    "user.verifyEmail.accountDeleted":      "Your account has been deleted because you didn't verify your email account in the time allotted. Please try registering your account again.",
    "user.verifyEmail.code.invalid":        "The URL provided is not valid. Please try cutting and pasting again from the email you received with verification information.",
    "user.verifyEmail.user.emailNotExist":  "This email address does not exist in our system.",
    "user.verifyEmail.alreadyValidated":    "You have already validated your email, please sign in using the \"Sign In\" button above.",
    "user.welcomeEmail.general":            "We encountered an error sending your welcome email. Please try again",
    "user.gameId.invalid":                  "Invalid gameId",
    "user.has.access":                      "Developer already has access",
    "user.has.requested":                   "Developer already requested access",
    // config
    "data.gameId.general":                  "We encountered an error. Please try again.",
    "data.gameId.missing":                  "This game Id does not exist in our system",
    "data.gameId.invalid":                  "This game Id is not in our list of valid games",
    "data.gameConfig.missing":              "You did not input game config",
    "data.userId.missing":                  "Missing UserId",
    "data.userId.invalid":                  "Invalid UserId",
    "data.match.status.missing":            "Status is missing",
    "data.gameId.match":                    "Game cannot create a match",
    "data.turnData.missing":                "Turn data is missing",
    "data.access.invalid":                  "Invalid Access",
    "data.matchId.missing":                 "Missing MatchId",
    "data.match.access":                    "This user is not a part of this match",
    // report
    "report.general":                       "There is a problem with this report",
    "report.access.invalid":                "Invalid Access",
    "report.gameId.invalid":                "Invalid gameId",
    "report.reportId.invalid":              "invalid reportId",
    "report.gameId.missing":                "Missing gameId",
    "report.reportId.missing":              "Missing ReportId",
    "report.userId.missing":                "Missing UserId",
    "report.assessmentId.missing":          "Missing AssessmentId",
    "report.body.missing":                  "Missing Body",
    // dash
    "dash.permission.denied":               "You do not have permission to perform this operation.",
    "dash.gameId.access.denied":            "You do not have access to this game.",
    "dash.messageId.invalid":               "Invalid messageId",
    "dash.messageId.missing":               "Missing messageId",
    "dash.icon.missing":                    "Missing icon when posting a new message",
    "dash.subject.missing":                 "Missing subject when posting a new message",
    "dash.message.missing":                 "Missing message when posting a new message",
    "dash.info.missing":                    "Missing information content when posting an update",
    "dash.info.malformed":                  "The info document has been corrupted",
    // research
    "research.access.invalid":              "Invalid Access",
    "research.gameId.missing":              "Missing Game Id",
    "research.startDate.missing":           "Missing startDate or startEpoc",
    "research.arguments.missing":           "Missing Arguments",
    "research.endDate.missing":             "Missing endDate",
    // lms
    "lms.game.invalid":                     "Cannot access another license's premium game",
    "lms.course.premium.corrupted":         "Course labels itself as a premium course, but it is not associated with a license",
    "lms.access.invalid":                   "Invalid Access",
    "lms.course.not.premium":               "This course is not a associated with a license",
    // lic
    "lic.access.invalid":                   "Invalid Access",
    "lic.records.invalid":                  "User tied to to more than one license",
    "lic.access.absent":                    "Only instructors who are part of an active license should have access",
    "lic.access.removed":                   "You have been removed from license access. Please check your email for more information.",
    "lic.records.inconsistent":             "The license records are inconsistent.  Review records",
    "lic.educators.full":                   "There are not enough seats in the license for this list of educators",
    "lic.students.full":                    "This class is already full. Please contact your teacher.",
    "lic.students.full.enable.premium":     "This license does not have enough student seats left to accommodate for all the students in this class. To enable premium games, please update your plan or reduce the number of students in this class.",
    "lic.create.denied":                    "An instructor currently on a license cannot create a new license",
    "lic.account.inactive":                 "The payment transaction did not go through",
    "lic.trial.expired":                    "Instructor was part of a license in the past",
    "lic.email.invalid":                    "Emails with a + are not allowed for trials",
    "lic.cancelled.already":                "License auto-renew has already been cancelled, method should not be called",
    "lic.renewing.already":                 "License auto-renew is already enabled, method should not be called",
    "lic.promoCode.missing":                "No promo code was supplied",
    "lic.promoCode.invalid":                "The promo code supplied was invalid",
    "lic.promoCode.noMoreRedemptions":      "This promo code has already been used and has no redemptions remaining",
    "lic.general":                          "We encountered an error. Please try again",
    "lic.order.pending":                    "You currently have a pending purchase order. Please consult your billing department",
    "lic.order.absent":                     "No purchase order was found",
    "lic.action.invalid":                   "The action you listed is not supported by our system.  Please recheck your options",
    "lic.order.received.already":           "This purchase order has already been marked as received by our system",
    "lic.card.declined":                    "Your card was declined.",
    "lic.card.cvc.incorrect":               "Your card's security code is incorrect.",
    "lic.access.invited":                   "You are already invited to another license.  Log out and log in again to join.",
    "lic.card.expired":                     "Your card has expired.",
    "lic.card.processing.error":            "An error occurred while processing your card.  Try again in a little bit.",
    "lic.order.action.denied":              "This action cannot be done for this purchase order.  Check the purchase order table.",
    "lic.upgrade.invalid":                  "You cannot decrease student seats in an update",
    "lic.order.processing":                 "Your purchase order is being processed.  Please reach out to our billing department if you would like to alter it.",
    "lic.order.mismatch":                   "The purchase order key and purchase order number do not match in the database. Check again",
    "lic.form.invalid":                     "Please properly enter the form data",
    "lic.upgrade.recent":                   "Updating accounts can only happen once every 90 days.  Please contact support@glasslabgames.org with any concerns"
};
