import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import connectDB from '../src/lib/db';
import Property from '../src/models/Property';
import User from '../src/models/User';

async function importData() {
  try {
    await connectDB();

    // Create a default admin user if not exists
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    let userId;

    if (!adminUser) {
      const newAdmin = new User({
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
      });
      await newAdmin.save();
      userId = newAdmin._id;
    } else {
      userId = adminUser._id;
    }

    // Read and parse CSV file
    const csvFilePath = path.join(process.cwd(), 'db424fd9fb74_1748258398689 (1).csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Transform and insert data
    const properties = records.map((record: any) => ({
      title: record.title,
      type: record.type,
      price: parseFloat(record.price),
      state: record.state,
      city: record.city,
      areaSqFt: parseFloat(record.areaSqFt),
      bedrooms: parseInt(record.bedrooms),
      bathrooms: parseInt(record.bathrooms),
      amenities: record.amenities ? record.amenities.split(',').map((a: string) => a.trim()) : [],
      furnished: record.furnished === 'true',
      availableFrom: new Date(record.availableFrom),
      listedBy: record.listedBy,
      tags: record.tags ? record.tags.split(',').map((t: string) => t.trim()) : [],
      colorTheme: record.colorTheme,
      rating: parseFloat(record.rating),
      isVerified: record.isVerified === 'true',
      listingType: record.listingType,
      createdBy: userId,
    }));

    // Insert properties in batches
    const batchSize = 100;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      await Property.insertMany(batch);
      console.log(`Imported ${i + batch.length} of ${properties.length} properties`);
    }

    console.log('Data import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

importData(); 