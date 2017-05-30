'use strict';
var hfc = require('fabric-client');
var util = require('util');
var fs = require('fs');
var path = require('path');

var config = require('../config.json');
var helper = require('./helper.js');
var logger = helper.getLogger('Create-Channel');

createChannel();
//
//Attempt to send a request to the orderer with the sendCreateChain method
//
function createChannel(){
  logger.debug('\n====== Creating Channel \''+config.channelName+'\' ======\n');
	//
	// Create and configure the chain
	//
	var client = new hfc();
	var chain = client.newChain(config.channelName);

	console.log(chain);
	chain.addOrderer(
		helper.getOrderer()
	);

	// Acting as a client in org1 when creating the channel
	var org = helper.getOrgName(config.orgsList[0]);

	return hfc.newDefaultKeyValueStore({
		path: helper.getKeyStoreForOrg(org)
	}).then((store) => {
		client.setStateStore(store);
		return helper.getSubmitter(client, config.orgsList[0]);
	})
	.then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');

		// reading the envelope to send to the orderer
		//data = fs.readFileSync(config.channelConfigurationTxn);
		var data = fs.readFileSync(path.join(__dirname, "../"+config.channelConfigurationTxn));
		var request = {
			envelope : data
		};
		// send to orderer
		console.log(request);
		return chain.createChannel(request);
	}, (err) => {
		logger.error('Failed to enroll user \'admin\'. ' + err);
	})
	.then((response) => {
		logger.info(response)
		logger.info(' response ::%j',response);

		if (response && response.status === 'SUCCESS') {
			logger.info('Successfully created the channel.');
			return sleep(5000);
		} else {
			logger.error('Failed to create the channel. ');
			logger.info('\n!!!!!!!!! Failed to create the channel \''+config.channelName+'\' !!!!!!!!!\n\n')
		}
	}, (err) => {
		console.log(err);
		logger.error('Failed to initialize the channel: ' + err.stack ? err.stack : err);
	})
	.then((nothing) => {
		logger.debug('Successfully waited to make sure channel \''+config.channelName+'\' was created.');
		logger.debug('\n====== Channel creation \''+config.channelName+'\' completed ======\n\n')
	}, (err) => {
		logger.error('Failed to sleep due to error: ' + err.stack ? err.stack : err);
	});
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
