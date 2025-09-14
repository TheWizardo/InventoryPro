import express, { Request, Response, NextFunction } from "express";
import * as projectLogic from "../Logic/projects-logic";

const router = express.Router();

// Add project
router.post(
  "/api/projects",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectLogic.addProject(req.body);
      res.status(201).json(project);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get all projects
router.get(
  "/api/projects",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await projectLogic.getAllProjects();
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Get project by ID
router.get(
  "/api/projects/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectLogic.getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      res.json(project);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get project by ID
router.get(
  "/api/projects/:id/progress",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const progress = await projectLogic.getProjectProductsProgress(req.params.id);
      if (!progress) return res.status(404).json({ error: "Project not found" });
      res.json(progress);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Update project
router.put(
  "/api/projects/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectLogic.updateProject(req.params.id, req.body);
      if (!project) return res.status(404).json({ error: "Project not found" });
      res.json(project);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.delete(
  "/api/projects/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await projectLogic.deleteProject(req.params.id));
    } catch (err: any) {
      next(err);
    }
  }
);

export default router;
