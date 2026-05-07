import { UserModel } from '../models/User.model';
import { ServiceModel } from '../models/Service.model';
import { SlotModel } from '../models/Slot.model';

export const seedData = async () => {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount > 0) {
      console.log('✅ Database already seeded with users.');
      return;
    }

    console.log('🌱 Seeding sample data...');

    // Seed Users
    const adminUser = await UserModel.create({
      name: 'Admin User',
      email: 'admin@mentecart.com',
      password: 'password123',
      role: 'admin',
    });

    const customerUser = await UserModel.create({
      name: 'Sample Customer',
      email: 'customer@mentecart.com',
      password: 'password123',
      role: 'customer',
    });

    // Seed Services
    const service1 = await ServiceModel.create({
      title: 'Career Mentoring',
      description: '1-on-1 career guidance and resume review.',
      price: 50,
      duration: 60,
      category: 'Mentoring',
      imageUrl: 'https://via.placeholder.com/150',
      capacityPerSlot: 1,
    });

    const service2 = await ServiceModel.create({
      title: 'Mock Interview',
      description: 'Technical and behavioral mock interview session.',
      price: 100,
      duration: 90,
      category: 'Interview',
      imageUrl: 'https://via.placeholder.com/150',
      capacityPerSlot: 1,
    });

    // Seed Slots
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await SlotModel.create([
      {
        serviceId: service1._id,
        date: tomorrow,
        startTime: '10:00',
        endTime: '11:00',
        capacity: service1.capacityPerSlot,
        booked: 0,
      },
      {
        serviceId: service1._id,
        date: tomorrow,
        startTime: '11:00',
        endTime: '12:00',
        capacity: service1.capacityPerSlot,
        booked: 0,
      },
      {
        serviceId: service2._id,
        date: tomorrow,
        startTime: '14:00',
        endTime: '15:30',
        capacity: service2.capacityPerSlot,
        booked: 0,
      },
    ]);

    console.log('✅ Sample data seeded successfully.');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};
