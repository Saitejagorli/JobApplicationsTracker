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
  markAttachmentAsUploaded,
  deleteApplicationAttachment,
  getViewUrlForAttachment,
  getDownloadUrlForAttachment,
} from "../controllers/applicationController.js";

router.get("/", getAllApplications);
router.post("/", createNewApplication);
router.get("/metrics", getMetrics);
router.get("/chart", getChartData);
router.get("/:id", getApplicationByID);
router.patch("/:id", updateApplicationByID);
router.post("/:id/attachments", updateAttachment);
router.patch("/:id/attachments/:attachmentId/complete", markAttachmentAsUploaded);
router.delete("/:id/attachments/:attachmentId", deleteApplicationAttachment);
router.get("/:id/attachments/:attachmentId/view", getViewUrlForAttachment);
router.get("/:id/attachments/:attachmentId/download", getDownloadUrlForAttachment);
router.delete("/:id", deleteApplicationByID);
export { router as applicationRoutes };
