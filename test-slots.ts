import mongoose from 'mongoose';
import { SlotModel } from './src/models/Slot.model';
import { ServiceModel } from './src/models/Service.model';
import { SLOT_LOOKAHEAD_DAYS } from './src/config/constants';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentecart');
  
  const service = await ServiceModel.findOne();
  if (!service) {
    console.log('No services found');
    process.exit(0);
  }
  console.log('Service ID:', service._id);

  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + SLOT_LOOKAHEAD_DAYS);
  toDate.setHours(23, 59, 59, 999);

  console.log('From:', fromDate);
  console.log('To:', toDate);

  const queryParams = {
    serviceId: service._id.toString(), // as string
    date: { $gte: fromDate, $lte: toDate },
    $expr: { $lt: ['$booked', '$capacity'] }
  };
  
  console.log('Query:', JSON.stringify(queryParams, null, 2));

  try {
    const slots = await SlotModel.find(queryParams).sort({ date: 1, startTime: 1 }).lean();
    console.log('Available slots found:', slots.length);
    if (slots.length === 0) {
      const allSlots = await SlotModel.find({ serviceId: service._id });
      console.log('Total slots for this service:', allSlots.length);
      if (allSlots.length > 0) {
        console.log('First slot details:', allSlots[0]);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }

  process.exit(0);
}

test();
