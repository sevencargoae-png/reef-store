import bcrypt from "bcryptjs";
export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash);
/** bcrypt hash nobody knows the input for: compared against when the account is unknown so timing does not leak existence. */
export const DUMMY_HASH = "$2b$12$smjL68/wusdFY1eeZlr4MOwwOpkrlu0MmunrQSbRRJKWeraHUxGn.";
