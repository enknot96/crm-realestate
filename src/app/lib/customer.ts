import "server-only";

// DAL

import type { CustomerId } from "@/domain/shared/branded";
import * as customerService from "@/domain/customer/customerService";
import { drizzleCustomerRepository } from "@/infra/db/customerRepository";

export const getCustomerById = (id: CustomerId) =>
  customerService.getCustomerById(drizzleCustomerRepository, id);

export const createCustomer = (input: unknown) =>
  customerService.createCustomer(drizzleCustomerRepository, input);

export const updateCustomer = (id: CustomerId, input: unknown) =>
  customerService.updateCustomer(drizzleCustomerRepository, id, input);

export const removeCustomer = (id: CustomerId) =>
  customerService.removeCustomer(drizzleCustomerRepository, id);

export const listPages = (params: { query?: string; page: number; pageSize: number }) =>
  customerService.listPages(drizzleCustomerRepository, params);
