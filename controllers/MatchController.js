import Match from '../models/MatchModel.js';
import User from '../models/UserModel.js';
import Question from '../models/QuestionModel.js';
import Theme from '../models/ThemeModel.js';

export const createMatch = async (req, res) => {
  const { player2Id } = req.body;

  try {
    const player1 = await User.findById(req.userId);
    const player2 = await User.findById(player2Id);

    if (!player1 || !player2) {
      return res.status(404).send('One or both players not found');
    }

    const newMatch = new Match({
      players: {
        player1: req.userId,
        player2: player2Id,
      },
      currentTurn: req.userId,
      correctAnswersStreak: {
        player1: 0,
        player2: 0,
      },
      completedThemes: {
        player1: [],
        player2: [],
      },
      questionsAnswered: [],
      theme: null,
      status: 'in-progress',
    });

    await newMatch.save();

    return res.status(201).json({
      matchId: newMatch._id,
      players: newMatch.players,
      currentTurn: newMatch.currentTurn,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send("Error creating match");
  }
};

export const getMatch = async (req, res) => {
  const { matchId } = req.params;
  
  try {
    const match = await Match.findById(matchId)
    .populate('players.player1') // Popula player1
    .populate('players.player2') // Popula player2
    .populate('questionsAnswered.question');

    if (!match) {
      return res.status(404).send('Match not found');
    }

    res.status(200).json(match);
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching match details");
  }
};

export const getStreak = async (req, res) => {
  const { matchId } = req.params;

  try {
    const match = await Match.findById(matchId);
    
    if (!match) {
      console.log('Match not found');
      return res.status(404).send('Match not found');
    }

    const currentPlayerKey = match.players.player1.toString() === req.userId ? 'player1' : 'player2';

    // Verificar si la próxima pregunta es decisiva basándose en la racha actual
    const nextDecisive = match.correctAnswersStreak[currentPlayerKey] === 3; // Si la racha es 2, la siguiente es decisiva

    res.status(200).json({ nextDecisive });

  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).send("Error fetching streak");
  }
};

export const getNextQuestion = async (req, res) => {
  const { matchId } = req.params;
  const { selectedTheme } = req.body;  // selectedTheme se pasa en el body

  try {
    const match = await Match.findById(matchId);
    
    if (!match) {
      console.log('Match not found');
      return res.status(404).send('Match not found');
    }

    const currentPlayerKey = match.players.player1.toString() === req.userId ? 'player1' : 'player2';

    // Pregunta regular
    const question = await Question.aggregate([
      { $match: { category: selectedTheme } }, // Usar la categoría seleccionada
      { $sample: { size: 1 } }
    ]);

    // Verificar si la siguiente pregunta será decisiva
    const nextDecisive = match.correctAnswersStreak[currentPlayerKey] === 3; // Si la racha actual es 2, la próxima es decisiva

    match.theme = selectedTheme; // Guardar el tema seleccionado
    await match.save();

    // Enviar la pregunta junto con nextDecisive
    res.status(200).json({ question: question[0], nextDecisive });

  } catch (error) {
    console.error('Error fetching next question:', error);
    res.status(500).send("Error fetching next question");
  }
};


export const submitAnswer = async (req, res) => {
  const { matchId, questionId, isCorrect, isDecisive } = req.body;
  const playerId = req.userId;

  try {
      const match = await Match.findById(matchId);
      if (!match) return res.status(404).send('Match not found');

      const currentPlayerKey = match.players.player1.toString() === playerId ? 'player1' : 'player2';
      const otherPlayerKey = currentPlayerKey === 'player1' ? 'player2' : 'player1';

      match.questionsAnswered.push({
          player: playerId,
          question: questionId,
          correct: isCorrect,
      });

      if (isCorrect) {
          if (isDecisive) {
              const { theme } = match; // Tema decisivo seleccionado
              match.completedThemes[currentPlayerKey].push(theme);

              if (match.completedThemes[currentPlayerKey].length === 6) {
                  match.status = 'completed';
                  match.winner = playerId;
              }
              await User.updateMany({ _id: { $in: Object.values(match.players) } }, { $push: { matchHistory: match._id } });
              match.correctAnswersStreak[currentPlayerKey] = 0; // Reiniciar la racha después de la pregunta decisiva
          } else {
              match.correctAnswersStreak[currentPlayerKey] += 1; // Incrementar la racha en preguntas normales
          }
      } else {
          match.correctAnswersStreak[currentPlayerKey] = 0; // Reiniciar la racha si la respuesta es incorrecta
          match.currentTurn = match.players[otherPlayerKey]; // Cambiar el turno al otro jugador
      }

      await match.save();
      res.status(200).json({ match });

  } catch (error) {
      console.error(error);
      res.status(500).send("Error submitting answer");
  }
};


export const ongoingMatches = async (req, res) => {
  try {
      console.log('Fetching ongoing matches for user:', req.userId);
      const matches = await Match.find({
          $or: [
              { 'players.player1': req.userId },
              { 'players.player2': req.userId }
          ],
          status: 'in-progress',
      }).populate('players.player1 players.player2');

      console.log('Found ongoing matches:', matches);
      res.status(200).json(matches);
  } catch (error) {
      console.error('Error fetching ongoing matches:', error);
      res.status(500).send("Error fetching ongoing matches");
  }
};
