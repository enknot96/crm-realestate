import { CustomerId, PropertyId } from "../shared/branded";
import { Result } from "../shared/result";

export type Property = {
  id: PropertyId;
  customerId: CustomerId;
  name: string;
  address: string | null;
  structureType: string | null;
  floors: number | null;
  createdAt: Date;
};

export type CreatePropertyInput = {
  customerId: CustomerId;
  name: string;
  address?: string;
  structureType?: string;
  floors?: number;
};

export interface PropertyRepository {
  listByCustomerId(customerId: CustomerId): Promise<Result<Property[], string>>;
  create(input: CreatePropertyInput): Promise<Result<Property, string>>;
}
