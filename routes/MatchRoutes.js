import { Router } from 'express';
import { createMatch, getNextQuestion, submitAnswer, getMatch } from '../controllers/MatchController.js'; // Asegúrate de importar getMatch
import { verifyToken } from '../middlewares/AuthMiddleware.js';

const matchRoutes = Router();

matchRoutes.post('/create', verifyToken, createMatch);
matchRoutes.post('/:matchId/next-question', verifyToken, getNextQuestion);
matchRoutes.post('/:matchId/answer', verifyToken, submitAnswer);

// Nueva ruta para obtener el estado de un partido específico
matchRoutes.get('/:matchId', verifyToken, getMatch);

export default matchRoutes;
