import "server-only";

import { PropertyId, ReportId } from "@/domain/shared/branded";
import { ChecklistResult } from "@/domain/report/checklistItems";
import {
  createPatrolReport as createPatrolReportUseCase,
  PhotoInput,
} from "@/domain/report/createPatrolReport";
import { drizzlePatrolReportRepository } from "@/infra/db/patrolReportRepository";
import { createR2PhotoStorage } from "@/infra/storage/r2PhotoStorage";
import { createFakePhotoStorage } from "@/infra/fake/fakePhotoStorage";
import { createAiReportPolisher } from "@/infra/ai/aiReportPolisher";
import { createFakeTextPolisher } from "@/infra/fake/fakeTextPolisher";
import { stripExif } from "@/infra/storage/exif";
import { env } from "@/config/env";

// DEMO_MODEに応じて実装を切り替える
// src/domain側には if (DEMO_MODE) を書かない
const photoStorage = env.DEMO_MODE
  ? createFakePhotoStorage()
  : createR2PhotoStorage({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
    });

const textPolisher = env.DEMO_MODE
  ? createFakeTextPolisher()
  : createAiReportPolisher(env.GOOGLE_GENERATIVE_AI_API_KEY);

export const createPatrolReport = (
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

export const getPatrolReportById = (id: ReportId) => drizzlePatrolReportRepository.findById(id);

export const listPatrolReportsByPropertyId = (propertyId: PropertyId) =>
  drizzlePatrolReportRepository.listByPropertyId(propertyId);

export const updatePatrolReportBody = (id: ReportId, body: string) =>
  drizzlePatrolReportRepository.updateBody(id, body, "human");
