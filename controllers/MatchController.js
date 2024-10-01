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

export const getNextQuestion = async (req, res) => {
  const { matchId } = req.params;
  const { selectedTheme } = req.body;

  try {
    const match = await Match.findById(matchId).populate('currentTurn');
    
    if (!match) {
      console.log('Match not found');
      return res.status(404).send('Match not found');
    }

    // Determinar si el jugador actual es player1 o player2
    const currentPlayerKey = match.players.player1.toString() === req.userId ? 'player1' : 'player2';
    console.log(`Current player key: ${currentPlayerKey}`);
    console.log(`Current correctAnswersStreak for ${currentPlayerKey}: ${match.correctAnswersStreak[currentPlayerKey]}`);

    // Comprobar si la racha es 3 para determinar si la siguiente pregunta es decisiva
    if (match.correctAnswersStreak[currentPlayerKey] == 3) {
      console.log(`Decisive question triggered for ${currentPlayerKey} with theme: ${selectedTheme}`);

      const decisiveQuestion = await Question.aggregate([
        { $match: { category: selectedTheme } },
        { $sample: { size: 1 } }
      ]);

      match.theme = selectedTheme;
      await match.save();

      console.log(`Decisive question selected: ${decisiveQuestion[0]._id}`);
      return res.status(200).json({ decisive: true, question: decisiveQuestion[0] });
    }

    // Si no es una pregunta decisiva, seleccionar una pregunta regular
    match.theme = selectedTheme;
    const question = await Question.aggregate([
      { $match: { category: selectedTheme } },
      { $sample: { size: 1 } }
    ]);

    console.log(`Regular question selected for ${currentPlayerKey}: ${question[0]._id}`);
    
    await match.save();
    res.status(200).json({ question: question[0] });
    
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

      console.log(`Player ${playerId} answered question ${questionId}: isCorrect=${isCorrect}, isDecisive=${isDecisive}`);

      match.questionsAnswered.push({
          player: playerId,
          question: questionId,
          correct: isCorrect,
      });

      // Log the current state of correctAnswersStreak before any updates
      console.log(`Before update: ${currentPlayerKey} streak: ${match.correctAnswersStreak[currentPlayerKey]}`);

      if (isCorrect) {
          if (isDecisive) {
              const { theme } = match;
              match.completedThemes[currentPlayerKey].push(theme);
              if (match.completedThemes[currentPlayerKey].length === 6) {
                  match.status = 'completed';
                  match.winner = playerId;
              }
              await User.updateMany({ _id: { $in: Object.values(match.players) } }, { $push: { matchHistory: match._id } });
              match.correctAnswersStreak[currentPlayerKey] = 0;
          } else {
              match.correctAnswersStreak[currentPlayerKey] += 1;
          }
      } else {
          if (isDecisive) {
              match.correctAnswersStreak[currentPlayerKey] = 0;
          }
          match.currentTurn = match.players[otherPlayerKey]; // Cambia el turno al otro jugador
      }

      // Log the updated streak after processing the answer
      console.log(`After update: ${currentPlayerKey} streak: ${match.correctAnswersStreak[currentPlayerKey]}`);

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

export const getPlayer = async (req, res) => {
  try {
      const player = await User.findById(req.userId);
      if (!player) return res.status(404).send('Player not found');
      res.status(200).json(player);
  } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching player details");
  }
};
