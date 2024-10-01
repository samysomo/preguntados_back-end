import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  players: { 
    player1: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    player2: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  },
  currentTurn: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users' 
  },
  theme: { 
    type: String 
  },
  questionsAnswered: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    correct: { type: Boolean, required: true },
  }],
  correctAnswersStreak: { // Contador de respuestas correctas consecutivas por jugador
    player1: { type: Number, default: 0 },
    player2: { type: Number, default: 0 }
  },
  completedThemes: { // Temas completados por jugador
    player1: [{ type: String }],
    player2: [{ type: String }]
  },
  status: { 
    type: String, 
    enum: ['in-progress', 'completed'], 
    default: 'in-progress' 
  },
  winner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users', 
    required: false 
  }
});

const Match = mongoose.model('Match', matchSchema);
export default Match;
