import { Router } from 'express';
import { createMatch, getNextQuestion, submitAnswer, getMatch, ongoingMatches, getStreak, getCompletedThemes } from '../controllers/MatchController.js'; // Asegúrate de importar getMatch
import { verifyToken } from '../middlewares/AuthMiddleware.js';
import { match } from 'node:assert';

const matchRoutes = Router();

matchRoutes.post('/create', verifyToken, createMatch);
matchRoutes.post('/:matchId/next-question', verifyToken, getNextQuestion);
matchRoutes.post('/:matchId/answer', verifyToken, submitAnswer);
matchRoutes.get('/ongoing', verifyToken, ongoingMatches);
matchRoutes.get('/getstreak/:matchId', verifyToken, getStreak);
matchRoutes.get('/getcompletedthemes/:matchId', verifyToken, getCompletedThemes);

// Nueva ruta para obtener el estado de un partido específico
matchRoutes.get('/:matchId', verifyToken, getMatch);

export default matchRoutes;
