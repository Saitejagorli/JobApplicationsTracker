import {
  createApplication,
  getApplications,
  getApplication,
  getApplicationMetrics,
  getLast6MonthsApplications,
  updateApplication,
} from "../services/applicationServices.js";

const createNewApplication = async (req, res) => {
  try {
    await createApplication(req.body);
    res.status(201).json({ message: "Application created successfully" });
  } catch (err) {
    console.error("Error creating Application:", err);
    res.status(500).json({ message: "Internal Server Error" });
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
    const application = await getApplication(id);
    res.status(200).json({ data: application });
  } catch (err) {
    console.error("Error occured while fetching applications:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateApplicationByID = async (req, res) => {
  try {
    const id = req.params.id;
    const updateFields = req.body;
    await updateApplication(id, updateFields);
    res.status(200).json({ message: "Application updated successfully" });
  } catch (err) {
    console.error("Error occured while Updating application:", err);
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
  getMetrics,
  getChartData,
};
