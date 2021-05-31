
const express = require("express");
const {WebhookClient}=require("dialogflow-fulfillment");
const {Payload}=require("dialogflow-fulfillment");
const app=express();
const MongoClient=require('mongodb').MongoClient;
var url="mongodb://127.0.0.1:27017";
var randomstring=require("randomstring");
var user_name="";
var phonenumber=0;
app.post("/dialogflow",express.json(),(req,res)=>{
    const agent=new WebhookClient({
        request:req,response:res
    });

async function identify_user(agent)
{
    const phno=agent.parameters.phno;
    console.log(phno.length);
    const client=new MongoClient(url,{useUnifiedTopology:true});
    await client.connect();
    var phoneno = /^\d{10}$/;
    if(phno.match(phoneno))
    {
    const result=await client.db("chatbot").collection("users").findOne({phno:phno});
    if(result==null)
    {
        await agent.add("Sorry,this mobile number is not registered,to get registered please provide your username");
        phonenumber=phno;
    }
    else
    {
        user=result.name;
        await agent.add("Welcome "+user+"! \n How can I help you");
    }
    }
    else
    {
        await agent.add("Invalid phone number! \n Please provide the correct phone number");
    }
}

function register_user(agent)
{
    var person=agent.parameters.person;
    user_name=person.name;
    MongoClient.connect(url,{ useUnifiedTopology: true },function(err,db)
    {
        if(err) throw err;
        var dbo=db.db("chatbot");
        dbo.collection("users").insertOne({name:person.name,phno:phonenumber}, function(err,res)
        {
           if(err) throw err;
           db.close();
        });
    });
    agent.add("Thanks for registering!!\n Welcome "+user_name+"! \n How can I help you");
}

function report_issue(agent)
{
    var issue_value={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No Connectivity"}
    var intent_val=agent.parameters.number;
    var val=issue_value[intent_val];

    var trouble_ticket=randomstring.generate(7);

    MongoClient.connect(url,{ useUnifiedTopology: true },function(err,db)
    {
        if(err) throw err;

        var dbo=db.db("chatbot");

        var u_name=user_name;
        var issue_val=val;
        var status="pending";

        let ts=Date.now();
        let date_ob=new Date(ts);
        let date=date_ob.getDate();
        let month=date_ob.getMonth()+1;
        let year=date_ob.getFullYear();

        var time_date=year+"-"+month+"-"+date;

        var myobj={username:u_name,issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket};
        
        dbo.collection("user_issues").insertOne(myobj, function(err,res)
        {
           if(err) throw err;
           db.close();
        });
    
    });
    agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
}
function custom_payload(agent)
{
    var payLoadData=
    {
        "richContent": [
        [
            {
                "type": "list",
                "title": "Internet Down",
                "subtitle": "Press 1 for Internet down",
                "event":
                {
                    "name": "",
                    "languageCode": "",
                    "parameters": {}
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "list",
                "title": "Slow Internet",
                "subtitle": "Press 2 for Slow Internet",
                "event":
                {
                    "name": "",
                    "languageCode": "",
                    "parameters": {}
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "list",
                "title": "Buffering Problem",
                "subtitle": "Press 3 for Buffering Problem",
                "event":
                {
                    "name": "",
                    "languageCode": "",
                    "parameters": {}
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "list",
                "title": "No Connectivity",
                "subtitle": "Press 4 for No connectivity",
                "event":
                {
                    "name": "",
                    "languageCode": "",
                    "parameters": {}
                }
            }
        ]
    ]}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData, {sendAsMessage:true, rawPayload:true }));
}

var intentMap=new Map();
intentMap.set("service", identify_user);
intentMap.set("Invalid",identify_user);
intentMap.set("Register",register_user);
intentMap.set("service - custom - custom", report_issue);
intentMap.set("service - custom", custom_payload);
agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 30);