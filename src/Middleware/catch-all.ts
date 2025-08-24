import { NextFunction, Request, Response } from "express";
import config from "../Utils/config";

// catches all errors in the system and sends them as a response
function catchAll(err: any, req: Request, res: Response, next: NextFunction): void {
    const statusCode = err.status ? err.status : 500;
    if (statusCode === 500 && config.environment === "production"){
        err.message = "Something went wrong..."
    }
    res.status(statusCode).send(err.message);
}

export default catchAll;