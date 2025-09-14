import express, { Request, Response, NextFunction } from "express";
import employeeLogic from "../Logic/employees-logic";
import { IEmployee } from '../Models/Employee-Model';

const router = express.Router();

router.get(
  "/api/employees",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employees = await employeeLogic.getAllEmployees();
      res.json(employees);
    } catch (err: any) {
      next(err);
    }
  }
);

router.post(
    "/api/employees",
    async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newEmployee = await employeeLogic.addEmployee(req.body as IEmployee);
      res.json(newEmployee);
    } catch (err: any) {
      next(err);
    }
    }
)

router.put(
    "/api/employees/:_id",
    async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedEmployee = await employeeLogic.updateEmployee(req.params._id, req.body as Partial<IEmployee>);
      res.json(updatedEmployee);
    } catch (err: any) {
      next(err);
    }
    }
)

router.delete(
    "/api/employees/:_id",
    async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deletedEmployee = await employeeLogic.deleteEmployee(req.params._id);
      res.json(deletedEmployee);
    } catch (err: any) {
      next(err);
    }
    }
)

export default router;
