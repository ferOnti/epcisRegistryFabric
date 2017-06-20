function (doc) {
	if (doc.chaincodeid && doc.chaincodeid == "CHAINCODE_ID") { 
		if (doc.data && doc.data.bizStep && doc.data.assetType ) {
			emit(
				[
					doc.data.assetType,
					doc.data.bizLocation,
					doc.data.bizStep, 
					doc.data.disposition
				]
				, 1
			); 
		}
	} 
}
