import "server-only";

import { CustomerId, PropertyId } from "@/domain/shared/branded";
import * as propertyService from "@/domain/property/propertyService";
import { drizzlePropertyRepository } from "@/infra/db/propertyRepository";

export const listPropertiesByCustomerId = (customerId: CustomerId) =>
  propertyService.listPropertiesByCustomerId(drizzlePropertyRepository, customerId);

export const getPropertyById = (id: PropertyId) =>
  propertyService.getPropertyById(drizzlePropertyRepository, id);

export const createProperty = (customerId: CustomerId, input: unknown) =>
  propertyService.createProperty(drizzlePropertyRepository, customerId, input);
