'use strict';

module.exports = function(app) {
    let epcisController = require('../controllers/epcisController');
    let homeController  = require('../controllers/homeController');

	// epcis Routes
	app.route('/')
		.get(homeController.home);

	// epcis Routes
	app.route('/event/:id')
		.get(epcisController.query);

	app.route('/api/query')
		.get(epcisController.query);

	app.route('/bizTx/:id')
		.get(homeController.bizTx);

	// epcis Routes
	app.route('/api/stats')
		.get(epcisController.stats);

    app.route('/api/event')
        .post(epcisController.postEpcisEvent);

    app.route('/api/epcid/:id')
        .get(epcisController.getEpcid);

    app.route('/api/bizTx/:id')
        .get(epcisController.bizTxBase64);
    
    app.route('/api/bizTx')
        .post(epcisController.bizTx);
};
