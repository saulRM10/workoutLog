// template to creating a server in node js 
// install npm  -> npm install 
// instal express and body-parser -> npm install express body-parser
// update server when there is a change -> nodemon nameofFile.js 

const express = require("express");
const bodyParcer = require("body-parser");
const { setServers } = require("dns");

const mongoose = require("mongoose");
const { redirect } = require("statuses");

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
    weight: String
  };
  // 5) cerate a mongoose model based on the schema 
const Item = mongoose.model("Item", itemsSchema);


  // 6) create new 'documents' == default items

const item1 = new Item({
    name: "bench",
    sets: "4",
    reps:"8",
    weight: "225"
  });
  
  const item2 = new Item({
    name: "squat",
    sets: "3",
    reps:"12",
    weight: "315"
  });
  
  const item3 = new Item({
    name: "overhead press ",
    sets: "3",
    reps:"8",
    weight: "135"

  });

  const defaultItems = [ item1, item2, item3];

  let openMenue = 0;

app.get("/", function(require, response){

    let msg = "workout log";

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
        response.redirect("/");
        } 
        
        else{
            response.render('index', { grindMSG: msg , workout: foundItems, open: openMenue });

        }

    })
    
 
    
});


app.post("/", function(require, response){

    let exrName = require.body.newExr;

    let NumSet = require.body.setNum;

    let NumReps = require.body.repsNum;

    let wght = require.body.weight;


   let myobj = { name: exrName, sets: NumSet, reps: NumReps , weight: wght };
    
    Item.insertMany(myobj, function(err, response) {
        if (err) {
            console.log("you did not add the item");
        }
        else { 
            console.log("item inserted");
        }
    });
    response.redirect("/");
    

});


/// used to delete items of the list
app.post("/delete", function(require, response ){

    const noMore = require.body.skip;

    openMenue = require.body.editBtn;

    Item.deleteOne({_id: noMore}, function(err){
        if( !err){
            console.log("item has been deleted successfully");
        }
        // deleted the item, not go back to root and render what we do have left
        response.redirect("/");
    });    
});

// create a route to update item 
app.post("/update", function(require,response){

    // store 'weight:' of the item we want to update 
    const updateItem = require.body.needsUpdate;
    

      var myquery = {  _id: updateItem };
      var newValues = { $set: {weight: "780" } };
      //let userInput = response.body.newItemData; 

       Item.updateOne(myquery, newValues, function(err, response) {
        if( !err){

            console.log("item has been updated successfully for item:" + updateItem );
            
        }
        
       
        
      });
      // updated the item, not go back to root and render what we do have left
    response.redirect("/");
});

app.listen(5000,function(){
    console.log("connected to port 5000");
});
