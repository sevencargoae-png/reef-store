import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  orderId: z.string().nullable().optional(),
});

export const POST = handler(async (req) => {
  const b = await parseBody(req, schema);
  const complaint = await prisma.complaint.create({ data: { ...b, status: "OPEN" } });
  return ok(complaint, { status: 201 });
});
