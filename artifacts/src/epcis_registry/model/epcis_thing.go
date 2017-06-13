package model

import (
	"time"
	"fmt"
)

type EpcBizTransaction struct {
	Type   string   `json:"type"`
	Id     string   `json:"id"`
}
type EpcThingfield struct {
	Fieldname   string   `json:"fieldname"`
	Value       string   `json:"value"`
}

type EpcThing struct {
	AssetType           string         `json:"assetType"` 
	Epcid               string         `json:"epcid"` 
	EventTime           time.Time      `json:"eventTime"`    
	RecordTime          time.Time      `json:"recordTime"`    
	BizStep             string         `json:"bizStep"`    
	Disposition         string         `json:"disposition"`    
	BizLocation         string         `json:"bizLocation"`
	BizTransaction      []EpcBizTransaction `json:"bizTransaction"`
	EventTimeZoneOffset string          `json:"eventTimeZoneOffset"`    
	Action              string          `json:"action"`    
	ReadPoint           string          `json:"readPoint"`    
	ParentIDs           []string        `json:"parentIDs"`
	Fields              []EpcThingfield `json:"fields"`   	
}

type EpcParent struct {
	AssetType           string         `json:"assetType"` 
	Epcid               string         `json:"epcid"` 
	EventTime           time.Time      `json:"eventTime"`    
	BizStep             string         `json:"bizStep"`    
	Disposition         string         `json:"disposition"`    
	Action              string         `json:"action"`    
	ChildEPCs           []string       `json:"childEPCs"`
}

func BuildEpcThingFromObjectEvent(epcid string, v *ObjectEvent) (*EpcThing) {		
	et := &EpcThing{}
	et.AssetType       = "thing"
	et.Epcid           = epcid
	et.BizStep         = v.BizStep
	et.EventTime       = v.EventTime
	et.RecordTime      = v.RecordTime
	et.EventTimeZoneOffset = v.EventTimeZoneOffset
	et.Action              = v.Action
	et.Disposition         = v.Disposition
	//et.ParentIDs       = nil
	if (len(v.ReadPoint) == 1) {
		et.ReadPoint           = v.ReadPoint[0]
	}
	if (len(v.BizLocation) == 1) {
		et.BizLocation           = v.BizLocation[0]
	}

	for _, bizTx := range v.BizTransactionList {
		tx := EpcBizTransaction{bizTx.Type, bizTx.Value}
		et.BizTransaction = append(et.BizTransaction, tx)
		fmt.Printf("%#v\n", et.BizTransaction)
	}

	for _, thing := range v.ThingList {
		if (thing.Epcid == epcid) {
			fmt.Printf("fields: %v\n", thing.ThingfieldList)
			for _, thingField := range thing.ThingfieldList {
				tf := EpcThingfield{thingField.Name, thingField.Value}
				et.Fields = append(et.Fields, tf)
				fmt.Printf("%#v\n", et.Fields)
			}

		}
	}
	fmt.Printf("EpcisThing: %#v\n\n", et )

	return et
}

func BuildEpcThingFromAggregationEvent(epcid string, v *AggregationEvent) (*EpcThing) {		
	et := &EpcThing{}
	et.AssetType       = "thing"
	et.Epcid           = epcid
	et.BizStep         = v.BizStep
	et.EventTime       = v.EventTime
	et.RecordTime      = v.RecordTime
	et.EventTimeZoneOffset = v.EventTimeZoneOffset
	et.Action              = v.Action
	et.Disposition         = v.Disposition

	//parentIDs
	var parents []string
	parents = append(parents, v.ParentID)
	et.ParentIDs           = parents

	if (len(v.ReadPoint) == 1) {
		et.ReadPoint           = v.ReadPoint[0]
	}
	if (len(v.BizLocation) == 1) {
		et.BizLocation           = v.BizLocation[0]
	}

	//for _, bizTx := range v.BizTransactionList {
	//	tx := EpcBizTransaction{bizTx.Type, bizTx.Value}
	//	et.BizTransaction = append(et.BizTransaction, tx)
	//	fmt.Printf("%#v\n", et.BizTransaction)
	//}

	return et
}


func BuildEpcParentFromAggregationEvent(v *AggregationEvent) (*EpcParent) {		
	ep := &EpcParent{}
	ep.AssetType       = "parent"
	ep.Epcid           = v.ParentID
	ep.EventTime       = v.EventTime
	ep.Action          = v.Action
	ep.Disposition     = v.Disposition
	ep.BizStep         = v.BizStep
	ep.ChildEPCs       = v.ChildEPCs

	//for _, bizTx := range v.BizTransactionList {
	//	tx := EpcBizTransaction{bizTx.Type, bizTx.Value}
	//	et.BizTransaction = append(et.BizTransaction, tx)
	//	fmt.Printf("%#v\n", et.BizTransaction)
	//}

	return ep
}

func BuildEpcParentFromObjectEvent(epcid string, v *ObjectEvent) (*EpcParent) {		
	ep := &EpcParent{}
	ep.AssetType       = "parent"
	ep.Epcid           = epcid
	ep.EventTime       = v.EventTime
	ep.Action          = v.Action
	ep.Disposition     = v.Disposition
	ep.BizStep         = v.BizStep
	//ep.ChildEPCs       = v.ChildEPCs

	//for _, bizTx := range v.BizTransactionList {
	//	tx := EpcBizTransaction{bizTx.Type, bizTx.Value}
	//	et.BizTransaction = append(et.BizTransaction, tx)
	//	fmt.Printf("%#v\n", et.BizTransaction)
	//}

	return ep
}


