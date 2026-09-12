import "server-only";

// DAL

import type { CustomerId, LineUserId, TagId } from "@/domain/shared/branded";
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

export const listPages = (params: {
  query?: string;
  page: number;
  pageSize: number;
  sortOrder?: "asc" | "desc";
}) => customerService.listPages(drizzleCustomerRepository, params);

export const linkLineFriend = (id: CustomerId, lineUserId: LineUserId) =>
  customerService.linkLineFriend(drizzleCustomerRepository, id, lineUserId);

export const listAllForSelect = () => customerService.listAllForSelect(drizzleCustomerRepository);

export const markContacted = (id: CustomerId) =>
  customerService.markContacted(drizzleCustomerRepository, id);

export const getTagIds = (id: CustomerId) =>
  customerService.getTagIds(drizzleCustomerRepository, id);

export const setTags = (id: CustomerId, tagIds: TagId[]) =>
  customerService.setTags(drizzleCustomerRepository, id, tagIds);
