import { z } from "zod";
import { fromJstYmd } from "./reminderDate";

// <input type="date">が送ってくる"YYYY-MM-DD"形式のみ受け付ける
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const contractFormSchema = z.object({
  contractDate: z
    .string()
    .regex(DATE_ONLY_PATTERN, "契約日はYYYY-MM-DD形式で入力してください")
    .transform((value) => {
      // new Date("2026-09-01")はUTC0時として解釈されてしまい、JSTでは9時になってしまうため、
      // reminderDate.tsの計算前提(契約日=JSTの0時)に合わせてfromJstYmdで組み立て直す
      const match = DATE_ONLY_PATTERN.exec(value) as RegExpExecArray;
      const [, year, month, day] = match;
      return fromJstYmd(Number(year), Number(month) - 1, Number(day));
    }),
});

export type ContractFormInput = z.infer<typeof contractFormSchema>;
