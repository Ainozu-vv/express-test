const Task = require('../models/task'); 
const User = require('../models/user');


const checkUserTaskOwnership = async (req, res, next) => {
  const { UserId } = req.body; 
  const taskId = req.params.taskId;

  try {
    const user = await User.findByPk(UserId);
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található!' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'A feladat nem található!' });
    }


    if (task.UserId !== UserId && user.role !== 'admin') {
      return res.status(403).json({ message: 'Nincs jogosultságod ehhez a feladathoz!' });
    }

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Hiba történt a feladat keresésekor.', error: err });
  }
};

module.exports = { checkUserTaskOwnership };
