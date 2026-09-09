import { drizzleLineFriendRepository } from "@/infra/db/lineFriendRepository";
import "server-only";

export const listUnlinkedLineFriends = () => drizzleLineFriendRepository.findUnlinked();
