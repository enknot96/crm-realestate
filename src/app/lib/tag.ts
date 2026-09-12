import "server-only";

import { TagId } from "@/domain/shared/branded";
import * as tagService from "@/domain/tag/tagService";
import { drizzleTagRepository } from "@/infra/db/tagRepository";

export const listTags = () => tagService.listTags(drizzleTagRepository);

export const createTag = (name: string) => tagService.createTag(drizzleTagRepository, name);

export const removeTag = (id: TagId) => tagService.removeTag(drizzleTagRepository, id);
