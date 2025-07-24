import { Application } from "../models/application.js";
import { summarizeJobPost } from "./summarizationService.js";

import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

import { Client, Storage } from "appwrite";

import dotenv from "dotenv";

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID);

const storage = new Storage(client, {
  apiKey: process.env.APPWRITE_API_KEY,
});

const getLatestStatus = (timestamps) => {
  const statusOrder = ["applied", "interviewing", "offered", "rejected"];

  const validStatuses = statusOrder.filter((status) => timestamps[status]);

  return validStatuses[validStatuses.length - 1] || null;
};

const createApplication = async ({
  companyName,
  logo,
  domain,
  role,
  location,
  source,
  jobPostLink,
  jobType,
  statusTimestamps,
}) => {
  try {
    const latestStatus = getLatestStatus(statusTimestamps);

    if (!latestStatus) {
      const error = new Error("No valid status provided in the timestamps");
      error.statusCode = 400;
      throw error;
    }

    const newApplication = await Application.create({
      companyName,
      logo,
      domain,
      role,
      location,
      source,
      jobPostLink,
      jobType,
      status: latestStatus,
      statusTimestamps,
      description: "Processing...", // placeholder
    });

    summarizeDescription(newApplication._id, jobPostLink, "");

    return newApplication._id;
  } catch (err) {
    throw err;
  }
};

const getApplications = async (req) => {
  try {
    const {
      offset = 0,
      limit = 10,
      searchValue = "",
      status = "",
      sortOrder = "desc",
    } = req.query;
    const query = {};
    if (searchValue) {
      query.companyName = new RegExp(`^${searchValue}`, "i");
    }
    if (status) {
      query.status = status;
    }
    const sort = { "statusTimestamps.applied": sortOrder === "asc" ? 1 : -1 };
    const applications = await Application.find(query, {
      companyName: 1,
      role: 1,
      logo: 1,
      domain: 1,
      location: 1,
      source: 1,
      status: 1,
      "statusTimestamps.applied": 1,
      _id: 1,
    })
      .sort(sort)
      .skip(offset)
      .limit(limit);

    const total = await Application.countDocuments(query);

    return { applications: applications, total: total };
  } catch (error) {
    throw error;
  }
};

const getApplication = async (id) => {
  try {
    const application = await Application.findOne({ _id: new ObjectId(id) });
    return application;
  } catch (error) {
    throw error;
  }
};

const updateApplication = async (id, updateFields) => {
  try {
    if (updateFields.statusTimestamps) {
      const latestStatus = getLatestStatus(updateFields.statusTimestamps);
      if (!latestStatus) {
        throw new Error("No valid status provided in the timestamps");
      }
      updateFields.status = latestStatus;
    }

    let summaryUrl = "";
    let summaryDesc = "";

    if (updateFields.jobPostLink) summaryUrl = updateFields.jobPostLink;
    if (updateFields.description) summaryDesc = updateFields.description;

    if (summaryUrl || summaryDesc) {
      updateFields.description = "Processing...";
      summarizeDescription(id, summaryUrl, summaryDesc);
    }

    const application = await Application.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    return application;
  } catch (err) {
    throw err;
  }
};

const addAttachment = async (id, attachment) => {
  try {
    const application = await Application.findByIdAndUpdate(
      id,
      { $push: { attachments: attachment } },
      { new: true, runValidators: true }
    );
    return application;
  } catch (err) {
    throw err;
  }
};

const deleteAttachment = async (applicationId, fileId) => {
  try {
    const application = await Application.findByIdAndUpdate(
      applicationId,
      { $pull: { attachments: { $id: fileId } } },
      { new: true, runValidators: true }
    );
    return application;
  } catch (err) {
    throw err;
  }
};

const deleteApplication = async (id) => {
  try {
    const app = await Application.findById(id);
    if (!app) throw new Error("Application not found");

    const attachments = app.attachments || [];

    for (const attachment of attachments) {
      if (attachment?.$id) {
        try {
          await storage.deleteFile(
            process.env.ATTACHMENTS_BUCKET_ID,
            attachment.$id
          );
        } catch (err) {
          console.warn(
            `⚠️ Failed to delete attachment ${attachment.$id}:`,
            err.message
          );
        }
      }
    }

    const result = await Application.deleteOne({ _id: new ObjectId(id) });
    return result;
  } catch (err) {
    throw err;
  }
};

const getApplicationMetrics = async () => {
  try {
    const totalApplications = await Application.countDocuments();

    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    const applicationsLast7days = await Application.countDocuments({
      "statusTimestamps.applied": {
        $gte: sevenDaysAgo,
        $lte: currentDate,
      },
    });

    const offersReceived = await Application.countDocuments({
      status: "offered",
    });

    const interviewsScheduled = await Application.countDocuments({
      status: "interviewing",
    });
    const rejected = await Application.countDocuments({
      status: "rejected",
    });

    const applied = await Application.countDocuments({
      status: "applied",
    });

    const responseRate =
      totalApplications > 0
        ? Math.round(
            ((offersReceived + interviewsScheduled + rejected) /
              totalApplications) *
              100
          )
        : 0;

    const conversionRate =
      totalApplications > 0
        ? Math.round((offersReceived / totalApplications) * 100)
        : 0;

    const rejectionRate =
      totalApplications > 0
        ? Math.round((rejected / totalApplications) * 100)
        : 0;

    const now = new Date();
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const applicationsOlderThanSixtyDays = await Application.countDocuments({
      "statusTimestamps.applied": {
        $lt: sixtyDaysAgo,
      },
      status: "applied",
    });

    const ghostedRate =
      totalApplications > 0
        ? Math.round((applicationsOlderThanSixtyDays / totalApplications) * 100)
        : 0;

    return {
      totalApplications,
      applicationsLast7days,
      offersReceived,
      interviewsScheduled,
      responseRate,
      conversionRate,
      rejectionRate,
      ghostedRate,
      applied,
      rejected,
    };
  } catch (err) {
    throw err;
  }
};

const getLast6MonthsApplications = async () => {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const rawData = await Application.aggregate([
    {
      $match: {
        "statusTimestamps.applied": { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$statusTimestamps.applied" },
          month: { $month: "$statusTimestamps.applied" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData = [];
  const currentDate = new Date(sixMonthsAgo);

  for (let i = 0; i < 6; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const entry = rawData.find(
      (item) => item._id.year === year && item._id.month === month
    );

    chartData.push({
      month: `${monthNames[month - 1]} ${year}`,
      count: entry ? entry.count : 0,
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return chartData;
};

const summarizeDescription = async (id, url = "", description = "") => {
  try {
    const response = await summarizeJobPost({ url, description });
    let updates = { description: response.html, isUrlParsed: false };
    if (url && response.success) {
      updates.isUrlParsed = true;
    }
    await Application.findByIdAndUpdate(id, updates);
  } catch (err) {
    console.error("❌ Summarization failed", err.message);
    await Application.findByIdAndUpdate(id, {
      description: `
                  <div class="job-summary">
                    <h1 class="text-2xl font-bold text-red-600">Details Not Found</h1>
                  </div>
                  `,
      isUrlParsed: false,
    });
  }
};

export {
  createApplication,
  getApplications,
  getApplication,
  getApplicationMetrics,
  getLast6MonthsApplications,
  updateApplication,
  deleteApplication,
  addAttachment,
  deleteAttachment,
};
