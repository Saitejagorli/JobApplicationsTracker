import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

import {
  createApplication,
  getApplications,
  getApplication,
  getApplicationMetrics,
  getLast6MonthsApplications,
  updateApplication,
  deleteApplication,
  addAttachment,
  deleteAttachment,
} from "../services/applicationServices.js";

const createNewApplication = async (req, res) => {
  try {
    await createApplication(req.body);
    res.status(201).json({ message: "Application created successfully" });
  } catch (err) {
    console.error("Error creating Application:", err);
    const status = err.statusCode || 500;
    res.status(status).json({
      message:
        status === 500
          ? "Internal Server Error"
          : err.message || "Request Failed",
    });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const applications = await getApplications(req);
    res.status(200).json({ data: applications });
  } catch (err) {
    console.error("Error occured while fetching applications:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getApplicationByID = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const application = await getApplication(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.status(200).json({ data: application });
  } catch (err) {
    console.error("Error occured while fetching applications:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateApplicationByID = async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  const updateFields = req.body;

  if (!updateFields || Object.keys(updateFields).length === 0) {
    return res.status(400).json({ message: "No data provided" });
  }

  try {
    const updatedApplication = await updateApplication(id, updateFields);
    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.status(200).json({ message: "Application updated successfully" });
  } catch (err) {
    console.error("Error occured while Updating application:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateAttachment = async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  const attachment = req.body;
  if (!attachment || Object.keys(attachment).length === 0) {
    return res.status(400).json({ message: "No attachment data provided" });
  }
  try {
    const updatedApplication = await addAttachment(id, attachment);
    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.status(200).json({ message: "Attachment added successfully" });
  } catch (err) {
    console.error("Error occured while adding attachment:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteApplicationAttachment = async (req, res) => {
  const id = req.params.id;
  const attachmentId = req.params.attachmentId;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const updatedApplication = await deleteAttachment(id, attachmentId);
    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.status(200).json({ message: "Attachment deleted successfully" });
  } catch (err) {
    console.error("Error occured while deleting attachment:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};  

const deleteApplicationByID = async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const result = await deleteApplication(id);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error occured while Deleting application:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMetrics = async (req, res) => {
  try {
    const metrics = await getApplicationMetrics();
    res.status(200).json({ data: metrics });
  } catch (err) {
    console.error("Error occured while fetching application metrics:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getChartData = async (req, res) => {
  try {
    const chartData = await getLast6MonthsApplications();
    res.status(200).json({ data: chartData });
  } catch (err) {
    console.error("Error occured while fetching chart data:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  createNewApplication,
  getAllApplications,
  getApplicationByID,
  updateApplicationByID,
  deleteApplicationByID,
  updateAttachment,
  deleteApplicationAttachment,
  getMetrics,
  getChartData,
};
