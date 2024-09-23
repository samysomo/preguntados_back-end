import User from '../models/UserModel.js';

export const addFriend = async (req, res) => {
  const { friendId } = req.body;
  const userId = req.userId; // Esto viene del token de autenticación

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).send('Friend not found');
    }

    // Verificar si ya son amigos
    if (user.friends.includes(friendId)) {
      return res.status(400).send('Already friends');
    }

    // Agregar el amigo a la lista de ambos usuarios
    user.friends.push(friendId);
    await user.save();

    friend.friends.push(userId);
    await friend.save();

    res.status(200).json({ message: 'Friend added successfully' });
  } catch (error) {
    res.status(500).send('Error adding friend');
  }
};

export const getMatchHistory = async (req, res) => {
    const userId = req.userId; // Del token de autenticación

    try {
        const user = await User.findById(userId).populate('matchHistory');
        
        if (!user) {
        return res.status(404).send('User not found');
        }

        res.status(200).json({ matchHistory: user.matchHistory });
    } catch (error) {
        res.status(500).send('Error fetching match history');
    }
};