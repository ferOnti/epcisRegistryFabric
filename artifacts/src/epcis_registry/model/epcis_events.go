package model

import (
	"encoding/xml"
	"fmt"
	"time"
	"strings"
)

type Thingfield struct {
	Name   string   `xml:"name,attr"`
	Value  string   `xml:",chardata"`
}
	
type Thing struct {
	Epcid           string        `xml:"epcid,attr"`
	ThingfieldList  []Thingfield      `xml:"thingfield"`
}

type BizTransaction struct {
	Type   string   `xml:"type,attr"`
	Value  string   `xml:",chardata"`
}

//missing quantityElements
type ObjectEvent struct {
	XMLName             xml.Name         `xml:"ObjectEvent"`
	EventTime           time.Time        `xml:"eventTime"`
	RecordTime          time.Time        `xml:"recordTime"`
	EventTimeZoneOffset string           `xml:"eventTimeZoneOffset"`
	EpcList             []string         `xml:"epcList>epc"`    
	Action              string           `xml:"action"`
	BizStep             string           `xml:"bizStep"`
	Disposition         string           `xml:"disposition"`
	ReadPoint           []string         `xml:"readPoint>id"`    
	BizLocation         []string         `xml:"bizLocation>id"`    
	BizTransactionList  []BizTransaction `xml:"bizTransactionList>bizTransaction"`    
	ThingList           []Thing          `xml:"thingList>thing"`    
}

//missing quantityElements
type AggregationEvent struct {
	XMLName             xml.Name         `xml:"AggregationEvent"`
	EventTime           time.Time        `xml:"eventTime"`
	RecordTime          time.Time        `xml:"recordTime"`
	EventTimeZoneOffset string           `xml:"eventTimeZoneOffset"`
	ParentID            string           `xml:"parentID"`    
	ChildEPCs           []string         `xml:"childEPCs>epc"`    
	Action              string           `xml:"action"`
	BizStep             string           `xml:"bizStep"`
	Disposition         string           `xml:"disposition"`
	ReadPoint           []string         `xml:"readPoint>id"`    
	BizLocation         []string         `xml:"bizLocation>id"`    
	BizTransactionList  []BizTransaction `xml:"bizTransactionList>bizTransaction"`    
}

func UnmarshalObjectEvent(data string) (*ObjectEvent, error) {

	v := &ObjectEvent{}

	err := xml.Unmarshal([]byte(data), &v)
	if err != nil {
		fmt.Printf("error: %v", err)
		return nil, err 
	}

	//trimming bizTransaction ids
	for index, elem := range v.BizTransactionList {
 		Value := strings.TrimSpace(elem.Value)
        	v.BizTransactionList[index].Value = Value
	}	

	return v, nil
}

func UnmarshalAggregationEvent(data string) (*AggregationEvent, error) {

	v := &AggregationEvent{}

	err := xml.Unmarshal([]byte(data), &v)
	if err != nil {
		fmt.Printf("error: %v", err)
		return nil, err 
	}

	//trimming bizTransaction ids
	//for index, elem := range v.BizTransactionList {
 	//	Value := strings.TrimSpace(elem.Value)
    //    	v.BizTransactionList[index].Value = Value
	//}	

	return v, nil
}



