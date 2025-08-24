import express, { Request, Response, NextFunction } from "express";
import assemblyLogic from "../Logic/assembly-logic";
import { IAssembledItem } from "../Models/Assembly-Model";
import { Types } from "mongoose";

const router = express.Router();

// GET all assemblies
router.get("/api/assemblies", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assemblies = await assemblyLogic.getAllAssembly();
    res.json(assemblies);
  } catch (err) {
    next(err);
  }
});

// GET assembly by ID
router.get("/api/assemblies/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assembly = await assemblyLogic.getAssemblyById(req.params.id);
    res.json(assembly);
  } catch (err) {
    next(err);
  }
});

// GET assembly by projectID
router.get("/api/assemblies/project/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assembly = await assemblyLogic.getAssembliesByProject(req.params.id);
    res.json(assembly);
  } catch (err) {
    next(err);
  }
});

// GET assembly by employeeID
router.get("/api/assemblies/employee/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assembly = await assemblyLogic.getAssembliesByEmployee(req.params.id);
    res.json(assembly);
  } catch (err) {
    next(err);
  }
});

// POST add a new assembly
router.post("/api/assemblies", async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.productionDate = new Date(req.body.productionDate);
    const newAssembly = await assemblyLogic.addAssembly(req.body as IAssembledItem);
    res.json(newAssembly);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// DELETE assembly by ID
router.delete("/api/assemblies/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deletedAssembly = await assemblyLogic.deleteAssembly(req.params.id);
    res.json(deletedAssembly);
  } catch (err) {
    next(err);
  }
});

export default router;
