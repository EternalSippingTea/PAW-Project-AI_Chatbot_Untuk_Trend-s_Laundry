const express = require('express');
const path = require('path');
const config = require('./config/appconfig');
const logger = require('./middlewares/logger');
const routes = require('./routes/index');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use('/', routes);

app.listen(config.PORT, () => {
    console.log(`[${config.ENV}] Server berjalan di http://localhost:${config.PORT}`);
});