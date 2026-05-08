import mongoose from 'mongoose';
import { BookingModel } from './src/models/Booking.model';
import { CartModel } from './src/models/Cart.model';
import { UserModel } from './src/models/User.model';
import { ServiceModel } from './src/models/Service.model';
import { SlotModel } from './src/models/Slot.model';
import { bookingService } from './src/services/booking.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentecart');
  
  const user = await UserModel.findOne({ role: 'customer' });
  if (!user) {
    console.log('No user');
    process.exit(1);
  }

  const service = await ServiceModel.findOne();
  const slot = await SlotModel.findOne({ serviceId: service!._id });

  let cart = await CartModel.findOne({ userId: user._id });
  if (!cart) {
    cart = await CartModel.create({ userId: user._id, items: [] });
  }

  cart.items.push({
    serviceId: service!._id,
    slotId: slot!._id,
    price: service!.price,
    expiresAt: new Date(Date.now() + 1000 * 60 * 15)
  });
  await cart.save();

  try {
    console.log('Attempting checkout with cash...');
    const result = await bookingService.checkout(user._id.toString(), 'cash');
    console.log('Success:', result);
  } catch (err: any) {
    console.error('Checkout failed:', err);
    if (err.errors) console.error('Validation errors:', err.errors);
  }

  process.exit(0);
}

test();
