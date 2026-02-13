const logRequestMiddleware = (req, res, next) => {
    console.log(`${readableDate} - Elérni kívánt útvonal: ${req.originalUrl}`);
    next();
  };
  
const now = new Date(Date.now());
const readableDate = now.getFullYear() + '-' 
  + String(now.getMonth() + 1).padStart(2, '0') + '-' 
  + String(now.getDate()).padStart(2, '0') + ' ' 
  + String(now.getHours()).padStart(2, '0') + ':' 
  + String(now.getMinutes()).padStart(2, '0') + ':' 
  + String(now.getSeconds()).padStart(2, '0');




  module.exports = logRequestMiddleware;
  