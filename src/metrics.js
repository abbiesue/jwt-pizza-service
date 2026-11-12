const config = require("./config");
const os = require("os");

//Metrics storage
let getRequestsCount = 0;
let postRequestsCount = 0;
let putRequestsCount = 0;
let deleteRequestsCount = 0;
let totalRequestsCount = 0;

let pizzasSoldCount = 0;
let creationFailuresCount = 0;
let revenueGenerated = 0;
let pizzaCreationLatencySum = 0;
let pizzaCreationLatencyCount = 0;
let pizzaCreationLatencyAverage = 0;

const activeUsers = new Map();

let successfulLoginsCount = 0;
let failedLoginsCount = 0;

//HTTP Request metrics
function requestTracker(req, res, next) {
  updateMethodCounts(req.method);
  totalRequestsCount++;
  if (req.user) {
    logUserActivity(req.user.id);
  }
  next();
}

function updateMethodCounts(method) {
  switch (method) {
    case "GET":
      getRequestsCount++;
      break;
    case "POST":
      postRequestsCount++;
      break;
    case "PUT":
      putRequestsCount++;
      break;
    case "DELETE":
      deleteRequestsCount++;
      break;
    default:
      break;
  }
}

//System metrics
function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return Number((cpuUsage * 100).toFixed(2));
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return Number(memoryUsage.toFixed(2));
}

//Purchase metrics
function logPizzaPurchase(success, latency, price, pizzaCount) {
  if (success) {
    pizzasSoldCount += pizzaCount;
    revenueGenerated += price;
  } else {
    creationFailuresCount++;
  }
  pizzaCreationLatencySum += latency;
  pizzaCreationLatencyCount++;
}

//Active user metrics
function logUserActivity(userId) {
  const currentTime = Date.now();
  activeUsers.set(userId, currentTime);
}

function getActiveUserCount() {
  const currentTime = Date.now();
  for (const [userId, lastActivityTime] of activeUsers.entries()) {
    if (currentTime - lastActivityTime > 5 * 60 * 1000) {
      activeUsers.delete(userId);
    }
  }
  return activeUsers.size;
}

//Login metrics
function logLoginAttempt(success) {
  if (success) {
    successfulLoginsCount++;
  } else {
    failedLoginsCount++;
  }
}

function createMetric(
  metricName,
  metricValue,
  metricUnit,
  metricType,
  valueType,
  attributes,
) {
  attributes = { ...attributes, source: config.metrics.source };

  const metric = {
    name: metricName,
    unit: metricUnit,
    [metricType]: {
      dataPoints: [
        {
          [valueType]: metricValue,
          timeUnixNano: Date.now() * 1000000,
          attributes: [],
        },
      ],
    },
  };

  Object.keys(attributes).forEach((key) => {
    metric[metricType].dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  if (metricType === "sum") {
    metric[metricType].aggregationTemporality =
      "AGGREGATION_TEMPORALITY_CUMULATIVE";
    metric[metricType].isMonotonic = true;
  }

  return metric;
}

function sendMetricToGrafana(metrics) {
  const body = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics,
          },
        ],
      },
    ],
  };

  fetch(`${config.metrics.endpointUrl}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${config.metrics.accountId}:${config.metrics.apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP status: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error("Error pushing metrics:", error);
    });
}

module.exports = {
  requestTracker,
  logPizzaPurchase,
  logUserActivity,
  logLoginAttempt,
};
