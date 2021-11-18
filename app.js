// template to creating a server in node js 
// install npm  -> npm install 
// instal express and body-parser -> npm install express body-parser
// update server when there is a change -> nodemon nameofFile.js 

const express = require("express");
const bodyParcer = require("body-parser");
const { setServers } = require("dns");

const mongoose = require("mongoose");
const { redirect } = require("statuses");
const { all, timeout } = require("async");

const app = express();

// use ejs 
app.set('view engine', 'ejs');

// use body parcer 
app.use(bodyParcer.urlencoded({extended:true }));

//app.use(express.static("public"));// use these static elements (css, imgs etc )
// need an array of items to store the to list items 

let listofExr =[];

// number of sets 
let sets = 0;


// lets use a database
// 1) install mongoose -> npm i mongoose 
// 2) require mongoose 
// 3) connect to mongo
mongoose.connect("mongodb://localhost:27017/ExerciseDB",{useNewUrlParser: true , useUnifiedTopology: true});

// 4) create a database schema 

const itemsSchema = {
    name: String,
    sets: String,
    reps: String,
    weight: Array
  };
  // 5) cerate a mongoose model based on the schema 
const Item = mongoose.model("Item", itemsSchema);


const defaultItems =[];
  // 6) create new 'documents' == default items

const item1 = new Item({
    name: "bench",
    sets: "4",
    reps:"8",
    weight: [135,185,205,225]
  });
  
  

   defaultItems.push(item1);

  //create a place to store multiple workout log 
const logSchema ={
  WkName: String,
  // contains an array of 'items' = exercises, sets , reps , weight 
  logs: [itemsSchema] 
};

// create a mongoose model based on the second schema 
const Log = mongoose.model("Log", logSchema);
 

  let openMenue = 0;
  let openValueId; 

    let logNames =[];

    let newItems = [];

    // create a global variable to know what routine we are on;
    let inthisRoutine = 'home' ; 
// go home and render home page 
// /goHome
app.get("/", function(require, response){

    Log.find({},{ WkName:1},{_id: 0},function(err, logNamesHere){

      if(!err){
       
        response.render('home',{  listofNames: logNamesHere});
      }

    });


  
  });


app.get("/timeout", function(require, response){

  

    Item.find({}, function(err, foundItems){

        if( foundItems.length === 0 ){
            Item.insertMany(defaultItems,function(err){

                if( err){
                  console.log(err);
                }else {
                  console.log(" inserted default items into database");
                }
            } );
            // we need to render items just created 
        response.redirect("/" + inthisRoutine);
        } 
        
       // else{
         //   response.render('index', { routineName: "logA" , workout: foundItems, OpenEditId: openValueId });

        //}

    })
    
 
    
});

// get user data from the form and use it redirect to /customLogName 
app.post("/newpage", function(require,response){

    const pageName= require.body.newpageName;
    //inthisRoutine= pageName;

    response.redirect("/"+ pageName);
});

// create new workout log, named whatever you want
app.get("/:customLogName", function(require,response){
    
    const customLogName = require.params.customLogName;

    // use this variable, to know what log we are in at all times. 
      inthisRoutine = customLogName;
      // need to check if a 'log' of the same name already exist 
      Log.findOne({ WkName:customLogName}, function(err , foundLogs){

          if(!err){
            // if log  under the customLogName does not exist if foundLogs, create one 
              if( !foundLogs ){
               
                Log.insertMany([{ WkName:customLogName , logs: defaultItems}],function(err){

                  logNames.push(customLogName);

                  if( err){
                    console.log(err);
                  }else {
                    console.log(" inserted default items into database");
                  }
                  
              } );

              // need to render/check for deleted items => exName, sets , reps, weight 
             
              // we need to render items just created 
          response.redirect("/"+ customLogName);
              }
              else{
                // display the existing log, that can be found in foundLogs
                response.render('index', { routineName: foundLogs.WkName , workout: foundLogs.logs, OpenEditId: openValueId  });
              }
          }
      })
});


