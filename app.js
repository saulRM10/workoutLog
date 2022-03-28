// template to creating a server in node js 
// install npm  -> npm install 
// instal express and body-parser -> npm install express body-parser
// update server when there is a change -> nodemon nameofFile.js 

const express = require("express");
const bodyParser = require("body-parser");
//const { setServers } = require("dns");

const mongoose = require("mongoose");
// import a querystring tool 
const querystring = require('querystring'); 
const app = express();

// use ejs 
app.set('view engine', 'ejs');

// use body parcer 
app.use(bodyParser.urlencoded({extended:true }));
app.use(bodyParser.json()); 

//app.use(express.static("public"));// use these static elements (css, imgs etc )
//app.use(express.static('public')); // not going to use static files atm
// need an array of items to store the to list items 

let listofExr =[];

// number of sets 
let sets = 0;


// lets use a database
// 1) install mongoose -> npm i mongoose 
// 2) require mongoose 
// 3) connect to mongo
//mongoose.connect("mongodb://localhost:27017/ExerciseDB",{useNewUrlParser: true , useUnifiedTopology: true});
mongoose.connect("mongodb+srv://adminSaul:test123@cluster0.pyekv.mongodb.net/ExerciseDB?retryWrites=true&w=majority" , {useNewUrlParser: true , useUnifiedTopology: true}); 

// 4) create a database schema 

const itemsSchema = {
  // add a routine ID so ik which list of exercises belongs to what routine 
    routine_id: String,  
    // need to validate the data 
    name: {
            type: String, 
            required: [true, 'name required'], 
            minlength: [2, 'name must be at least 2 characters.'],
            maxlength: [20, 'name must be less than 20 characters.']
          },
    sets: {
            type: String,
            required: [true, 'set number required'],
            minlength: [1, 'set must be at least 1 characters.'], 
            maxlength: [2, 'set must be at less than 2 characters.']
          },
    reps: {
            type: String,
            required: [true, 'set number required'],
            minlength: [1, 'set must be at least 1 characters.'], 
            maxlength: [2, 'set must be at less than 2 characters.']
          },
    weight: Array
  };
  // 5) cerate a mongoose model based on the schema 
const Item = mongoose.model("Item", itemsSchema);

// when a routine is created it will have zero items
const blanks = [];


  //create a place to store multiple workout log 
const logSchema ={
  WkName: {
              type: String, 
              // required: [true, 'name required'],
              // minlength: [2, 'name must be at least 2 characters.'],
              // maxlength: [20, 'name must be less than 20 characters.']
          }, 
  // contains an array of 'items' = exercises, sets , reps , weight 
  logs: [itemsSchema] 
};

// create a mongoose model based on the second schema 
const Log = mongoose.model("Log", logSchema);
 

  
  let openExerciseMenu;
  let openRoutineMenu; 

    let logNames =[];


    // create a global variable to know what routine we are on;
    let inthisRoutine = " " ; 
    //console.log(" in this routine at the very start : " + inthisRoutine);

// taken straight from when the new routine is cerated 
  const GlobalRtLocationATM = "/"; 
// current routine i want to be at, the routine id 
//const {_id : routineID } = Log.find({}); 
//var routineID; 
// a new var to keep track of the name of the routine, assuming program will now allow duplicates 
let currentRoutineName ='' ; // start at empty 

// go home and render home page 
// /goHome
app.get("/", function(require, response){

  inthisRoutine = " ";
  console.log(" in this routine at /  : " + inthisRoutine);

    Log.find({},{ WkName:1},{_id: 0},function(err, logNamesHere){

      //console.log(logNamesHere); 

      if(!err){
       
        response.render('home',{  listofNames: logNamesHere, OpenEdit: openRoutineMenu });
      }

    });


  
  });




// get user data from the form and use it redirect to /customLogName 
app.post("/newpage", function(require, response){

    inthisRoutine = ""; 
   // const pageName= require.body.newpageName;
   const pageName= require.body.newpageName;

   //GlobalRtLocationATM = pageName;

    console.log(" global  page name is : " + GlobalRtLocationATM);
    inthisRoutine = pageName; 


    console.log(" inthisRoutine = pageName =>  "+ inthisRoutine + " = " + pageName);

  
        response.redirect("/" + pageName);

   
});

app.post("/newpageTest", function(req, res){

 const pageName= req.body.newpageName;

const newRoutine =  {
  WkName: pageName, 
  logs: blanks
}; 
 // need to insert new routine into Log 
 Log.insertMany(newRoutine, function( err){
   if( !err){
     console.log("new routine created"); 
     // insert to array that gets all the names of routines created 
     logNames.push(pageName); 
   }
   // before i redirect i want to keep track what routine I need by keeping track of the routine id 
   
      // I will attempt pass in the routineID as a query in url 
    Log.find({WkName: pageName}, function( err, newRoutine){
      // get the id of the routine 
      console.log('routine id: ' + newRoutine[0]._id); 

      // redirect with updated query in url 
       var queryString =  encodeURIComponent(newRoutine[0]._id); 

        res.redirect('/displayRoutine/?routineID='+queryString); 

    }) ; 

 })

 
 //console.log(req.body.newpageName); 
});

