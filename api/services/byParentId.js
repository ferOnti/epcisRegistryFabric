function (doc) {
	if (doc.chaincodeid && doc.chaincodeid == "CHAINCODE_ID") { 
		if (doc.data && doc.data.assetType == "parent" ) {
			emit([doc.data.bizStep, doc.data.disposition], 1); 
		}
	} 
}