app.post("/createItem", function(require, response){

    let exrName = require.body.newExr;

    let NumSet = require.body.setNum;
  

    let NumReps = require.body.repsNum;

    let wght = require.body.weight;

    // create an array of weight to store the weight 
     let weightDatastring =[];
     weightDatastring = wght.split(',');

   
    const whatRoutine = require.body.button;

    // get number of sets and then give them the input space so we can collect the data to then display
        // create the 'object'
   const myobj = { name: exrName, sets: NumSet, reps: NumReps , weight: weightDatastring };

 

//    if( whatRoutine === "logA"){
//     Item.insertMany(myobj, function(err, response) {
//       if (err) {
//           console.log("you did not add the item");
//       }
//       else { 
//           console.log("item inserted");
//       }
//   });

//   response.redirect("/");

    
// }
// else{

//Need to see what routine this myObj belongs too 
  Log.findOne({WkName: whatRoutine}, function(err, foundLogs){

    
    // tap in to found logs, tap in to items, push myobj into array of items (items = exercise + sets + reps + weight ) 
    foundLogs.logs.push(myobj);

      foundLogs.save();
      // render the new item in the routine it belongs too 
      response.redirect("/" + whatRoutine);
  });
});
  

// this is how to update an item from a different log 
// const myQ = { WkName : whatRoutine};
// //{ $set: {name: newName, sets: newSetNum, reps: newRepNum, weight: NewWeightDatastring  } };
// const upMyobj = {$set:{logs: myobj}};
// Log.updateOne(myQ, upMyobj, function(err, response) {
//   if( !err){

//       console.log("item has been updated successfully for item:" );
      
//   }

// });

// response.redirect("/"+ whatRoutine);
// ^ update code 


//}



app.post("/deleteLog", function(require, response){

  const dtLog = require.body.dl;
    console.log("this is the element you want to delete : "+ dtLog );

    Log.deleteOne({_id: dtLog}, function(err){

      if( !err){
        console.log("log has been deleted successfully");
    }
    // deleted the item, not go back to root and render what we do have left
    response.redirect("/");
    });
});


/// used to delete items of the list
app.post("/delete", function(require, response ){

    const noMore = require.body.skip;


    Item.deleteOne({_id: noMore}, function(err){
        if( !err){
            console.log("item has been deleted successfully: " + noMore);
        }
        // deleted the item, not go back to root and render what we do have left
        response.redirect("/"+ inthisRoutine);
    });    
});

// create a route to update item 
app.post("/update", function(require,response){

    
    const updateItem = require.body.needsUpdate;
    
    let newName = require.body.updateName;
    let newSetNum = require.body.updateSetNum;
    let newRepNum = require.body.updateRepNum;
    let newWeight= require.body.updateWeight;

    let NewWeightDatastring =[];
    NewWeightDatastring = newWeight.split(',');

  

     var myquery = { WkName: inthisRoutine ,  _id: updateItem };
      var newValues = { $set: {name: newName, sets: newSetNum, reps: newRepNum, weight: NewWeightDatastring  } };
      //let userInput = response.body.newItemData; 

      // updated the item, not go back to root and render what we do have left
  Log.updateOne( myquery,newValues,function(err, response) {

    if(!err){
              console.log("item updated in LOG: " + inthisRoutine + " is now : " + newName );
            }
           // response.redirect("/" + inthisRoutine );

           // updated the item now push it ?
          
        });

        
    response.redirect("/" + inthisRoutine );

  

    
});


// gets 
app.post("/openId", function(require, response){

  // i am on this item, item I want to edit ( name, reps, sets, weight)
   openValueId = require.body.editBtn;
    
 
  console.log("this is the name of the item clicked on: " + openValueId);

 // here is the edit 
    response.redirect("/" + inthisRoutine);


});

// close the 'edit' pop up  
app.post("/close", function(require,response){

  openValueId = null; 
  // go to the specific page you are doing the edit;
  response.redirect("/" + inthisRoutine);
  
});

app.listen(5000,function(){
    console.log("connected to port 5000");
});
 