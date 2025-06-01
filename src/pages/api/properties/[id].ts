import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import Property from '@/models/Property';
import { auth, AuthenticatedRequest } from '@/middleware/auth';
import { getCache, setCache, deleteCache } from '@/lib/redis';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        console.log('Fetching property with ID:', id);
        
        const cacheKey = `property:${id}`;
        const cachedData = await getCache(cacheKey);

        if (cachedData) {
          return res.status(200).json(cachedData);
        }

        const property = await Property.findOne({ id: id }).populate('createdBy', 'name email');
        
        if (!property) {
          console.log('Property not found with ID:', id);
          return res.status(404).json({ error: 'Property not found' });
        }

        console.log('Property found:', property.title);
        await setCache(cacheKey, property);
        res.status(200).json(property);
      } catch (error: any) {
        console.error('Error fetching property:', error.message);
        res.status(500).json({ 
          error: 'Error fetching property',
          details: error.message
        });
      }
      break;

    case 'PUT':
      try {
        await auth(req, res, async () => {
          const property = await Property.findOne({ id: id }).populate('createdBy');
          
          if (!property) {
            return res.status(404).json({ error: 'Property not found' });
          }

          // Check if createdBy exists and is populated
          if (!property.createdBy || !req.user?._id) {
            return res.status(403).json({ error: 'Property ownership information is missing' });
          }

          // Compare the string representations of the IDs
          const propertyCreatorId = property.createdBy.toString();
          const userId = req.user._id.toString();

          if (propertyCreatorId !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this property' });
          }

          const updatedProperty = await Property.findOneAndUpdate(
            { id: id },
            { ...req.body },
            { new: true, runValidators: true }
          ).populate('createdBy', 'name email');

          if (!updatedProperty) {
            return res.status(404).json({ error: 'Failed to update property' });
          }

          await deleteCache(`property:${id}`);
          await deleteCache('properties:*');
          res.status(200).json(updatedProperty);
        });
      } catch (error: any) {
        console.error('Error updating property:', error.message);
        res.status(500).json({ 
          error: 'Error updating property',
          details: error.message
        });
      }
      break;

    case 'DELETE':
      try {
        await auth(req, res, async () => {
          const property = await Property.findOne({ id: id }).populate('createdBy');
          
          if (!property) {
            return res.status(404).json({ error: 'Property not found' });
          }

          // For imported properties without createdBy, allow deletion if user is authenticated
          if (!property.createdBy) {
            console.log('Deleting imported property without ownership information');
            await Property.findOneAndDelete({ id: id });
            await deleteCache(`property:${id}`);
            await deleteCache('properties:*');
            return res.status(200).json({ message: 'Property deleted successfully' });
          }

          // For properties with ownership information, verify ownership
          if (!req.user?._id) {
            return res.status(403).json({ error: 'User authentication required' });
          }

          const propertyCreatorId = property.createdBy.toString();
          const userId = req.user._id.toString();

          if (propertyCreatorId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this property' });
          }

          await Property.findOneAndDelete({ id: id });
          await deleteCache(`property:${id}`);
          await deleteCache('properties:*');
          res.status(200).json({ message: 'Property deleted successfully' });
        });
      } catch (error: any) {
        console.error('Error deleting property:', error.message);
        res.status(500).json({ 
          error: 'Error deleting property',
          details: error.message
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 