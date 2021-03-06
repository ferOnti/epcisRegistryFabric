
package main

import (
	//"encoding/json"
	//"time"
	"fmt"
	//"strconv"
	//"bytes"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"epcis_registry/model"
	"epcis_registry/worldstate"
)

// EpcisChaincode 
type EpcisChaincode struct {
}


// Init initializes chaincode
// ===========================
func (t *EpcisChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	/*
	nothing to declare
	*/
	return shim.Success(nil)
}

// Init initializes chaincode
// ===========================
func (t *EpcisChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()

	switch function {
    	case "addEpcThing":
    		return t.addEpcThing(stub, args)
    	case "delete":
    		return t.delete(stub, args)
	//case "getHistory" :
	//	return t.getHistory(stub, args)
    case "readEpcThing":
    		return t.readEpcThing(stub, args)

	}

	return shim.Error("Invalid invoke function name: " + function + " args: ")
}

// ===============================================
// addEpcThing - add epcThing to world-state
// ===============================================
func (t *EpcisChaincode) addEpcThing(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var err error
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting only one xml argument")
	}

	data := args[0]

	//ObjectEvent
	event1, err := model.UnmarshalObjectEvent(data);
	if err == nil {
		//iterate over all epcid in the epclist, and update each epcid
		for _, epcid := range event1.EpcList {
			et := model.BuildEpcThingFromObjectEvent(epcid, event1)
			err := worldstate.SaveEpcisThing(stub, et)
			if err != nil {
				return shim.Error(err.Error())
			}
		}	

		//finally return success for Object Events
		return shim.Success(nil)
	}

	//AggregationEvent
	event2, err := model.UnmarshalAggregationEvent(data);
	if err == nil {

		//iterate over all epcid in the epclist, to infers the LEVEL
		maxAssetType := 1 //default assetType
		for _, epcid := range event2.ChildEPCs {
			assetType, err := worldstate.GetAssetTypeFromThing(stub, epcid)

			if err != nil {
				return shim.Error(err.Error())
			}
			if (assetType > maxAssetType) {
				maxAssetType = assetType
			}
		}	

		maxAssetType = maxAssetType +1
		ep := model.BuildEpcParentFromAggregationEvent(event2, maxAssetType)
		err := worldstate.SaveEpcisThing(stub, ep)
		if err != nil {
			return shim.Error(err.Error())
		}

		//iterate over all epcid in the epclist, and update each epcid
		for _, epcid := range event2.ChildEPCs {
			et := model.BuildEpcThingFromAggregationEvent(epcid, event2)
			err := worldstate.SaveEpcisThing(stub, et)
			if err != nil {
				return shim.Error(err.Error())
			}
		}	

		//finally return success for Object Events
		return shim.Success(nil)
	}

	return shim.Error("Xml does not have any Valid Event")
}



// ===============================================
// delete - Deletes an entity from state
// ===============================================
func (t *EpcisChaincode) delete(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	epcid := args[0]

	// Delete the key from the state in ledger
	err := stub.DelState(epcid)
	if err != nil {
		return shim.Error("Failed to delete state")
	}

	return shim.Success(nil)
}

// ===============================================
// readEpcThing - read a epcThing from chaincode state
// ===============================================
func (t *EpcisChaincode) readEpcThing(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var epcid, jsonResp string
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting epcid of the epcThing to query")
	}

	epcid = args[0]
	valAsbytes, err := stub.GetState(epcid) //get the epcThing from chaincode state
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + epcid + "\"}"
		return shim.Error(jsonResp)
	} else if valAsbytes == nil {
		jsonResp = "{\"Error\":\"epcThing does not exist: " + epcid + "\"}"
		return shim.Error(jsonResp)
	}

	return shim.Success(valAsbytes)
}

// ===============================================
// History of an EPCIS
// ===============================================
/*
func (t *EpcisChaincode) getHistory(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	epcisId := args[0]

	fmt.Printf("- start getHistoryForEpcis: %s\n", epcisId)

	resultsIterator, err := stub.GetHistoryForKey(epcisId)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// if it was a delete operation on given key, then we need to set the
		//corresponding value null. Else, we will write the response.Value
		//as-is (as the Value itself a JSON marble)
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getHistoryForEpcis returning:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}
*/



func main() {
	err := shim.Start(new(EpcisChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
