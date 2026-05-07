import { serviceRepository } from '../repositories/service.repository';
import { SLOT_LOOKAHEAD_DAYS } from '../config/constants';
import { AppError, IService, ISlot, PaginatedResult } from '../types';

export class ServiceService {
  async listServices(options: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
  }): Promise<PaginatedResult<IService>> {
    return serviceRepository.findAll(options);
  }

  async getServiceWithSlots(serviceId: string): Promise<{ service: IService; slots: ISlot[] }> {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found.');
    }

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(now);
    toDate.setDate(toDate.getDate() + SLOT_LOOKAHEAD_DAYS);
    toDate.setHours(23, 59, 59, 999);

    const slots = await serviceRepository.findAvailableSlots(serviceId, fromDate, toDate);

    return { service, slots };
  }
}

export const serviceService = new ServiceService();
