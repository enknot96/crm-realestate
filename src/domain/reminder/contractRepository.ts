import { ContractId, PropertyId } from "../shared/branded";
import { Result } from "../shared/result";

export type Contract = {
  id: ContractId;
  propertyId: PropertyId;
  contractDate: Date;
  createdAt: Date;
};

export interface ContractRepository {
  create(input: { propertyId: PropertyId; contractDate: Date }): Promise<Result<Contract, string>>;
  listByPropertyId(propertyId: PropertyId): Promise<Result<Contract[], string>>;
  // cronで全契約をチェックするために必要
  listAll(): Promise<Result<Contract[], string>>;
}
