import { db } from "@/lib/db"
import { hardware, models } from "@/lib/db/schema"

async function main() {
  await db.insert(hardware).values([
    {
      type: "GPU",
      architectureType: "discrete_gpu",
      brand: "NVIDIA",
      name: "RTX 4090",
      vramGb: 24,
      status: "approved",
    },
    {
      type: "GPU",
      architectureType: "discrete_gpu",
      brand: "NVIDIA",
      name: "RTX 3070",
      vramGb: 8,
      status: "approved",
    },
  ])

  await db.insert(models).values([
    {
      name: "Qwen3-7B",
      family: "Qwen",
      paramsBillion: 7,
      contextLength: 32768,
      hfId: "Qwen/Qwen3-7B",
      status: "approved",
    },
    {
      name: "Llama-3.1-8B",
      family: "Llama",
      paramsBillion: 8,
      contextLength: 8192,
      hfId: "meta-llama/Llama-3.1-8B",
      status: "approved",
    },
  ])

  console.log("Seed data inserted")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

