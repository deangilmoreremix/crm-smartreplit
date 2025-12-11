// server/health/index.ts
var handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    },
    body: JSON.stringify({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      function: "health"
    })
  };
};
export {
  handler
};
