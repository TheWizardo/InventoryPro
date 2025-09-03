import { NextFunction, Request, Response } from "express";
import licenseLogic from '../Logic/license-logic';
import { UnauthorizedError } from "../Models/client-errors";
import catchAll from "./catch-all";

function validateLicense(req: Request, res: Response, next: NextFunction): void {
    licenseLogic.fetchEncryptedLicense().then(cipher => {
        const dateString = licenseLogic.decryptJsonMessage<{ licenseEnd: string }>(cipher).licenseEnd;
        if (dateString === "Invalid") {
            throw new UnauthorizedError("Invalid License");
        }
        const date = new Date(dateString);
        licenseLogic.licenseDate = { licenseEnd: date };
        const now = new Date();
        if ((date.getTime() - now.getTime()) > 0) {
            next();
        }
        else {
            throw new UnauthorizedError("Invalid License");
        }
    }).catch(err => catchAll(err, req, res, next))
}

export default validateLicense;