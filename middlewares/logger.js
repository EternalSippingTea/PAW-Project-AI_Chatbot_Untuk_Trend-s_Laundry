const logger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log([${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms));
    });
    next();
};
module.exports = logger;

package.json
{
  "dependencies": {
    "dotenv": "^18.0.10",
    "ejs": "^7.0.2",
    "express": "^5.3.0",
    "init": "^0.1.2",
    "nodemon": "^3.1.14",
    "pg": "^8.23.1",
    "sequelize": "^6.37.8",
    "sequelize-cli": "^6.6.5"
  },
  "name": "projectcontinue",
  "version": "1.0.0",
  "description": "",
  "main": "app.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node app.js"
  },
  "keywords": [],
  "type": "commonjs"
}