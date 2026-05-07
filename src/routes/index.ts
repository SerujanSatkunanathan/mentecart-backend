import { Router } from 'express';
import authRoutes from './auth.routes';
import serviceRoutes from './service.routes';
import cartRoutes from './cart.routes';
import bookingRoutes from './booking.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/cart', cartRoutes);
router.use('/bookings', bookingRoutes);

export default router;
