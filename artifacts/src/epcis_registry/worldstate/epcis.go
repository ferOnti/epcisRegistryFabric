package worldstate

import (
	"encoding/json"
	"time"
	//"strconv"
	//"fmt"
	"epcis_registry/model"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

//deprecated
/*
func GetChildrenNumberFromThing(stub shim.ChaincodeStubInterface, epcid string) (int,error) {
	
	//parents := 0
	children := 0

	// ==== Check if epcisThing already exists ====
	epcThingAsBytes, err := stub.GetState(epcid)
	if err != nil {
		return 0, err
	}

	//if epcisThing already exists
	if epcThingAsBytes != nil {
		oldThing := &model.EpcThing{}

	    if err := json.Unmarshal(epcThingAsBytes, &oldThing); err != nil {
    		return 0, err
    	}

		//ParentIDs
		//if et.ParentIDs != nil {
		//	parents = len(et.ParentIDs)
		//}

		if oldThing.ChildEPCs != nil {
			children = len(oldThing.ChildEPCs)
		}

	} else {
		return children, nil
	}
	return children, nil
}
*/

func GetAssetTypeFromThing(stub shim.ChaincodeStubInterface, epcid string) (int, error) {
	
	assetType := 1

	// ==== Check if epcisThing already exists ====
	epcThingAsBytes, err := stub.GetState(epcid)
	if err != nil {
		return 0, err
	}

	//if epcisThing already exists
	if epcThingAsBytes != nil {
		oldThing := &model.EpcThing{}

	    if err := json.Unmarshal(epcThingAsBytes, &oldThing); err != nil {
    		return 0, err
    	}

		assetType = oldThing.AssetType

	} else {
		return assetType, nil
	}
	return assetType, nil
}

func SaveEpcisThing(stub shim.ChaincodeStubInterface, et *model.EpcThing) error {
	
	Epcid := et.Epcid

	// ==== Check if epcisThing already exists ====
	epcThingAsBytes, err := stub.GetState(Epcid)
	if err != nil {
		return err
	}

	var epcThingJSONasBytes []byte

	now := time.Now()
    
	//if epcisThing already exists
	if epcThingAsBytes != nil {
		oldThing := &model.EpcThing{}

	    if err := json.Unmarshal(epcThingAsBytes, &oldThing); err != nil {
    		return err
    	}

		//EventTime		
		if !et.EventTime.IsZero() {
			oldThing.EventTime = et.EventTime 
		}

		//all things start as items, only if they are present as parent in an agreggation, 
		//they will scalate to case, pallet, etc.

		//if the assetType is not the Default value, we should change it
		if et.AssetType !=0 {
			oldThing.AssetType = et.AssetType
		}
		oldThing.RecordTime = now 
 
		//BizStep
		if et.BizStep != "" {
			oldThing.BizStep = et.BizStep 
		}

		//Disposition
		if et.Disposition != "" {
			oldThing.Disposition = et.Disposition 
		}

		//BizLocation
		if (et.BizLocation != "") {
	    	oldThing.BizLocation  = et.BizLocation
		}	

		//EventTimeZoneOffset
		if et.EventTimeZoneOffset != "" {
			oldThing.EventTimeZoneOffset = et.EventTimeZoneOffset 
		}

		//Action
		if et.Action != "" {
			oldThing.Action = et.Action 
		}

		//ReadPoint
		if et.ReadPoint != "" {
			oldThing.ReadPoint = et.ReadPoint 
		}

		//BizTransaction      []EpcBizTransaction `json:"bizTransaction"`
		if et.BizTransaction != nil {
			typeFound := 0
			//todo: this will work for the first BizTransaction in the event, 
			//later will check and update more than one tx in the same event
			bizTxType := et.BizTransaction[0].Type

			for index, epcBizTransaction := range oldThing.BizTransaction {
				//if type is the same, update it
				if epcBizTransaction.Type == bizTxType {
					typeFound = 1
					oldThing.BizTransaction[index].Id = et.BizTransaction[0].Id
				}
			}	

			//if type was not found insert the new bizTX in the array
			if typeFound == 0 {
				oldThing.BizTransaction = append(oldThing.BizTransaction, et.BizTransaction[0] )
			}	
		}

		//Fields              []EpcThingfield `json:"fields"`   	
		if oldThing.AssetType==1 && et.Fields != nil {
			for etIndex, _ := range et.Fields {
				nameFound := 0
				fieldName := et.Fields[etIndex].Fieldname

				for index, epcThingfield := range oldThing.Fields {
					//if fieldName is the same, update it
					if epcThingfield.Fieldname == fieldName {
						nameFound = 1
						oldThing.Fields[index].Value = et.Fields[etIndex].Value
					}
				}	

				//if type was not found insert the new bizTX in the array
				if nameFound == 0 {
					oldThing.Fields = append(oldThing.Fields, et.Fields[etIndex] )
				}	
			}
		}

		epcThingJSONasBytes, err = json.Marshal(oldThing)
		if err != nil {
			return err
		}

		// === Update the epcThing with new state ===
		err = stub.PutState(Epcid, epcThingJSONasBytes)
		if err != nil {
			return err
		}

	} else {

		// ====  marshal it to JSON ====
		et.RecordTime = now

		//if thing is new, change to thing/item level by default
		if et.AssetType==0 {
			et.AssetType = 1
		}

		epcThingJSONasBytes, err = json.Marshal(et)
		if err != nil {
			return err
		}

		// === Save epcThing to state ===
		err = stub.PutState(Epcid, epcThingJSONasBytes)
		if err != nil {
			return err
		}

	}
	return nil
}

//deprecated
/*
func SaveEpcParent(stub shim.ChaincodeStubInterface, et *model.EpcParent) error {
	
	Epcid := et.Epcid

	// ==== Check if epcisThing already exists ====
	epcThingAsBytes, err := stub.GetState(Epcid)
	if err != nil {
		return err
	}

	var epcThingJSONasBytes []byte

	//if epcisThing already exists
	if epcThingAsBytes != nil {
		oldThing := &model.EpcParent{}

	    if err := json.Unmarshal(epcThingAsBytes, &oldThing); err != nil {
    		return err
    	}

		//EventTime		
		if !et.EventTime.IsZero() {
			oldThing.EventTime = et.EventTime 
		}
 
		//BizStep
		if et.BizStep != "" {
			oldThing.BizStep = et.BizStep 
		}

		//Disposition
		if et.Disposition != "" {
			oldThing.Disposition = et.Disposition 
		}

		//Action
		if et.Action != "" {
			oldThing.Action = et.Action 
		}


		//ChildEPCs      []string       `json:"ChildEPCs"`
		if et.ChildEPCs != nil {
			epcFound := 0

			for _, childEpcEt := range et.ChildEPCs {
				epcFound = 0
				for _, childEpcOld := range oldThing.ChildEPCs {
					if childEpcEt == childEpcOld {
						epcFound = 1
					}
				}
				if (epcFound==1) {
					oldThing.ChildEPCs = append(oldThing.ChildEPCs, childEpcEt )
				}
			}	
		}

		epcThingJSONasBytes, err = json.Marshal(oldThing)
		if err != nil {
			return err
		}

		// === Update the epc Parent with new state ===
		err = stub.PutState(Epcid, epcThingJSONasBytes)
		if err != nil {
			return err
		}

	} else {

		// ====  marshal it to JSON ====
		epcThingJSONasBytes, err = json.Marshal(et)
		if err != nil {
			return err
		}

		// === Save epcThing to state ===
		err = stub.PutState(Epcid, epcThingJSONasBytes)
		if err != nil {
			return err
		}

	}
	return nil
}
*/

