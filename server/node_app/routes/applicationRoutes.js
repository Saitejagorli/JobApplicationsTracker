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
  updateAttachment,
  deleteApplicationAttachment,
} from "../controllers/applicationController.js";

router.get("/", getAllApplications);
router.post("/", createNewApplication);
router.get("/metrics", getMetrics);
router.get("/chart", getChartData);
router.get("/:id", getApplicationByID);
router.patch("/:id", updateApplicationByID);
router.post("/:id/attachments", updateAttachment);
router.delete("/:id/attachments/:attachmentId", deleteApplicationAttachment);
router.delete("/:id", deleteApplicationByID);
export { router as applicationRoutes };
