import express, { Request, Response, NextFunction } from "express";
import licenseLogic from "../Logic/license-logic";

const router = express.Router();

router.get("/api/license", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(licenseLogic.licenseDate);
  } catch (err) {
    next(err);
  }
});

export default router;
