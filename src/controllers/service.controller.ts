import { Request, Response } from 'express';
import { serviceService } from '../services/service.service';
import { listServicesSchema, serviceIdParamSchema } from '../validators/service.validator';

/**
 * Service controller — HTTP parsing only. Zero business logic.
 */
export class ServiceController {
  async list(req: Request, res: Response): Promise<void> {
    const query = listServicesSchema.parse(req.query);
    const result = await serviceService.listServices(query);
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = serviceIdParamSchema.parse(req.params);
    const result = await serviceService.getServiceWithSlots(id);
    res.status(200).json(result);
  }
}

export const serviceController = new ServiceController();
