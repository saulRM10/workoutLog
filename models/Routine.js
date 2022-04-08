
const mongoose = require("mongoose");

// import Exercise Model 
const Exercise = require('./Exercise');

const RoutineSchema = new mongoose.Schema({

    RoutineName: {
        type: String, 
        // required: [true, 'name required'],
        // minlength: [2, 'name must be at least 2 characters.'],
        // maxlength: [20, 'name must be less than 20 characters.']
    }, 
        // contains an array of  exercises, sets , reps , weight 
    Exercises: [Exercise] 

}); 

const Routine = mongoose.model("Routine", RoutineSchema); 

module.exports = Routine; 
