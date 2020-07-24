const ClientController = require('./controller/ClientController');
const dotenv = require('dotenv');

const commands = require('./commands');
const config = require('./config.json');
dotenv.config();

config.token = process.env.DISCORD_TOKEN;
config.basePath = process.env.DISCORD_BASEPATH;
const clientController = new ClientController(config, commands);

if (!clientController.ready) {
    clientController.init();
}

