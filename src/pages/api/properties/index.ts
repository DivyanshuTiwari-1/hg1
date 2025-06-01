import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import Property from '@/models/Property';
import { auth, AuthenticatedRequest } from '@/middleware/auth';
import { getCache, setCache, deleteCache } from '@/lib/redis';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await connectDB();

  switch (req.method) {
    case 'GET':
      try {
        const {
          page = '1',
          limit = '10',
          type,
          minPrice,
          maxPrice,
          bedrooms,
          bathrooms,
          city,
          state,
          furnished,
          amenities,
          sortBy = 'createdAt',
          sortOrder = 'desc',
        } = req.query;

        const query: any = {};
        
        if (type) query.type = type;
        if (minPrice || maxPrice) {
          query.price = {};
          if (minPrice) query.price.$gte = Number(minPrice);
          if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (bedrooms) query.bedrooms = Number(bedrooms);
        if (bathrooms) query.bathrooms = Number(bathrooms);
        if (city) query.city = new RegExp(city as string, 'i');
        if (state) query.state = new RegExp(state as string, 'i');
        if (furnished) query.furnished = furnished;
        if (amenities) {
          query.amenities = {
            $all: (amenities as string).split(',').map(a => a.trim())
          };
        }

        console.log('Query:', JSON.stringify(query, null, 2));

        const skip = (Number(page) - 1) * Number(limit);
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

        const cacheKey = `properties:${JSON.stringify(query)}:${page}:${limit}:${sortBy}:${sortOrder}`;
        const cachedData = await getCache(cacheKey);

        if (cachedData) {
          return res.status(200).json(cachedData);
        }

        // First, let's check if we have any properties at all
        const totalProperties = await Property.countDocuments({});
        console.log('Total properties in database:', totalProperties);

        const [properties, total] = await Promise.all([
          Property.find(query)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .populate('createdBy', 'name email'),
          Property.countDocuments(query)
        ]);

        console.log('Found properties:', properties.length);
        console.log('Query total:', total);

        const data = {
          properties,
          total,
          page: Number(page),
          totalPages: Math.ceil(total / Number(limit))
        };

        await setCache(cacheKey, data);
        res.status(200).json(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ error: 'Error fetching properties' });
      }
      break;

    case 'POST':
      try {
        await auth(req, res, async () => {
          // Generate a unique ID for the property
          const lastProperty = await Property.findOne().sort({ id: -1 });
          const lastId = lastProperty ? parseInt(lastProperty.id.replace('PROP', '')) : 0;
          const newId = `PROP${lastId + 1}`;

          const property = new Property({
            ...req.body,
            id: newId,
            createdBy: req.user._id
          });
          await property.save();
          await deleteCache('properties:*');
          res.status(201).json(property);
        });
      } catch (error) {
        console.error('Error creating property:', error);
        res.status(500).json({ error: 'Error creating property' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 