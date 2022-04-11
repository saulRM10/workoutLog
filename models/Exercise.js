
const mongoose = require("mongoose");

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

}); 

const Exercise = mongoose.model("Exercise", ExerciseSchema); 

//module.exports = Exercise; 