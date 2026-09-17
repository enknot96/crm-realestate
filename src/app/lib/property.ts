import "server-only";

import { CustomerId } from "@/domain/shared/branded";
import * as propertyService from "@/domain/property/propertyService";
import { drizzlePropertyRepository } from "@/infra/db/propertyRepository";

export const listPropertiesByCustomerId = (customerId: CustomerId) =>
  propertyService.listPropertiesByCustomerId(drizzlePropertyRepository, customerId);

export const createProperty = (customerId: CustomerId, input: unknown) =>
  propertyService.createProperty(drizzlePropertyRepository, customerId, input);
