const express = require('express');
const sequelize = require("./db.js");
const app = express();
const PORT = 3000;

// Importálás és route-ok beállítása
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const logRequestMiddleware = require('./middlewares/requestLogger');

// Alap beállítások
app.use(express.json());

app.use(logRequestMiddleware); // Request logoló middleware alkalmazása globálisan

// Routerek használata
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);

// Indítás
sequelize
  .authenticate()
  .then(() => {
    console.log("DB connected");
    app.listen(PORT, () => console.log(`api running on port ${PORT}`));
  })
  .catch((error) => console.log(error));
