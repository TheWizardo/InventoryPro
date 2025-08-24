import express, { Request, Response, NextFunction } from "express";
import inventoryLogLogic from "../Logic/inventoryLog-logic";
import { ILogRegistry } from "../Models/LogRegistry-Model";

const router = express.Router();

// GET all logRegistries
router.get("/api/logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logRegistries = await inventoryLogLogic.getAllRegistries();
    res.json(logRegistries);
  } catch (err) {
    next(err);
  }
});

// POST add a new logRegistry
router.post("/api/logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.registrationDate = new Date(req.body.registrationDate);
    const newRegistry = await inventoryLogLogic.addRegistry(req.body as ILogRegistry);
    res.json(newRegistry);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// DELETE Registry by ID
router.delete("/api/logs/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deletedRegistry = await inventoryLogLogic.deleteRegistry(req.params.id);
    res.json(deletedRegistry);
  } catch (err) {
    next(err);
  }
});

export default router;
