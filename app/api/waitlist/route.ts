import { NextResponse } from 'next/server'
import { z } from 'zod'
import { applyPlatformCommand } from '@/lib/rsse/applyPlatformCommand'
import { getRssePersistence } from '@/lib/rsse/persistence/factory'
import { mapRsseError } from '@/lib/rsse/apiErrors'

const bodySchema = z.object({
  email: z
    .string()
    .min(3)
    .max(200)
    .refine((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), 'Invalid email'),
  sessionId: z.string().uuid().optional(),
  experienceTypeId: z.string().optional(),
  category: z.string().max(80).optional(),
  source: z.string().max(80).optional(),
  interest: z.string().max(200).optional(),
  groupSize: z.number().int().min(1).max(50).optional(),
  idempotencyKey: z.string().min(8).max(200).optional(),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 },
      )
    }
    const d = parsed.data
    const idem = d.idempotencyKey ?? `waitlist:${d.email}:${d.sessionId ?? 'global'}`

    if (d.sessionId) {
      await applyPlatformCommand({
        type: 'EMIT_EXPERIENCE_EVENT',
        sessionId: d.sessionId,
        idempotencyKey: idem,
        payload: {
          recordWaitlist: true,
          email: d.email,
          category: d.category,
          source: d.source,
          interest: d.interest,
          groupSize: d.groupSize,
        },
      })
      return NextResponse.json({ ok: true, tracked: 'session' })
    }

    const id = crypto.randomUUID()
    await getRssePersistence().insertWaitlistGlobal({
      id,
      email: d.email,
      sessionId: null,
      experienceTypeId: d.experienceTypeId ?? null,
      category: d.category ?? null,
      source: d.source ?? null,
      interest: d.interest ?? null,
      groupSize: d.groupSize ?? null,
      createdAt: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, tracked: 'global' })
  } catch (e) {
    return mapRsseError(e)
  }
}
