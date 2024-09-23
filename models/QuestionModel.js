import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  theme: { 
    type: String, 
    required: true 
    },
  questionText: { 
    type: String, 
    required: true 
    },
  options: [{ 
    text: String, 
    isCorrect: Boolean 
    }],
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
