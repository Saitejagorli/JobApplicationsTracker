import express from "express";
const router = express.Router();

import {
  createNewApplication,
  getAllApplications,
  getApplicationByID,
  updateApplicationByID,
  getChartData,
  getMetrics,
  deleteApplicationByID,
} from "../controllers/applicationController.js";

router.get("/", getAllApplications);
router.post("/", createNewApplication);
router.get("/metrics", getMetrics);
router.get("/chart", getChartData);
router.get("/:id", getApplicationByID);
router.patch("/:id", updateApplicationByID);
router.delete("/:id", deleteApplicationByID);
export { router as applicationRoutes };
