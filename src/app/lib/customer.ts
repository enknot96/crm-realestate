import "server-only";

// DAL

import type { CustomerId, LineUserId, TagId } from "@/domain/shared/branded";
import * as customerService from "@/domain/customer/customerService";
import { drizzleCustomerRepository } from "@/infra/db/customerRepository";
import type { SessionPermit } from "./auth";

export const getCustomerById = (_permit: SessionPermit, id: CustomerId) =>
  customerService.getCustomerById(drizzleCustomerRepository, id);

export const createCustomer = (_permit: SessionPermit, input: unknown) =>
  customerService.createCustomer(drizzleCustomerRepository, input);

export const updateCustomer = (_permit: SessionPermit, id: CustomerId, input: unknown) =>
  customerService.updateCustomer(drizzleCustomerRepository, id, input);

export const removeCustomer = (_permit: SessionPermit, id: CustomerId) =>
  customerService.removeCustomer(drizzleCustomerRepository, id);

export const listPages = (
  _permit: SessionPermit,
  params: {
    query?: string;
    page: number;
    pageSize: number;
    sortOrder?: "asc" | "desc";
  },
) => customerService.listPages(drizzleCustomerRepository, params);

export const linkLineFriend = (
  _permit: SessionPermit,
  id: CustomerId,
  lineUserId: LineUserId,
) => customerService.linkLineFriend(drizzleCustomerRepository, id, lineUserId);

export const listAllForSelect = (_permit: SessionPermit) =>
  customerService.listAllForSelect(drizzleCustomerRepository);

export const markContacted = (_permit: SessionPermit, id: CustomerId) =>
  customerService.markContacted(drizzleCustomerRepository, id);

export const getTagIds = (_permit: SessionPermit, id: CustomerId) =>
  customerService.getTagIds(drizzleCustomerRepository, id);

export const setTags = (_permit: SessionPermit, id: CustomerId, tagIds: TagId[]) =>
  customerService.setTags(drizzleCustomerRepository, id, tagIds);

export const importCustomersFromCsv = (_permit: SessionPermit, content: string) =>
  customerService.importCustomersFromCsv(drizzleCustomerRepository, content);

export const exportCustomersToCsv = (_permit: SessionPermit) =>
  customerService.exportCustomersToCsv(drizzleCustomerRepository);
