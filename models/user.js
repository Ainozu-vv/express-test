const { DataTypes, Model } = require('sequelize');
const sequelize=require("../db")

class User extends Model {}

User.init(
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user', 
    },
  },
  {
    sequelize,
    modelName: 'User',
  }
);

module.exports = User;
