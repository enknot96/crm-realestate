import { ContractId, PropertyId } from "../shared/branded";
import { Result } from "../shared/result";

export type Contract = {
  id: ContractId;
  propertyId: PropertyId;
  contractDate: Date;
  createdAt: Date;
};

// property_idのDB一意制約により、既に契約がある物件へのcreateは"duplicateProperty"を返す
export type CreateContractError = { kind: "duplicateProperty" } | { kind: "repository"; message: string };

export interface ContractRepository {
  create(input: {
    propertyId: PropertyId;
    contractDate: Date;
  }): Promise<Result<Contract, CreateContractError>>;
  listByPropertyId(propertyId: PropertyId): Promise<Result<Contract[], string>>;
  // cronで全契約をチェックするために必要
  listAll(): Promise<Result<Contract[], string>>;
  remove(id: ContractId): Promise<Result<void, string>>;
}
