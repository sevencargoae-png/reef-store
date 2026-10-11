import { prisma } from "@/lib/db";
export const listAddresses = (userId: string) => prisma.address.findMany({ where: { userId }, include: { area: true, emirate: true }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
