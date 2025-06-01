import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
};

export const getCache = async (key: string) => {
  const client = await connectRedis();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key: string, value: any, expireTime = 3600) => {
  const client = await connectRedis();
  await client.set(key, JSON.stringify(value), {
    EX: expireTime,
  });
};

export const deleteCache = async (key: string) => {
  const client = await connectRedis();
  await client.del(key);
};

export default redisClient; 