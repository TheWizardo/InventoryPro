import express from 'express';
import catchAll from './Middleware/catch-all';
import routeNotFound from './Middleware/route-not-found';
import employeesController from './Controllers/employees-controller';
import inventoryController from './Controllers/inventoryItem-controller';
import assemblyController from './Controllers/assembly-controller';
import projectsController from './Controllers/projects-controller';
import logsController from './Controllers/inventoryLog-controller';
import licenseController from './Controllers/licenseLog-controller';
import expressRateLimit from 'express-rate-limit';
import cors from 'cors';
import logger from './Middleware/logger-mw';
import config from './Utils/config';
import {connectToDatabase} from './Utils/dal';
import validateLicense from './Middleware/licenseValidation-mw';
connectToDatabase();


const server = express();


server.use(cors());
server.use("/", expressRateLimit({windowMs: 500, max: 20, message: "Please try again later"}));

server.use(express.json());
server.use(logger); ///////////////////////////////////////////////////////////////////////////////////////////////
server.use("/", licenseController);
server.use(validateLicense);
server.use("/", employeesController);
server.use("/", inventoryController);
server.use("/", assemblyController);
server.use("/", projectsController);
server.use("/", logsController);
server.use("*", routeNotFound);
server.use(catchAll);

server.listen(config.port, () => console.log(`Listening on http://localhost:${config.port}`));