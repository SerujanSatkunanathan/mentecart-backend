import { Router } from 'express';
import { serviceController } from '../controllers/service.controller';

const router = Router();

router.get('/', (req, res) => serviceController.list(req, res));
router.get('/:id', (req, res) => serviceController.getById(req, res));

export default router;
