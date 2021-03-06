require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session"); 
const passport= require("passport"); 
const passportLocalMongoose = require("passport-local-mongoose"); 
//const request = require("request"); 
const https = require('https'); 
const mongoose = require("mongoose");
const path = require('path'); 
// api key 
const API_KEY = process.env.API_KEY; 
// audience id 
const AUDIENCE_ID = process.env.AUDIENCE_ID;  

const app = express();
// use ejs 
app.set('view engine', 'ejs');

// serve static files 
app.use(express.static(__dirname + '/public'));
// initiate session 
app.use(session({
    secret:"the Secret", 
    resave: false ,
    saveUninitialized: false
})); 

// initialize passport 
app.use(passport.initialize()); 

// initialize session with passport 
app.use(passport.session()); 
// import auth middleware 
const loggedIn = require("./auth"); 

// import new models 
const {Routine, Exercise} = require('./models/Routine'); 
const User = require('./models/Users'); 
const req = require("express/lib/request");

mongoose.connect("mongodb+srv://adminSaul:test123@cluster0.pyekv.mongodb.net/ExerciseDB?retryWrites=true&w=majority" , {useNewUrlParser: true , useUnifiedTopology: true});

passport.use(User.createStrategy()); 

passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser()); 


// use body parcer 
app.use(bodyParser.urlencoded({extended:true }));
app.use(bodyParser.json()); 


app.get('/login', function(req, res){
  res.render('login'); 
});

app.post('/login', function(req, res){
  
  const user = new User({
    username: req.body.username, 
    password: req.body.password
  }); 

    req.login(user, function(err){
      if(err){
        console.log(err);
      }
      else{
        passport.authenticate('local', { failureRedirect: '/login', failureMessage: true })(req,res, function(){
          // if they end up here they successfully been authenticated 
            res.redirect('/'); 
        });
      }
    })
}); 

app.get('/register', function(req, res){
  res.render('register'); 
});

app.post('/register', function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
          console.log(err);
        }
        else{
          passport.authenticate('local')(req,res, function(){
            // if they end up here they successfully been authenticated 

              // before we redirect need to assign them a role 
              const first_name= req.body.first_name; 
              const last_name= req.body.last_name;
              const updatedUserDetails = {FirstName: first_name, LastName: last_name};
  
              // update user's data
              User.updateOne({_id: req.user._id}, updatedUserDetails , function(err){ // start updateOne()
                  if(!err){
                      console.log("user registered ! "); 
                  }
  
              });  // end updateOne()
              res.redirect('/'); 
          });
        }
    })
}); 

app.get('/logout', function(req, res){
  // end user session 
  req.logout(); 
  res.redirect('/login'); 
}); 

app.get("/", loggedIn ,function(req, res){

    const routineID = req.query.routineID; 
    const userID = req.user._id; 
    Routine.find({user_id: userID},{ RoutineName:1},{_id: 0},function(err, logNamesHere){

      if(!err){
       
        res.render('home',{  listofNames: logNamesHere, OpenEdit: routineID });
      }

    });


  
  });


app.post("/NewRoutine", loggedIn ,function(req, res){

  const pageName= req.body.newpageName;
  const userID = req.user._id; 

    const newRoutine =  {
      RoutineName: pageName, 
      user_id: userID
    }; 

  
    Routine.insertMany(newRoutine, function(err, insertedRoutine){

        if(!err){
          res.redirect('/displayRoutine/?routineID='+insertedRoutine[0]._id); 
        }
        else{ console.log(err) }
    }) // end of insertMany 
      
 
});

// moving my route on top of hte route that gets the query string aka /displayRoutine 
app.post("/createExercise", function(req, res){

  let exrName = req.body.newExr;

  let NumSet = req.body.setNum;


  let NumReps = req.body.repsNum;

  let wght = req.body.weight;

  const LongRoutineID = req.body.idBTN;
  // routineID is length of 25 => 25 bytes thats why I get typecast error bc find only reads 
  // 24 bytes _id

  // need to remove the first character 
  const ProperLengthID = LongRoutineID.substring(1);

   let weightDatastring =[];
   weightDatastring = wght.split(',');

  const NewExercise = { routine_id: ProperLengthID ,name: exrName, sets: NumSet, reps: NumReps , weight: weightDatastring };

  // insert new exercise 
  Exercise.insertMany(NewExercise, function(err, insertedExercise){
      if(!err){
        res.redirect('/displayRoutine/?routineID='+ProperLengthID);
      }
      else{
        console.log(err); 
      }
  }); 

});


app.get('/displayRoutine',loggedIn, function( req, res){
 
    const RoutineID = req.query.routineID; 
    let ExerciseID = req.query.exerciseID;
   
    Routine.find({_id: RoutineID}, function(err, foundRoutine){
      if(!err){
             // find all exercises that belong to this routine 
        Exercise.find({routine_id: foundRoutine[0]._id}, function(err,foundExercises){
            if(!err){
              res.render('routine', { routine: foundRoutine, ListOfExercises : foundExercises , open: ExerciseID });
            }
        }); // end of Exercise.find()
      }
     
    }); // end of Routine.find()

      

 
}); 

