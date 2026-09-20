import "server-only";

import { PropertyId, ReportId } from "@/domain/shared/branded";
import { ChecklistResult } from "@/domain/report/checklistItems";
import {
  createPatrolReport as createPatrolReportUseCase,
  PhotoInput,
} from "@/domain/report/createPatrolReport";
import { approveAndSendPatrolReport as approveAndSendPatrolReportUseCase } from "@/domain/report/approveAndSendPatrolReport";
import { drizzlePatrolReportRepository } from "@/infra/db/patrolReportRepository";
import { drizzlePatrolReportSendRepository } from "@/infra/db/patrolReportSendRepository";
import { drizzleMessageLogRepository } from "@/infra/db/messageLogRepository";
import { drizzlePropertyRepository } from "@/infra/db/propertyRepository";
import { drizzleCustomerRepository } from "@/infra/db/customerRepository";
import { createR2PhotoStorage } from "@/infra/storage/r2PhotoStorage";
import { createAiReportPolisher } from "@/infra/ai/aiReportPolisher";
import { createFakeTextPolisher } from "@/infra/fake/fakeTextPolisher";
import { createLinePatrolReportSenderFromAccessToken } from "@/infra/line/linePatrolReportSender";
import { createFakePatrolReportMessageSender } from "@/infra/fake/fakePatrolReportMessageSender";
import { createSignedImageUrl } from "@/infra/storage/signedImageUrl";
import { stripExif } from "@/infra/storage/exif";
import { err, Result } from "@/domain/shared/result";
import { ApproveAndSendError } from "@/domain/report/approveAndSendPatrolReport";
import { env } from "@/config/env";
import type { SessionPermit } from "./auth";

// DEMO_MODEでも常にR2を使う
const photoStorage = createR2PhotoStorage({
  accountId: env.R2_ACCOUNT_ID,
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  bucketName: env.R2_BUCKET_NAME,
});

const textPolisher = env.DEMO_MODE
  ? createFakeTextPolisher()
  : createAiReportPolisher(env.GOOGLE_GENERATIVE_AI_API_KEY);

const patrolReportMessageSender = env.DEMO_MODE
  ? createFakePatrolReportMessageSender()
  : createLinePatrolReportSenderFromAccessToken(env.LINE_CHANNEL_ACCESS_TOKEN);

export const createPatrolReport = (
  _permit: SessionPermit,
  propertyId: PropertyId,
  checklistResults: ChecklistResult[],
  photos: PhotoInput[],
) =>
  createPatrolReportUseCase(
    { photoStorage, stripExif, patrolReportRepo: drizzlePatrolReportRepository, textPolisher },
    propertyId,
    checklistResults,
    photos,
  );

export const getPatrolReportById = (_permit: SessionPermit, id: ReportId) =>
  drizzlePatrolReportRepository.findById(id);

export const listPatrolReportsByPropertyId = (_permit: SessionPermit, propertyId: PropertyId) =>
  drizzlePatrolReportRepository.listByPropertyId(propertyId);

export const updatePatrolReportBody = (_permit: SessionPermit, id: ReportId, body: string) =>
  drizzlePatrolReportRepository.updateBody(id, body, "human");

export const downloadPatrolReportPhoto = (_permit: SessionPermit, key: string) =>
  photoStorage.download(key);

export const removePatrolReport = (_permit: SessionPermit, id: ReportId) =>
  drizzlePatrolReportRepository.remove(id);

export type ApproveAndSendActionError = ApproveAndSendError | { kind: "notFound" };

export const approveAndSendPatrolReport = async (
  _permit: SessionPermit,
  reportId: ReportId,
): Promise<Result<void, ApproveAndSendActionError>> => {
  const reportResult = await drizzlePatrolReportRepository.findById(reportId);
  if (reportResult.kind === "err") {
    return err({ kind: "repository", message: reportResult.error });
  }
  if (reportResult.value === null) {
    return err({ kind: "notFound" });
  }
  const report = reportResult.value;

  const propertyResult = await drizzlePropertyRepository.findById(report.propertyId);
  if (propertyResult.kind === "err") {
    return err({ kind: "repository", message: propertyResult.error });
  }
  if (propertyResult.value === null) {
    return err({ kind: "notFound" });
  }

  const customerResult = await drizzleCustomerRepository.findById(propertyResult.value.customerId);
  if (customerResult.kind === "err") {
    return err({ kind: "repository", message: customerResult.error });
  }
  const lineUserId = customerResult.value?.lineUserId ?? null;

  return approveAndSendPatrolReportUseCase(
    {
      patrolReportRepo: drizzlePatrolReportRepository,
      patrolReportSendRepo: drizzlePatrolReportSendRepository,
      messageLogRepo: drizzleMessageLogRepository,
      messageSender: patrolReportMessageSender,
      buildPhotoUrl: (key) =>
        createSignedImageUrl(env.IMAGE_DELIVERY_BASE_URL, env.IMAGE_SIGNING_SECRET, key, 300),
    },
    report,
    lineUserId,
    new Date(),
    env.MONTHLY_MESSAGE_QUOTA,
  );
};
