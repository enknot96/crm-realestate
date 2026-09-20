import { drizzleLineFriendRepository } from "@/infra/db/lineFriendRepository";
import "server-only";

import type { SessionPermit } from "./auth";

export const listUnlinkedLineFriends = (_permit: SessionPermit) =>
  drizzleLineFriendRepository.findUnlinked();
