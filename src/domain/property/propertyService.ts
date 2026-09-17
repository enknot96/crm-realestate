import { z } from "zod";
import { CustomerId } from "../shared/branded";
import { Property, PropertyRepository } from "./repository";
import { propertyFormSchema } from "./schema";
import { err, Result } from "../shared/result";

type ValidationError = { kind: "validation"; fieldErrors: Record<string, string[]> };
type RepositoryError = { kind: "repository"; message: string };
export type PropertyServiceError = ValidationError | RepositoryError;

export async function listPropertiesByCustomerId(repo: PropertyRepository, customerId: CustomerId) {
  return repo.listByCustomerId(customerId);
}

export async function createProperty(
  repo: PropertyRepository,
  customerId: CustomerId,
  input: unknown,
): Promise<Result<Property, PropertyServiceError>> {
  // zodスキーマでパース
  const parsed = propertyFormSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return err({ kind: "validation", fieldErrors: flat.fieldErrors });
  }
  const result = await repo.create({ customerId, ...parsed.data });
  if (result.kind === "err") {
    return err({ kind: "repository", message: result.error });
  }
  return result;
}
