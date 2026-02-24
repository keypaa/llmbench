import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { models } from "@/lib/db/schema"
import { fetchHuggingFaceModel } from "@/lib/hf-api"

export async function GET() {
  const token = process.env.HUGGINGFACE_TOKEN

  const existingModels = await db
    .select({
      id: models.id,
      hfId: models.hfId,
    })
    .from(models)

  let updatedCount = 0

  for (const model of existingModels) {
    if (!model.hfId) {
      continue
    }

    const metadata = await fetchHuggingFaceModel(model.hfId, token)
    if (!metadata) {
      continue
    }

    await db
      .update(models)
      .set({
        hfDownloads: metadata.downloads,
        hfLikes: metadata.likes,
      })
      .where(models.id.eq(model.id))

    updatedCount += 1
  }

  return NextResponse.json({ updated: updatedCount })
}

