import { Router } from 'express';
import { addFriend, getMatchHistory } from '../controllers/UserController.js';
import { verifyToken } from '../middlewares/AuthMiddleware.js';

const userRoutes = Router();

// Ruta para agregar amigos
userRoutes.post('/add-friend', verifyToken, addFriend);

// Ruta para consultar el historial de partidas
userRoutes.get('/match-history', verifyToken, getMatchHistory);

export default userRoutes;
