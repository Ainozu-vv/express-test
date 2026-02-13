const {Sequelize}=require("sequelize")
const config=require('./config.json').development

const sequelize=new Sequelize(config)

sequelize.sync()
    .then(()=>console.log("Database synced"))
    .catch((error)=>console.log("Error" ,error))

module.exports=sequelize