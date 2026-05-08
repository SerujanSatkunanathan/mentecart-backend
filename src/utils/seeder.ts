import { UserModel } from '../models/User.model';
import { ServiceModel } from '../models/Service.model';
import { SlotModel } from '../models/Slot.model';
import { env } from '../config/env';

export const seedData = async () => {
  try {
    const userCount = await UserModel.countDocuments();
    
    // If not in development and data exists, don't seed
    if (userCount > 0 && env.NODE_ENV !== 'development') {
      console.log('✅ Database already seeded.');
      return;
    }

    // In development, clear data to ensure a fresh, rich seed
    if (env.NODE_ENV === 'development') {
      console.log('⚠️ Clearing existing data for fresh seed...');
      await UserModel.deleteMany({});
      await ServiceModel.deleteMany({});
      await SlotModel.deleteMany({});
    } else if (userCount > 0) {
      return; // Fallback safety
    }

    console.log('🌱 Seeding rich sample data...');

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

    for (let i = 1; i <= 3; i++) {
        await UserModel.create({
          name: `Test User ${i}`,
          email: `testuser${i}@mentecart.com`,
          password: 'password123',
          role: 'customer',
        });
    }

    // Seed Services
    const service1 = await ServiceModel.create({
      title: 'Career Mentoring',
      description: '1-on-1 career guidance and resume review.',
      price: 50,
      duration: 60,
      category: 'Mentoring',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      capacityPerSlot: 1,
    });

    const service2 = await ServiceModel.create({
      title: 'Mock Interview (Technical)',
      description: 'Technical and behavioral mock interview session for Software Engineers.',
      price: 100,
      duration: 90,
      category: 'Interview',
      imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80',
      capacityPerSlot: 1,
    });

    const service3 = await ServiceModel.create({
      title: 'Group Workshop: System Design',
      description: 'Interactive system design workshop for scalable applications.',
      price: 30,
      duration: 120,
      category: 'Workshop',
      imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
      capacityPerSlot: 10,
    });

    const service4 = await ServiceModel.create({
      title: 'Portfolio Review',
      description: 'Detailed review of your portfolio, GitHub, and personal website.',
      price: 40,
      duration: 45,
      category: 'Mentoring',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
      capacityPerSlot: 2,
    });

    // Seed Slots
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to avoid timezone weirdness in DB
    const slotsData = [];

    // Generate slots for the next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Morning slots for Service 1
      slotsData.push({
        serviceId: service1._id,
        date: date,
        startTime: '09:00',
        endTime: '10:00',
        capacity: service1.capacityPerSlot,
        booked: 0,
      });
      slotsData.push({
        serviceId: service1._id,
        date: date,
        startTime: '10:30',
        endTime: '11:30',
        capacity: service1.capacityPerSlot,
        booked: 0,
      });

      // Afternoon slots for Service 2
      slotsData.push({
        serviceId: service2._id,
        date: date,
        startTime: '13:00',
        endTime: '14:30',
        capacity: service2.capacityPerSlot,
        booked: 0,
      });
      slotsData.push({
        serviceId: service2._id,
        date: date,
        startTime: '15:00',
        endTime: '16:30',
        capacity: service2.capacityPerSlot,
        booked: 0,
      });

      // Group workshop in the evening (every other day)
      if (i % 2 === 0) {
        slotsData.push({
          serviceId: service3._id,
          date: date,
          startTime: '18:00',
          endTime: '20:00',
          capacity: service3.capacityPerSlot,
          booked: 0,
        });
      }

      // Portfolio review
      slotsData.push({
        serviceId: service4._id,
        date: date,
        startTime: '11:00',
        endTime: '11:45',
        capacity: service4.capacityPerSlot,
        booked: 0,
      });
    }

    await SlotModel.create(slotsData);

    console.log(`✅ Sample data seeded successfully (${slotsData.length} bookable slots added).`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};
