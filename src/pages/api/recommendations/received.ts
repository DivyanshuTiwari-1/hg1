import { NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import Recommendation from '@/models/Recommendation';
import { auth, AuthenticatedRequest } from '@/middleware/auth';
import { getCache, setCache } from '@/lib/redis';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await auth(req, res, async () => {
      const { page = '1', limit = '10' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const cacheKey = `recommendations:received:${req.user._id}:${page}:${limit}`;
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        return res.status(200).json(cachedData);
      }

      const [recommendations, total] = await Promise.all([
        Recommendation.find({ recipient: req.user._id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('property')
          .populate('sender', 'name email'),
        Recommendation.countDocuments({ recipient: req.user._id })
      ]);

      const data = {
        recommendations,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      };

      await setCache(cacheKey, data);
      res.status(200).json(data);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching recommendations' });
  }
} 