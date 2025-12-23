
// src/config/redisClient.ts (for production)
import { createClient } from "redis";

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error", err);
});

(async () => {
  await redisClient.connect();
  console.log("✅ Redis connected");
})();

export default redisClient;








//(for local)
// import { createClient } from "redis";

// const redisClient = createClient();

// redisClient.on("error", (err) => console.error("❌ Redis Client Error", err));

// (async () => {
//   await redisClient.connect();
//   console.log("✅ Redis connected");
// })();

// export default redisClient;
