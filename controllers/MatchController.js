import Match from '../models/MatchModel.js';
import Question from '../models/QuestionModel.js';
import Theme from '../models/ThemeModel.js';

export const createMatch = async (req, res) => {
  const { player1Id, player2Id } = req.body;

  try {
      // Verificar que ambos jugadores existan
      const player1 = await User.findById(player1Id);
      const player2 = await User.findById(player2Id);

      if (!player1 || !player2) {
          return res.status(404).send('One or both players not found');
      }

      // Crear un nuevo objeto de Match
      const newMatch = new Match({
          players: [player1Id, player2Id],
          currentTurn: player1Id, // El primer jugador empieza
          correctAnswersStreak: {
              player1: 0,
              player2: 0
          },
          completedThemes: {
              player1: [],
              player2: []
          },
          questionsAnswered: [],
          theme: null,
          status: 'active'
      });

      // Guardar la nueva partida en la base de datos
      await newMatch.save();

      return res.status(201).json({
          matchId: newMatch._id,
          players: newMatch.players,
          currentTurn: newMatch.currentTurn
      });

  } catch (error) {
      console.error(error);
      return res.status(500).send("Error creating match");
  }
};

const getRandomTheme = async () => {
    const themes = await Theme.find(); // Consultar la base de datos para obtener los temas
    const themeNames = themes.map(theme => theme.name); // Obtener solo los nombres de los temas
    return themeNames[Math.floor(Math.random() * themeNames.length)];
};

export const getNextQuestion = async (req, res) => {
  const { matchId } = req.params;
  try {
    const match = await Match.findById(matchId).populate('currentTurn');
    if (!match) return res.status(404).send('Match not found');

    // Determinar qué jugador es (player1 o player2)
    const currentPlayerKey = match.players[0].toString() === req.userId ? 'player1' : 'player2';

    // Verificar si el jugador tiene 3 respuestas correctas consecutivas para lanzar la pregunta decisiva
    if (match.correctAnswersStreak[currentPlayerKey] === 3) {
      // El jugador selecciona un tema para su pregunta decisiva
      const { selectedTheme } = req.body; // Este campo vendría del frontend
      const decisiveQuestion = await Question.aggregate([
        { $match: { theme: selectedTheme } },
        { $sample: { size: 1 } }
      ]);
      match.theme = selectedTheme; // Guardamos el tema de la pregunta decisiva
      await match.save();

      return res.status(200).json({ decisive: true, question: decisiveQuestion[0] });
    } 

    // Si no es una pregunta decisiva, girar la ruleta normalmente
    const randomTheme = getRandomTheme();
    match.theme = randomTheme;

    // Si la ruleta cayó en "corona", se salta a la pregunta decisiva
    if (randomTheme === 'corona') {
      return res.status(200).json({ corona: true, nextDecisive: true });
    }

    // Obtener una pregunta normal de un tema aleatorio
    const question = await Question.aggregate([
      { $match: { theme: randomTheme } },
      { $sample: { size: 1 } }
    ]);

    await match.save();
    res.status(200).json({ question: question[0] });
    
  } catch (error) {
    res.status(500).send("Error fetching next question");
  }
};

export const submitAnswer = async (req, res) => {
    const { matchId, questionId, isCorrect, isDecisive } = req.body; // `isDecisive` indica si es una pregunta decisiva
    const playerId = req.userId;

    try {
        const match = await Match.findById(matchId);
        if (!match) return res.status(404).send('Match not found');

        const currentPlayerKey = match.players[0].toString() === playerId ? 'player1' : 'player2';
        const otherPlayerKey = currentPlayerKey === 'player1' ? 'player2' : 'player1';

        // Registrar la respuesta
        match.questionsAnswered.push({
        player: playerId,
        question: questionId,
        correct: isCorrect,
        });

        if (isCorrect) {
        if (isDecisive) {
            // Si es una pregunta decisiva
            const { theme } = match;  // Se obtiene el tema de la pregunta decisiva
            match.completedThemes[currentPlayerKey].push(theme); // Añadir el tema completado al jugador

            // Verificar si el jugador ha completado todos los temas
            if (match.completedThemes[currentPlayerKey].length === themes.length) {
            match.status = 'completed';
            match.winner = playerId;
            }
            
            if (match.status === 'completed') {
              // Agregar la partida al historial de ambos jugadores
              await User.findByIdAndUpdate(match.players[0], { $push: { matchHistory: match._id } });
              await User.findByIdAndUpdate(match.players[1], { $push: { matchHistory: match._id } });
            }

            // Reiniciar el conteo de respuestas correctas consecutivas después de una pregunta decisiva
            match.correctAnswersStreak[currentPlayerKey] = 0;
        } else {
            // Si es una pregunta normal, incrementar el contador
            match.correctAnswersStreak[currentPlayerKey] += 1;

            // Si ha respondido 3 preguntas correctas, puede optar por una pregunta decisiva en su siguiente turno
            if (match.correctAnswersStreak[currentPlayerKey] === 3) {
            // Aquí podrías notificar que está listo para una pregunta decisiva
            }
        }
        } else {
        if (isDecisive) {
            // Si falla una pregunta decisiva, se reinicia el conteo de correctas
            match.correctAnswersStreak[currentPlayerKey] = 0;
        }
        
        // Si la respuesta es incorrecta, se pierde el turno
        match.currentTurn = match.players.find(p => p.toString() !== playerId);
        }

        await match.save();
        res.status(200).json({ match });

    } catch (error) {
        res.status(500).send("Error submitting answer");
    }
};