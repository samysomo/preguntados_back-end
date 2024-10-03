import User from '../models/UserModel.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '_id username email');

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
}

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
    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: friendId } // Solo añade el amigo sin modificar otros campos
    });

    await User.findByIdAndUpdate(friendId, {
      $addToSet: { friends: userId } // Solo añade el amigo sin modificar otros campos
    });

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

export const getUserFriends = async (req, res) => {
  try {
      // Buscar el usuario y popular los amigos
      const userData = await User.findById(req.userId).populate('friends', 'username email');
      
      if (!userData) {
          return res.status(404).send("User with given id not found");
      }

      return res.status(200).json({
          friends: userData.friends // Añadir los amigos a la respuesta
      });

  } catch (error) {
      return res.status(500).send("Internal Server Error");
  }
};