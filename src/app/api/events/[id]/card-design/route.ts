import { NextResponse, type NextRequest } from "next/server";
import { ApiError, handler, parseBody, requireUser } from "@/lib/api";
import { DEFAULT_CARD_DESIGN } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { cardDesignSchema } from "@/lib/schemas";

type Ctx = RouteContext<"/api/events/[id]/card-design">;

export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const design = await prisma.cardDesign.findUnique({ where: { userId_eventId: { userId: user.id, eventId: id } } });
  if (!design) return NextResponse.json({ design: DEFAULT_CARD_DESIGN, saved: false });

  // Re-validate what is stored so a bad row can never break the UI.
  const parsed = cardDesignSchema.safeParse({ theme: design.theme, stickers: JSON.parse(design.stickers) });
  return NextResponse.json({ design: parsed.success ? parsed.data : DEFAULT_CARD_DESIGN, saved: true });
});

export const PUT = handler(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const design = await parseBody(req, cardDesignSchema);

  const event = await prisma.event.findUnique({ where: { id }, select: { isActive: true } });
  if (!event || !event.isActive) throw new ApiError(404, "Event not found");

  const data = { theme: design.theme, stickers: JSON.stringify(design.stickers) };
  await prisma.cardDesign.upsert({
    where: { userId_eventId: { userId: user.id, eventId: id } },
    update: data,
    create: { userId: user.id, eventId: id, ...data },
  });
  return NextResponse.json({ design, saved: true });
});