app.post('/displayRoutine', function(req, res){

  const btnRoutineID = req.body.routineIDbtn;

  res.redirect('/displayRoutine/?routineID='+btnRoutineID); 
}); 


app.post("/delete", function(req, res){


  // routine id 
  const dtRoutine = req.body.deltRotn;
  // item id 
  let SetOfIds = req.body.delete;


  if ( dtRoutine != undefined){ // if not undefined then you want to delete a routine 
    Routine.deleteOne({_id: dtRoutine}, function(err){

      if( !err){
        console.log("routine deleted successfully");
    }
    
    });
   // need to delete exercise that belong to that routine 
   Exercise.deleteMany({routine_id: dtRoutine}, function(err){
      if(!err){
        console.log("deleted all exercises that belonged to the routine as well"); 
      }
   }); 

    res.redirect("/");

  }
  else {

      //console.log(SetOfIds); 
  // Need to split to get exercise ID to delete 
  var index = SetOfIds.indexOf("$");  // Gets the first index where a '$' 
  var exerciseID = SetOfIds.substr(0, index); // Gets the first part _id
  var routineID = SetOfIds.substr(index + 1);  // Gets routine_id

    Exercise.deleteOne({_id: exerciseID}, function(err){
      
      if(!err){
        console.log("exercise deleted successfully" );
        res.redirect('/displayRoutine/?routineID='+routineID); 
      }
      else{
        console.log(err); 
      }
    }); 
    
  }
});




// create a route to update item 
app.post("/update", function(req,res){

    // exercise 
    const updateItem = req.body.needsUpdate;

    // routine 
    const newRoutineName = req.body.updateRoutineName;
    const updateRoutine = req.body.updateRoutineID;
    
    if ( updateItem != undefined){// if updateItem is not undefined then user wants to update an exercise
      
    let newName = req.body.updateName;
    let newSetNum = req.body.updateSetNum;
    let newRepNum = req.body.updateRepNum;
    let newWeight= req.body.updateWeight;

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
  Exercise.updateOne({_id: updateItem},newValues,function(err) {
 
    if(!err){
        console.log("Exercise has been updated"); 
            }
  
        });
  // once exercise is updated lets redirect 
   Exercise.find({_id: updateItem}, function(err, foundItem){
      if( !err){
        res.redirect('/displayRoutine/?routineID='+foundItem[0].routine_id); 
      }
   });

  } // end of if 

  else {
    

    // if the new name is more than 2 characters  
    if( newRoutineName.length > 2){

   
    var updatedName = {
                          $set:
                              {
                                RoutineName: newRoutineName
                              }};
    Routine.updateOne({ _id : updateRoutine}, updatedName, function(err, response) {
          
          if( !err){

            console.log("item has been updated successfully for item:" );
            
          }

      });

    }

        res.redirect("/");

  }// end of else 

});



app.post("/openMenu", function(req, res){

   const exerciseID = req.body.editBtnExr; 
  
   const routineID = req.body.editBtnRt;
  
   if ( exerciseID != undefined){
   
       Exercise.find({_id:exerciseID}, function(err, foundItem){

          if(!err){
          res.redirect('/displayRoutine/?routineID='+foundItem[0].routine_id+'&exerciseID='+exerciseID);
          }
       })
      
   }
   else {
      res.redirect("/?routineID="+routineID);
   }


});





// close the 'edit' pop up  
app.post("/close", function(require,response){


  const closeExr = require.body.closeMenuExr; 


  const closeRt = require.body.closeMenuRt; 
  
  if ( closeExr != undefined){

    response.redirect('/displayRoutine/?routineID='+closeExr);

  }

  else{
     
    response.redirect("/");

  }
  
});

// newsletter 
app.get('/signup' , function ( req, res){
  res.render('signup'); 
});

app.post('/signup' , function( req, res){
  const first_name = req.body.firstName; 
  const last_name = req.body.lastName; 
  const user_email= req.body.email; 

  // data object 
  const data ={
      members: [
          {
              email_address: user_email,
              status: "subscribed",
              merge_fields:{
                  FNAME: first_name,
                  LNAME: last_name
              }
          }
      ]
  }
  // need to convert to json 
  const JSONdata = JSON.stringify(data); 

  // url, end point to subscribe new members 
  const url = `https://us14.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}`; 

  // off the http documentation for nodeJS
  const options = {
      method: "POST",
      auth: `sreyes20:${API_KEY}`

  }
  // need to make request
 const request =  https.request(url, options, function(response){
                          if( response.statusCode === 200){
                              const title = "Subscribed!"
                              const message = "You've been successfully signed up to the newsletter, look forward to awesome content and updates!"
                              const status = 1 ; // success 
                              res.render('message', { TITLE : title , MSG : message , status:status}); 
                          }
                              else{
                              const title = "OOPS!"
                              const message = "There was a problem signing you up, please try again"
                              const status = 0 ; // failure 
                              res.render('message', { TITLE : title , MSG : message,status:status}); 
                              }
                          })
                      //})
      
        request.write(JSONdata);
        request.end(); 

}); 

// if fail try again 
app.post('/failure', function(req, res){
  res.redirect('/signup'); 
}); 
let port= process.env.PORT;
if(port==null || port==""){
    port= 5000; 
}

app.listen(port,function(){
    console.log("server started successfully");
});
 