const { DataTypes, Model } = require('sequelize');
const sequelize = require("../db");
const User = require('./user'); // Import the User model to define the relationship

class Task extends Model {}

Task.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status:{
      type: DataTypes.STRING,
      allowNull: false,
    },
     status:{
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:"in progress"
    },
  },
  {
    sequelize,
    modelName: 'Task',
  }
);

// Define the relationship between User and Task
Task.belongsTo(User);
User.hasMany(Task);

module.exports = Task;
