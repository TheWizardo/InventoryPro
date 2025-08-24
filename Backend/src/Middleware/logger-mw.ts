import { NextFunction, Request, Response } from "express";

// mostly for debugging
// logs incoming requests
function logger(req: Request, res: Response, next: NextFunction): void {
    console.log(`${req.method} ${req.baseUrl + req.originalUrl}`);
    next();
}

export default logger;