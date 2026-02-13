// middlewares/taskStatus.js
const Task = require('../models/task');

const checkTaskNotCompleted = async (req, res, next) => {
  const taskId = req.params.taskId;

  try {
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ message: 'A feladat nem található.' });
    }

    // Ellenőrizzük, hogy a feladat befejezett-e
    if (task.status === 'completed') {
      return res.status(403).json({ message: 'A feladat már befejezett, nem lehet szerkeszteni vagy törölni.' });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a feladat állapotának ellenőrzésekor.', error: err });
  }
};

module.exports = { checkTaskNotCompleted };
