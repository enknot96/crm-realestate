import { z } from "zod";
import { ContractId, PropertyId } from "../shared/branded";
import { Contract, ContractRepository } from "./contractRepository";
import { contractFormSchema } from "./schema";
import { calculateNextBiweeklyReportDate, calculateNextQuarterlyRenewalDate } from "./reminderDate";
import { err, ok, Result } from "../shared/result";

type ValidationError = { kind: "validation"; fieldErrors: Record<string, string[]> };
type RepositoryError = { kind: "repository"; message: string };
type DuplicatePropertyError = { kind: "duplicateProperty" };
export type ContractServiceError = ValidationError | RepositoryError | DuplicatePropertyError;

export async function createContract(
  repo: ContractRepository,
  propertyId: PropertyId,
  input: unknown,
): Promise<Result<Contract, ContractServiceError>> {
  const parsed = contractFormSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return err({ kind: "validation", fieldErrors: flat.fieldErrors });
  }
  const result = await repo.create({ propertyId, contractDate: parsed.data.contractDate });
  if (result.kind === "err") {
    return err(result.error);
  }
  return result;
}

export async function removeContract(repo: ContractRepository, id: ContractId) {
  return repo.remove(id);
}

export type ContractWithNextDates = Contract & {
  nextBiweeklyReportDate: Date;
  nextQuarterlyRenewalDate: Date;
};

// 画面表示用: 各契約に「次回の巡回報告期限」「次回の更新時期」を付加する
function withNextDates(contract: Contract, now: Date): ContractWithNextDates {
  return {
    ...contract,
    nextBiweeklyReportDate: calculateNextBiweeklyReportDate(contract.contractDate, now),
    nextQuarterlyRenewalDate: calculateNextQuarterlyRenewalDate(contract.contractDate, now),
  };
}

export async function listContractsByPropertyId(
  repo: ContractRepository,
  propertyId: PropertyId,
  now: Date,
): Promise<Result<ContractWithNextDates[], string>> {
  const result = await repo.listByPropertyId(propertyId);
  if (result.kind === "err") {
    return result;
  }
  return ok(result.value.map((contract) => withNextDates(contract, now)));
}
