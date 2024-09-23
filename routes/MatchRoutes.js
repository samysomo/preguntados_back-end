import { Router } from 'express';
import { createMatch, getNextQuestion, submitAnswer } from '../controllers/MatchController.js';
import { verifyToken } from '../middlewares/AuthMiddleware.js';

const matchRoutes = Router();

matchRoutes.post('/create', verifyToken, createMatch);
matchRoutes.get('/:matchId/next-question', verifyToken, getNextQuestion);
matchRoutes.post('/:matchId/answer', verifyToken, submitAnswer);

export default matchRoutes;
