
const mongoose = require("mongoose");
// Schema for Exercises will be with routine in order to nest them
const ExerciseSchema = new mongoose.Schema({

    routine_id: mongoose.ObjectId,
    
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

},
    {timestamps: true }

); 

const Exercise = mongoose.model("Exercise", ExerciseSchema); 

// Routine schema. parent schema 
const RoutineSchema = new mongoose.Schema({

    RoutineName: {
        type: String, 
        // required: [true, 'name required'],
        // minlength: [2, 'name must be at least 2 characters.'],
        // maxlength: [20, 'name must be less than 20 characters.']
    }, 

    user_id: mongoose.ObjectId,
        

},

{timestamps: true }

);  

const Routine = mongoose.model("Routine", RoutineSchema); 

module.exports = {
    Routine, 
    Exercise
} 
