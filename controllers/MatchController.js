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
      players: [req.userId, player2Id],
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
      .populate('players') 
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
  const { selectedTheme } = req.body; // Recibir el tema del cuerpo de la solicitud

  try {
    const match = await Match.findById(matchId).populate('currentTurn');
    
    if (!match) {
      return res.status(404).send('Match not found');
    }

    const currentPlayerKey = match.players[0].toString() === req.userId ? 'player1' : 'player2';
    
    // Comprobación para ver si el jugador actual ha respondido 3 preguntas correctamente
    if (match.correctAnswersStreak[currentPlayerKey] === 3) {
      // Obtener una pregunta decisiva para el tema seleccionado
      const decisiveQuestion = await Question.aggregate([
        { $match: { theme: selectedTheme } }, // Usar el tema enviado
        { $sample: { size: 1 } }
      ]);

      match.theme = selectedTheme; // Guardar el tema seleccionado en el match
      await match.save();

      return res.status(200).json({ decisive: true, question: decisiveQuestion[0] });
    }

    // Si el jugador no ha llegado a 3 respuestas correctas, usar el tema enviado en lugar de un tema aleatorio
    match.theme = selectedTheme; // Guardar el tema seleccionado en el match

    // Si el tema es 'corona', se maneja de manera especial
    if (selectedTheme === 'corona') {
      return res.status(200).json({ corona: true, nextDecisive: true });
    }

    const question = await Question.aggregate([
      { $match: { category: selectedTheme } }, // Obtener una pregunta basada en el tema seleccionado
      { $sample: { size: 1 } }
    ]);
    
    await match.save();

    res.status(200).json({ question: question[0] });
    
  } catch (error) {
    res.status(500).send("Error fetching next question");
  }
};


export const submitAnswer = async (req, res) => {
    const { matchId, questionId, isCorrect, isDecisive } = req.body;
    const playerId = req.userId;

    try {
        const match = await Match.findById(matchId);
        if (!match) return res.status(404).send('Match not found');

        const currentPlayerKey = match.players[0].toString() === playerId ? 'player1' : 'player2';
        const otherPlayerKey = currentPlayerKey === 'player1' ? 'player2' : 'player1';

        match.questionsAnswered.push({
            player: playerId,
            question: questionId,
            correct: isCorrect,
        });

        if (isCorrect) {
            if (isDecisive) {
                const { theme } = match;
                match.completedThemes[currentPlayerKey].push(theme);
                if (match.completedThemes[currentPlayerKey].length === themes.length) {
                    match.status = 'completed';
                    match.winner = playerId;
                }
                await User.updateMany({ _id: { $in: match.players } }, { $push: { matchHistory: match._id } });
                match.correctAnswersStreak[currentPlayerKey] = 0;
            } else {
                match.correctAnswersStreak[currentPlayerKey] += 1;
            }
        } else {
            if (isDecisive) {
                match.correctAnswersStreak[currentPlayerKey] = 0;
            }
            match.currentTurn = match.players.find(p => p.toString() !== playerId);
        }

        await match.save();
        res.status(200).json({ match });

    } catch (error) {
        console.error(error);
        res.status(500).send("Error submitting answer");
    }
};
