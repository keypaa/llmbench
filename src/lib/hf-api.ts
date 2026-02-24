export interface HuggingFaceModelMetadata {
  id: string
  downloads: number
  likes: number
  pipeline_tag?: string
  tags?: string[]
}

const HF_BASE_URL = "https://huggingface.co/api"

export async function fetchHuggingFaceModel(
  hfId: string,
  token?: string,
): Promise<HuggingFaceModelMetadata | null> {
  const response = await fetch(`${HF_BASE_URL}/models/${hfId}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    next: {
      revalidate: 60 * 60,
    },
  })

  if (!response.ok) {
    return null
  }

  const json = (await response.json()) as {
    id?: string
    downloads?: number
    likes?: number
    pipeline_tag?: string
    tags?: string[]
  }

  return {
    id: json.id,
    downloads: json.downloads ?? 0,
    likes: json.likes ?? 0,
    pipeline_tag: json.pipeline_tag,
    tags: Array.isArray(json.tags) ? json.tags : [],
  }
}

