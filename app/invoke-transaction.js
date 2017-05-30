
// This is an end-to-end test that focuses on exercising all parts of the fabric APIs
// in a happy-path scenario
'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');

var hfc = require('fabric-client');
var utils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');

var config = require('../config.json');
var helper = require('./helper.js');
var logger = helper.getLogger('invoke-chaincode');

hfc.addConfigFile(path.join(__dirname, 'network-config.json'));
var ORGS = hfc.getConfigSetting('network-config');

var tx_id = null;
var nonce = null;
var adminUser = null;
var allEventhubs = [];
var isSuccess = null;

// on process exit, always disconnect the event hub
process.on('exit', function() {
	if (isSuccess){
		logger.debug('\n============ Invoke transaction is SUCCESS ============\n')
	}else{
		logger.debug('\n!!!!!!!! ERROR: Invoke transaction FAILED !!!!!!!!\n')
	}
	for(var key in allEventhubs) {
		var eventhub = allEventhubs[key];
		if (eventhub && eventhub.isconnected()) {
			//logger.debug('Disconnecting the event hub');
			eventhub.disconnect();
		}
	}
});

	// this is a transaction, will just use org2's identity to
	// submit the request. intentionally we are using a different org
	// than the one that instantiated the chaincode, although either org
	// should work properly
	var org = config.orgsList[0]; // org2
	var client = new hfc();
	var chain = client.newChain(config.channelName);

	chain.addOrderer(
		helper.getOrderer()
	);

	var orgName = ORGS[org].name;
	var targets = [], eventhubs = [];
	// set up the chain to use each org's 'peer1' for
	// both requests and events
	for (let key in ORGS) {
		if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
			let data = fs.readFileSync(path.join(__dirname, ORGS[key].peer1['tls_cacerts']));
			let peer = new Peer(
				ORGS[key].peer1.requests,
				{
					pem: Buffer.from(data).toString(),
					'ssl-target-name-override': ORGS[key].peer1['server-hostname']
				}
			);
			chain.addPeer(peer);

			let eh = new EventHub();
			eh.setPeerAddr(
				ORGS[key].peer1.events,
				{
					pem: Buffer.from(data).toString(),
					'ssl-target-name-override': ORGS[key].peer1['server-hostname']
				}
			);
			eh.connect();
			eventhubs.push(eh);
			allEventhubs.push(eh);
		}
	}

	return hfc.newDefaultKeyValueStore({
	    path: helper.getKeyStoreForOrg(orgName)
	}).then((store) => {
		client.setStateStore(store);
    	return helper.getSubmitter(client, org);
	}).then((admin) => {

		logger.info('Successfully enrolled user \'admin\'');
		adminUser = admin;

		nonce = utils.getNonce();
		tx_id = chain.buildTransactionID(nonce, adminUser);
		utils.setConfigSetting('E2E_TX_ID', tx_id);
		logger.info('setConfigSetting("E2E_TX_ID") = %s', tx_id);
		logger.info(util.format('Sending transaction "%s"', tx_id));

		var args = null
		args = helper.getArgs(['000010','shipping','lcn:000001','po0001','HP','1234','0001'])

/*
        var xml = '<ObjectEvent><eventTime>2017-01-06T15:39:24Z</eventTime>' + 
        		'<recordTime>2017-01-06T15:39:24Z</recordTime>' +
			    '<eventTimeZoneOffset>-08:00</eventTimeZoneOffset>' +
		    	'<epcList>' +
        		'<epc>urn:epc:id:sgtin:41065887.79796.0000000301</epc>' +
        		'<epc>urn:epc:id:sgtin:41065887.79796.0000000302</epc>' +
        		'<epc>urn:epc:id:sgtin:41065887.79796.0000000303</epc>' +
        		'<epc>urn:epc:id:sgtin:41065887.79796.0000000304</epc>' +
		    	'</epcList>' +
    			'<action>OBSERVE</action>' +
			    '<bizStep>urn:epcglobal:cbv:bizstep:destroying</bizStep>' +
			    '<disposition>urn:epcglobal:cbv:disp:in_transit</disposition>' +
		    	'<readPoint><id>urn:epc:id:sgln:0012345.22222.3</id></readPoint>' +
		    	'<bizLocation><id>urn:epc:id:sgln:0012345.0001</id></bizLocation>' +
			    '<bizTransactionList>' +
		       	'  <bizTransaction type="urn:epcglobal:cbv:btt:po">po:11297</bizTransaction>' +
   				'</bizTransactionList>' +
        		'<thingList>' + 
        		'<thing epcid="urn:epc:id:sgtin:41065887.79796.0000000301"><thingfield name="name">Cannon 60RZVM</thingfield><thingfield name="skunumber">Cannon001</thingfield>          <thingfield name="color">Blue</thingfield></thing>' + 
        		'<thing epcid="urn:epc:id:sgtin:41065887.79796.0000000304"><thingfield name="name">Cannon 60RZVM</thingfield><thingfield name="skunumber">Cannon001</thingfield>          <thingfield name="color">Blue</thingfield></thing>' + 
        		'<thing epcid="urn:epc:id:sgtin:41065887.79796.0000000305"><thingfield name="name">Cannon 60RZVM</thingfield><thingfield name="skunumber">Cannon001</thingfield>          <thingfield name="color">Blue</thingfield></thing>' + 
        		'</thingList>' +

    			'</ObjectEvent>'
*/
/*
        var xml = '<ObjectEvent><eventTime>2017-01-06T15:39:24Z</eventTime>' + 
        		'<recordTime>2017-01-06T15:39:24Z</recordTime>' +
			    '<eventTimeZoneOffset>-08:00</eventTimeZoneOffset>' +
		    	'<epcList>' +
        		'<epc>urn:epc:id:sgtin:41065887.79796.0000000001</epc>' +
		    	'</epcList>' +
    			'<action>OBSERVE</action>' +
			    '<bizStep>urn:epcglobal:cbv:bizstep:assigning</bizStep>' +
			    '<disposition>urn:epcglobal:cbv:disp:in_transit</disposition>' +
		    	'<readPoint><id>urn:epc:id:sgln:0012345.000001</id></readPoint>' +
		    	'<bizLocation><id>urn:epc:id:sgln:0012345.0001</id></bizLocation>' +
			    '<bizTransactionList>' +
   				'</bizTransactionList>' +
        		'<thingList>' + 
        		'<thing epcid="urn:epc:id:sgtin:41065887.79796.0000000001"><thingfield name="name">Cannon 60RZVM</thingfield><thingfield name="skunumber">Cannon001</thingfield><thingfield name="color">Blue</thingfield></thing>' + 
        		'</thingList>' +
    			'</ObjectEvent>'
/**/
	//no action and no bizStep
        var xml = '<ObjectEvent><eventTime>2017-01-06T15:39:24Z</eventTime>' + 
        		'<recordTime>2017-01-06T15:39:24Z</recordTime>' +
			    //'<eventTimeZoneOffset>-05:00</eventTimeZoneOffset>' +
		    	'<epcList>' +
        		'<epc>urn:epc:id:sgtin:41065887.79796.0000000001</epc>' +
		    	'</epcList>' +
			    '<disposition>urn:epcglobal:cbv:disp:in_progressX</disposition>' +
		    	'<readPoint><id>urn:epc:id:sgln:0012345.000002y</id></readPoint>' +
		    	//'<bizLocation><id>urn:epc:id:sgln:0012345.0002z</id></bizLocation>' +
			    '<bizTransactionList>' +
		       	'  <bizTransaction type="urn:epcglobal:cbv:btt:bol">bol:0001</bizTransaction>' +
   				'</bizTransactionList>' +
        		'<thingList>' + 
        		'  <thing epcid="urn:epc:id:sgtin:41065887.79796.0000000001">' + 
        		'    <thingfield name="name">Cannon 222RZVM</thingfield>' + 
        		//'    <thingfield name="skunumber">Cannon001</thingfield>' +
        		//'    <thingfield name="color">Red</thingfield>' +
        		'    <thingfield name="price">1234.99</thingfield>' + 
        		'  </thing>' + 
        		'</thingList>' +
    			'</ObjectEvent>'
/**/

		args = helper.getArgs([ xml ])

		//args = helper.getArgs(['init', 'b'])
		// send proposal to endorser
		var request = {
			chaincodeId: config.chaincodeId,
			chaincodeVersion: config.chaincodeVersion,
			chainId: config.channelName,
			fcn: "addEpcThing",
			args: args,
			txId: tx_id,
			nonce: nonce
		};
		console.log(request)
		return chain.sendTransactionProposal(request);

	}, (err) => {

		logger.error('Failed to enroll user \'admin\'. ' + err);
		throw new Error('Failed to enroll user \'admin\'. ' + err);

	}).then((results) => {

		var proposalResponses = results[0];

		var proposal = results[1];
		var header   = results[2];
		var all_good = true;

		for(var i in proposalResponses) {
			let one_good = false;
			if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
				one_good = true;
				logger.info('transaction proposal was good');
			} else {
				logger.error('transaction proposal was bad');
			}
			all_good = all_good & one_good;
		}
		if (all_good) {
			//logger.debug(util.format('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));
			logger.debug(util.format('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s"', proposalResponses[0].response.status, proposalResponses[0].response.message));
			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal,
				header: header
			};

			// set the transaction listener and set a timeout of 30sec
			// if the transaction did not get committed within the timeout period,
			// fail the test
			var deployId = tx_id.toString();

			var eventPromises = [];
			eventhubs.forEach((eh) => {
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(reject, 15000);

					eh.registerTxEvent(deployId.toString(), (tx, code) => {
						clearTimeout(handle);
						eh.unregisterTxEvent(deployId);

						if (code !== 'VALID') {
							logger.error('The balance transfer transaction was invalid, code = ' + code);
							reject();
						} else {
							logger.info('The transaction has been committed on peer '+ eh.ep._endpoint.addr);
							resolve();
						}
					});
				});

				eventPromises.push(txPromise);
			});

			var sendPromise = chain.sendTransaction(request);
			return Promise.all([sendPromise].concat(eventPromises))
			.then((results) => {

				logger.debug(' event promise all complete and testing complete');
				return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call

			}).catch((err) => {

				logger.error('Failed to send transaction and get notifications within the timeout period.');
				throw new Error('Failed to send transaction and get notifications within the timeout period.');

			});

		} else {
			logger.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
			throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		}
	}, (err) => {

		logger.error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);

	}).then((response) => {

		if (response.status === 'SUCCESS') {
			logger.info('Successfully sent transaction to the orderer.');
			//logger.debug('******************************************************************');
			//logger.debug('To manually run query.js, set the following environment variables:');
			//logger.debug('E2E_TX_ID='+'\''+tx_id+'\'');
			//logger.debug('******************************************************************');

			isSuccess = true;
			process.exit();

		} else {
			logger.error('Failed to order the transaction. Error code: ' + response.status);
			throw new Error('Failed to order the transaction. Error code: ' + response.status);
		}
	}, (err) => {
		logger.error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
	});
