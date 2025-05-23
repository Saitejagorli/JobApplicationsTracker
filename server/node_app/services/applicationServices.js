import { Application } from "../models/application.js";
import { summarizeJobPost } from "./summarizationService.js";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

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

    summarizeJobPost(jobPostLink)
      .then((description) =>
        Application.findByIdAndUpdate(newApplication._id, { description })
      )
      .catch((summaryError) => {
        console.error("❌ Summarization failed", summaryError);
        Application.findByIdAndUpdate(newApplication._id, {
          description: "Details Not Found",
        });
      });

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
    const sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
    const applications = await Application.find(query, {
      companyName: 1,
      role: 1,
      logo: 1,
      domain: 1,
      location: 1,
      source: 1,
      status: 1,
      createdAt: 1,
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

    const application = await Application.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (updateFields.jobPostLink) {
      (async () => {
        try {
          const description = await summarizeJobPost(updateFields.jobPostLink);
          await Application.findByIdAndUpdate(new ObjectId(id), {
            description,
          });
        } catch (err) {
          console.error("❌ Summarization failed", err);
          await Application.findByIdAndUpdate(id, {
            description: "Details Not Found",
          });
        }
      })();
    }
    return application;
  } catch (err) {
    throw err;
  }
};

const deleteApplication = async (id) => {
  try {
    const application = await Application.deleteOne({ _id: new ObjectId(id) });
    return application;
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

export {
  createApplication,
  getApplications,
  getApplication,
  getApplicationMetrics,
  getLast6MonthsApplications,
  updateApplication,
  deleteApplication,
};
