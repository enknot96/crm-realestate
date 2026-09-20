import "server-only";

import { TagId } from "@/domain/shared/branded";
import * as tagService from "@/domain/tag/tagService";
import { drizzleTagRepository } from "@/infra/db/tagRepository";
import type { SessionPermit } from "./auth";

export const listTags = (_permit: SessionPermit) => tagService.listTags(drizzleTagRepository);

export const createTag = (_permit: SessionPermit, name: string) =>
  tagService.createTag(drizzleTagRepository, name);

export const removeTag = (_permit: SessionPermit, id: TagId) =>
  tagService.removeTag(drizzleTagRepository, id);
