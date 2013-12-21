/**
 * API Routes Consts
 *
 */

var api = '/api';

module.exports = {
    login:              api+'/user/login',
    logout:             api+'/user/logout',
    wa_session: {
        validate:       api+'/wa-session/validate/:id'
    },
    session: {
        validate:       api+'/session/validate/:id'
    },
    startsession:       api+'/:type/startsession',
    sendtelemetrybatch: api+'/:type/sendtelemetrybatch',
    endsession:         api+'/:type/endsession'
};
