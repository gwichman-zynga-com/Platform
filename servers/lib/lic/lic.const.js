/**
 * License Consts
 *
 */

module.exports = {
    licenseCodeTypes: {
        'GL-SC-001': 'SimCityEDU Single License',
        'GL-SC-007': 'SimCityEDU Lab/Family Pack',
        'GL-SC-031': 'SimCityEDU Class Pack',
        'GL-SC-120': 'SimCityEDU School Pack',
        'GL-SC-250': 'SimCityEDU Site Unlimited'
    },
    datastore: {
        licenseKey: "lic"
    },
    plan: {
        chromebook: {
            strip_planId: 'test_chromebook',
            name: 'Chromebook/Web',
            description: 'All Games in this package are optimized to work on Chromebooks.',
            pricePerSeat: 2.5,
            browserGames: ['AW-1','GOG','SLFR'],
            iPadGames: [],
            downloadableGames: []
        },
        ipad: {
            strip_planId: 'test_ipad',
            name: 'iPad',
            description: 'All Games in this package are optimized to work on iPads.',
            pricePerSeat: 3.5,
            browserGames: [],
            iPadGames: ['AA-1','PVZ','WT'],
            downloadableGames: []
        },
        pcmac: {
            strip_planId: 'test_pcmac',
            name: 'PC/MAC',
            description: 'Games in this package run on PC or Mac computers.',
            pricePerSeat: 2.5,
            browserGames: ['AW-1','GOG','SLFR'],
            iPadGames: [],
            downloadableGames: ['SC']
        },
        allgames: {
            strip_planId: 'test_all',
            name: 'All Games',
            description: 'This package includes all games available on this site.',
            pricePerSeat: 5,
            browserGames: ['AW-1','GOG','SLFR'],
            iPadGames: ['AA-1','PVZ','WT'],
            downloadableGames: ['SC']
        }
    },
    seats: {
        group: {
            size: "Group",
            studentSeats: 10,
            educatorSeats: 1,
            discount: 0
        },
        class: {
            size: "Class",
            studentSeats: 30,
            educatorSeats: 1,
            discount: 20
        },
        multiclass: {
            size: "Multi Class",
            studentSeats: 120,
            educatorSeats: 4,
            discount: 25
        },
        school: {
            size: "School",
            studentSeats: 500,
            educatorSeats: 15,
            discount: 30
        }
    },
    stripeTestCard: {
        number: 4242424242424242,
        exp_month: 1,
        exp_year: 2020,
        cvc: 123
    }
};
