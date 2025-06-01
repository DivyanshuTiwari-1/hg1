import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Property from '@/models/Property';
import Recommendation from '@/models/Recommendation';
import { auth, AuthenticatedRequest } from '@/middleware/auth';
import { deleteCache } from '@/lib/redis';

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await auth(req, res, async () => {
      const { propertyId, recipientEmail, message } = req.body;

      // Find the recipient user
      const recipient = await User.findOne({ email: recipientEmail });
      if (!recipient) {
        return res.status(404).json({ error: 'Recipient user not found' });
      }

      // Check if the property exists
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Create the recommendation
      const recommendation = new Recommendation({
        property: propertyId,
        sender: req.user._id,
        recipient: recipient._id,
        message
      });

      await recommendation.save();

      // Clear cache for recipient's recommendations
      await deleteCache(`recommendations:received:${recipient._id}`);

      res.status(201).json({
        message: 'Recommendation sent successfully',
        recommendation
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error sending recommendation' });
  }
} 