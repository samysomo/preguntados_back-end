import { Router } from 'express';
import { addFriend, getMatchHistory, getUserFriends } from '../controllers/UserController.js';
import { verifyToken } from '../middlewares/AuthMiddleware.js';

const userRoutes = Router();

// Ruta para agregar amigos
userRoutes.post('/add-friend', verifyToken, addFriend);

// Ruta para consultar el historial de partidas
userRoutes.get('/match-history', verifyToken, getMatchHistory);

userRoutes.get('/friends', verifyToken, getUserFriends);

export default userRoutes;