// when a routine is created, instead of creating a new route 
// send to a route '/displayRoutine' and render and ejs file 

app.get('/displayRoutine', function( req, res){
  
  const RoutineID = req.query.routineID; 
  // trim id from white space 
  RoutineID.trim(); 
  
  //console.log(mongoose.Types.ObjectId.isValid(RoutineID));
  //console.log('id i get from query string '+  RoutineID); 
    Log.find({_id: mongoose.Types.ObjectId(RoutineID)}, function( err, foundRoutine){


     // once foundRoutine is returned then we need to find the 'logs' or all the exercises that belong to that routine 
     
     //find the exercises that match the id of the routine, and store the results in foundItems //routine_id: foundLogs._id
         Item.find({routine_id: foundRoutine[0]._id}, function(err, foundExercises){ // start of Item.find()        

          //console.log('found exercises: ' + foundExercises); 
         
          //}
                  var updateLogs = {
                              $set:
                              {
                                logs: foundExercises
                              }
           };
       //Update the  list of exercises that belong to the routine based off the routine id // Log.insertMany() start 
          Log.updateOne({ _id :foundRoutine[0]._id }, updateLogs , function(err){ // Log.updateOne() start 
                  if( err ){
                    console.log(err); 
                  }
            }); //  updateOne() end 

          res.render('routine', { routine: foundRoutine, ListOfExercises : foundExercises , RID:foundRoutine[0]._id }); 
          
    }); 


    }); 
}); 
/**
 * 
 * log.find() // need to find a specific log, given the name WkName. Which returns a cursor with the results in 'foundLogs' 
 *  
 * if foundLogs is empty = no routine with the name of WkName exist 
 *        then we must create that routine of name WkName
 *            a routine needs a name, WkName and a list of Exercises 
 *  
 *            to populate the list of exercises, we need to look at the Items collection
 *            but how do I know that the list of exercises belongs to a routine ???
 * 
 *            Assuming we know  specific collection 
 * 
 * 
 * 
 *          items are being deleted from items collection but in logs collection they still exist// not rendered but in the logs collection
 */
// create new workout log, named whatever you want
app.get("/:customLogName", function(require,response){
    
  
     customLogName = require.params.customLogName;
   
    console.log(" customLogName when created with .params = " + customLogName);

       // customLogName = inthisRoutine; 
    
  //  const customLogName = require.params.newpageName;
  

    // use this variable, to know what log we are in at all times. 
      inthisRoutine = customLogName;
     // inthisRoutine = require.body.newpageName;
      //console.log(" customLogName when set equal too inthisRoutine  = " + inthisRoutine);

      // need to check if a 'log' of the same name already exist
    if( customLogName != 'favicon.ico'){ // big if for favicon.ico 
     // Log.findOne({ WkName:customLogName}, function(err , foundLogs){
      Log.findOne({ WkName:inthisRoutine}, function(err , foundLogs){
          
     // If no documents match the specified query, the promise resolves to null
        if ( foundLogs == null){
            // need to just create it 
             //Log.insertMany([{ WkName:customLogName , logs: blanks }],function(err){
              Log.insertMany([{ WkName:inthisRoutine , logs: blanks }],function(err){
              
              //logNames.push(customLogName);
              logNames.push(inthisRoutine);
              
             }); 
    
     
           // response.redirect("/"+ customLogName);
           response.redirect("/"+ inthisRoutine);
            // need to give it items, 
         } 

        // Document match the specified query, the promise is NOT null 
        if( foundLogs != null ) {

            // find the exercises that match the id of the routine, and store the results in foundItems //routine_id: foundLogs._id
            Item.find({routine_id: foundLogs._id}, function(err, foundItems){ // start of Item.find()

                  
                      var updateLogs = {
                                          $set:
                                          {
                                            logs: foundItems
                                          }
                      };
                    //Log.updateOne({ WkName:customLogName }, updateLogs , function(err){ // Log.insertMany() start 
                    Log.updateOne({ WkName:inthisRoutine }, updateLogs , function(err){ // Log.insertMany() start 

                      }); // Log.insertMany() end 

                 response.render('index', { routineName: foundLogs.WkName , workout: foundItems, OpenEdit: openExerciseMenu , routineID: foundLogs._id });
            });// end of Item.find()
        }
        
      })
          }// end of 'if' for favicon.ico

      
});

