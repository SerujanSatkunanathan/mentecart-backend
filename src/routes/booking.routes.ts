import { Router } from 'express';
import express from 'express';
import { bookingController } from '../controllers/booking.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected booking routes
router.post('/checkout', protect, (req, res) => bookingController.checkout(req, res));
router.get('/', protect, (req, res) => bookingController.list(req, res));
router.get('/:id', protect, (req, res) => bookingController.getById(req, res));
router.post('/:id/cancel', protect, (req, res) => bookingController.cancel(req, res));

// PayHere webhook — uses raw body parser, NOT JSON
router.post(
  '/webhooks/payhere',
  express.raw({ type: '*/*' }),
  (req, res) => bookingController.payHereWebhook(req, res)
);

export default router;
