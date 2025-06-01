import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  id: string;
  title: string;
  type: string;
  price: number;
  state: string;
  city: string;
  areaSqFt: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  furnished: string;
  availableFrom: Date;
  listedBy: string;
  tags: string[];
  colorTheme: string;
  rating: number;
  isVerified: boolean;
  listingType: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  title: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  areaSqFt: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  amenities: [{ type: String }],
  furnished: { type: String, required: true },
  availableFrom: { type: Date, required: true },
  listedBy: { type: String, required: true },
  tags: [{ type: String }],
  colorTheme: { type: String },
  rating: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  listingType: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

// Create indexes for better search performance
PropertySchema.index({ id: 1 });
PropertySchema.index({ title: 'text', city: 'text', state: 'text' });
PropertySchema.index({ price: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ bedrooms: 1 });
PropertySchema.index({ bathrooms: 1 });
PropertySchema.index({ areaSqFt: 1 });

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema); 