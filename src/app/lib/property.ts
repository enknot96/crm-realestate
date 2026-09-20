import "server-only";

import { CustomerId, PropertyId } from "@/domain/shared/branded";
import * as propertyService from "@/domain/property/propertyService";
import { drizzlePropertyRepository } from "@/infra/db/propertyRepository";
import type { SessionPermit } from "./auth";

export const listPropertiesByCustomerId = (_permit: SessionPermit, customerId: CustomerId) =>
  propertyService.listPropertiesByCustomerId(drizzlePropertyRepository, customerId);

export const getPropertyById = (_permit: SessionPermit, id: PropertyId) =>
  propertyService.getPropertyById(drizzlePropertyRepository, id);

export const createProperty = (
  _permit: SessionPermit,
  customerId: CustomerId,
  input: unknown,
) => propertyService.createProperty(drizzlePropertyRepository, customerId, input);