// old version 
app.post("/createItem", function(req, res){

    let exrName = req.body.newExr;

    let NumSet = req.body.setNum;
  

    let NumReps = req.body.repsNum;

    let wght = req.body.weight;

    // create an array of weight to store the weight 
     let weightDatastring =[];
     weightDatastring = wght.split(',');

     //var index = scrambleIdRole.indexOf("$");  // Gets the first index where a '$' 
     //var userID = scrambleIdRole.substr(0, index); // Gets the first part _id
     //var ROLE = scrambleIdRole.substr(index + 1);  // Gets role 
 
    const routineID = req.body.idBTN;
   
   
    // get number of sets and then give them the input space so we can collect the data to then display
        // create the 'object'
    const myobj = { routine_id: routineID ,name: exrName, sets: NumSet, reps: NumReps , weight: weightDatastring };


 // find where this 'exercise' == myobj belongs and inset it 
  
//Need to see what routine this myObj belongs too 
 Log.find({_id: routineID}, function(err, foundRoutine){

  if(!err){
        // now need to insert to the logs field
    foundRoutine.logs.push(myobj); 

    // need to inset into item collections as well 
    Item.insertMany(myobj);

    var queryString =  encodeURIComponent(foundRoutine[0]._id); 

     res.redirect('/displayRoutine/?routineID='+foundRoutine[0]._id);
  }
  else{ console.log(err); }

  });
// //try{
//     // insert to items collections as well 
//       Item.insertMany(myobj); 
    
//     // tap in to found logs, tap in to items, push myobj into array of items (items = exercise + sets + reps + weight ) 
//       foundLogs.logs.push(myobj);

//       foundLogs.save();
//       var queryString =  encodeURIComponent(routineID); 

//       res.redirect('/displayRoutine/?routineID='+queryString); 
// //}
// //catch(err) { console.log( " this is the error: " + err ); }
//       // render the new item in the routine it belongs too  

//   });
});
  





app.post("/delete", function(require, response){


  // routine id 
  const dtRoutine = require.body.deltRotn;
  // item id 
  const noMore = require.body.skip;

  if ( dtRoutine != undefined){ // if not undefined then you want to delete a routine 
    Log.deleteOne({_id: dtRoutine}, function(err){

      if( !err){
        console.log("routine deleted successfully");
    }
    // deleted the item, not go back to root and render what we do have left
    response.redirect("/");
    });

  }
  else {
    // delete item 
    Item.deleteOne({_id:noMore}, function(err){

        
      if(!err){
        console.log("exercise deleted successfully" );
      }

      response.redirect("/" + inthisRoutine);

    });
  }
});




// create a route to update item 
app.post("/update", function(require,response){

    // exercise 
    const updateItem = require.body.needsUpdate;
    
    
    // routine 
    const newRoutineName = require.body.updateRoutineName;
    const updateRoutine = require.body.updateRoutineID;
    
    if ( updateItem != undefined){// if updateItem is not undefined then user wants to update an exercise
      
    let newName = require.body.updateName;
    let newSetNum = require.body.updateSetNum;
    let newRepNum = require.body.updateRepNum;
    let newWeight= require.body.updateWeight;

    let NewWeightDatastring =[];
    NewWeightDatastring = newWeight.split(',');

      var newValues = { 
        $set: 
          {
            name: newName, 
            sets: newSetNum, 
            reps: newRepNum, 
            weight: NewWeightDatastring  }
           };
      //let userInput = response.body.newItemData; 

      // updated the item, not go back to root and render what we do have left
  Item.updateOne( {_id: updateItem},newValues,function(err, response) {

    if(!err){
             console.log("item updated in LOG: " + inthisRoutine );
            }
       
        });

        
    response.redirect("/" + inthisRoutine );

  } // end of if 

  else {
    

    // if the new name is more than 2 characters  
    if( newRoutineName.length > 2){

   
    var updatedName = {
                          $set:
                              {
                                WkName: newRoutineName
                              }};
    Log.updateOne({ _id : updateRoutine}, updatedName, function(err, response) {
          
          if( !err){

            console.log("item has been updated successfully for item:" );
            
          }

      });

    }
    // name is not long enough , close menu
    else { 

      openRoutineMenu = null;
    }

response.redirect("/");

  }// end of else 

    inthisRoutine = " ";
});



app.post("/openMenu", function(require, response){

  
  // open exercise edit menu
   openExerciseMenu = require.body.editBtnExr;

   

   

   // open routine edit menu 
   openRoutineMenu = require.body.editBtnRt; 

   console.log(" i am in  : " + inthisRoutine);
   if ( openExerciseMenu != undefined){
    
       response.redirect("/" + inthisRoutine);
   }
   else {
    response.redirect("/");
   }


});





// close the 'edit' pop up  
app.post("/close", function(require,response){


  const closeExr = require.body.closeMenuExr; 

  const closeRt = require.body.closeMenuRt; 
  
  if ( closeExr != undefined){

    openExerciseMenu = null; 
    response.redirect("/" + inthisRoutine);

  }

  else{
    
    openRoutineMenu = null ; 
    response.redirect("/");

  }
  
});



app.listen(5000,function(){
    console.log("connected to port 5000");
});
 