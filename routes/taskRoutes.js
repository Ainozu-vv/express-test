const express = require('express');
const Task = require('../models/task');
const { checkUserTaskOwnership } = require('../middlewares/taskOwnership');
const { checkTaskNotCompleted } = require('../middlewares/taskStatus');
const router = express.Router();

// Új feladat létrehozása
router.post('/', async (req, res) => {
  const { title, description,UserId } = req.body;
  
  try {
    const task = await Task.create({ title, description, UserId });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a feladat létrehozásakor.', error: err });
  }
});

// Feladatok lekérése
router.get('/', async (req, res) => {
  const userId = req.user.id; // Az autentikált felhasználó ID-ja
  
  try {
    const tasks = await Task.findAll({
      where: { userId },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a feladatok lekérésekor.', error: err });
  }
});

// Feladat megtekintése - csak a saját feladatok vagy admin jogosultság szükséges
router.get('/:taskId', checkUserTaskOwnership, async (req, res) => {
  const taskId = req.params.taskId;
  
  try {
    const task = await Task.findByPk(taskId);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a feladat lekérésekor.', error: err });
  }
});

// Feladat szerkesztése - csak a tulajdonos, nem befejezett feladatok esetén
router.put('/:taskId', checkUserTaskOwnership, checkTaskNotCompleted, async (req, res) => {
  const taskId = req.params.taskId;
  const { title, description, status } = req.body;

  try {
    const task = await Task.findByPk(taskId);

    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;

    await task.save();
    res.json(task);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Hiba történt a feladat frissítésekor.', error: err });
  }
});

// Feladat törlése - csak a tulajdonos, nem befejezett feladatok esetén
router.delete('/:taskId', checkUserTaskOwnership, checkTaskNotCompleted, async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const task = await Task.findByPk(taskId);
    await task.destroy();
    res.json({ message: 'A feladat sikeresen törölve lett.' });
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a feladat törlésekor.', error: err });
  }
});

module.exports = router;
