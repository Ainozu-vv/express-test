const express = require('express');
const User = require('../models/user');
const router = express.Router();
const bcrypt = require('bcryptjs'); // A jelszó titkosításhoz

// Regisztráció
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Jelszó titkosítása
    const user = await User.create({ username, password: hashedPassword, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a regisztráció során.', error: err });
  }
});

// Bejelentkezés
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Hibás jelszó!' });
    }

    // A sikeres bejelentkezés után a felhasználót visszaküldjük (szükség esetén itt kezelhetsz session-t vagy JWT-t)
    res.status(200).json({ message: 'Sikeres bejelentkezés!', user });
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a bejelentkezés során.', error: err });
  }
});

// Felhasználói adatok lekérdezése
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id); // Felhasználó lekérdezése az ID alapján
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található!' });
    }
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json(userResponse);
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a felhasználó lekérdezésekor.', error: err });
  }
});

// Felhasználó frissítése
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található!' });
    }

    // Jelszó frissítése, ha szükséges
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    
    // Egyéb adatokat frissíthetjük
    user.username = username || user.username;
    user.role = role || user.role;

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a felhasználó frissítésekor.', error: err });
  }
});

// Felhasználó törlése
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található!' });
    }

    await user.destroy(); // Felhasználó törlése
    res.status(200).json({ message: 'Felhasználó törölve!' });
  } catch (err) {
    res.status(500).json({ message: 'Hiba történt a felhasználó törlésekor.', error: err });
  }
});

module.exports = router;
