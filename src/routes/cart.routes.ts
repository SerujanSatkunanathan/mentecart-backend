import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All cart routes are protected
router.use(protect);

router.get('/', (req, res) => cartController.getCart(req, res));
router.post('/items', (req, res) => cartController.addItem(req, res));
router.patch('/items/:itemId', (req, res) => cartController.updateItem(req, res));
router.delete('/items/:itemId', (req, res) => cartController.removeItem(req, res));

export default router;
