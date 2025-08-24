import express, { Request, Response, NextFunction } from "express";
import inventoryItemLogic from "../Logic/inventoryItem-logic";
import { IInventoryItem } from "../Models/InventoryItem-Model";

const router = express.Router();

// GET all inventory items
router.get(
  "/api/inventory",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await inventoryItemLogic.getAllInventoryItems();
      res.json(items);
    } catch (err: any) {
      next(err);
    }
  }
);

router.get(
  "/api/inventory/vendors",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vendors = await inventoryItemLogic.getAllVendors();
      res.json(vendors);
    } catch (err: any) {
      next(err);
    }
  }
);

router.post(
  "/api/inventory/products",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await inventoryItemLogic.getItemsByAssembled(
        req.body.isAssembledProduct
      );
      res.json(items);
    } catch (err: any) {
      next(err);
    }
  }
);

// GET inventory item by ID
router.get(
  "/api/inventory/:_id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await inventoryItemLogic.getInventoryItemById(
        req.params._id
      );
      res.json(item);
    } catch (err: any) {
      next(err);
    }
  }
);

// POST to get several inventory items by IDs array
router.post(
  "/api/inventory/many",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await inventoryItemLogic.getSeveralInventoryItems(
        req.body.ids
      );
      res.json(items);
    } catch (err: any) {
      next(err);
    }
  }
);

// POST new inventory item
router.post(
  "/api/inventory",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newItem = await inventoryItemLogic.addInventoryItem(
        req.body as IInventoryItem
      );
      res.json(newItem);
    } catch (err: any) {
      next(err);
    }
  }
);

// PUT update inventory item
router.put(
  "/api/inventory/:_id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedItem = await inventoryItemLogic.updateInventoryItem(
        req.params._id,
        req.body as Partial<IInventoryItem>
      );
      res.json(updatedItem);
    } catch (err: any) {
      console.log(err)
      next(err);
    }
  }
);

router.patch(
  "/api/inventory/adjust-stock",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adjustments = req.body as { _id: string; amount: number }[];
      const updatedItems = await inventoryItemLogic.adjustStock(adjustments);
      res.json(updatedItems);
    } catch (err: any) {
      next(err);
    }
  }
);

router.patch(
  "/api/inventory/override-stock",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const overrides = req.body as { _id: string; newStock: number }[];
      const updatedItems = await inventoryItemLogic.overrideStock(overrides);
      res.json(updatedItems);
    } catch (err: any) {
      next(err);
    }
  }
);

export default router;
