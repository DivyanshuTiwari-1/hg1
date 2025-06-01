import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Property from '@/models/Property';
import { auth, AuthenticatedRequest } from '@/middleware/auth';
import { getCache, setCache, deleteCache } from '@/lib/redis';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        await auth(req, res, async () => {
          const cacheKey = `favorites:${req.user._id}`;
          const cachedData = await getCache(cacheKey);

          if (cachedData) {
            return res.status(200).json(cachedData);
          }

          const user = await User.findById(req.user._id)
            .populate({
              path: 'favorites',
              populate: {
                path: 'createdBy',
                select: 'name email'
              }
            });

          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }

          await setCache(cacheKey, user.favorites);
          res.status(200).json(user.favorites);
        });
      } catch (error) {
        res.status(500).json({ error: 'Error fetching favorites' });
      }
      break;

    case 'POST':
      try {
        await auth(req, res, async () => {
          const { propertyId } = req.body;

          // First find the property by its string ID
          const property = await Property.findOne({ id: propertyId });
          if (!property) {
            return res.status(404).json({ error: 'Property not found' });
          }

          const user = await User.findById(req.user._id);
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }

          if (user.favorites.includes(property._id)) {
            return res.status(400).json({ error: 'Property already in favorites' });
          }

          user.favorites.push(property._id);
          await user.save();

          await deleteCache(`favorites:${req.user._id}`);
          res.status(200).json({ message: 'Property added to favorites' });
        });
      } catch (error) {
        res.status(500).json({ error: 'Error adding to favorites' });
      }
      break;

    case 'DELETE':
      try {
        await auth(req, res, async () => {
          const { propertyId } = req.body;

          const user = await User.findById(req.user._id);
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }

          user.favorites = user.favorites.filter(
            (id: any) => id.toString() !== propertyId
          );
          await user.save();

          await deleteCache(`favorites:${req.user._id}`);
          res.status(200).json({ message: 'Property removed from favorites' });
        });
      } catch (error) {
        res.status(500).json({ error: 'Error removing from favorites' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 