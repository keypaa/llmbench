import { integer, jsonb, pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core"

const benchmarkStatusEnum = pgEnum("benchmark_status", ["pending", "verified", "rejected", "flagged"])
const hardwareStatusEnum = pgEnum("hardware_status", ["pending", "approved"])
const modelStatusEnum = pgEnum("model_status", ["pending", "approved"])

export const hardware = pgTable("hardware", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  architectureType: text("architecture_type").notNull(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  vramGb: integer("vram_gb"),
  ramGb: integer("ram_gb"),
  memoryBandwidthGbps: real("memory_bandwidth_gbps"),
  tdpWatts: integer("tdp_watts"),
  releaseYear: integer("release_year"),
  status: hardwareStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const models = pgTable("models", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  family: text("family").notNull(),
  paramsBillion: real("params_billion").notNull(),
  contextLength: integer("context_length"),
  hfId: text("hf_id"),
  hfDownloads: integer("hf_downloads"),
  hfLikes: integer("hf_likes"),
  hfTags: text("hf_tags").array(),
  hfPipelineTag: text("hf_pipeline_tag"),
  status: modelStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const benchmarks = pgTable("benchmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  hardwareId: uuid("hardware_id").notNull(),
  systemRamGb: integer("system_ram_gb"),
  hardwareNotes: text("hardware_notes"),
  modelId: uuid("model_id").notNull(),
  quantization: text("quantization"),
  quantBits: real("quant_bits"),
  quantFormat: text("quant_format"),
  engine: text("engine").notNull(),
  engineVersion: text("engine_version"),
  engineParams: jsonb("engine_params"),
  tokensPerSecond: real("tokens_per_second").notNull(),
  promptTokensPerSecond: real("prompt_tokens_per_second"),
  timeToFirstTokenMs: real("time_to_first_token_ms"),
  parallelRequests: integer("parallel_requests").default(1),
  contextSize: integer("context_size"),
  os: text("os"),
  driverVersion: text("driver_version"),
  status: benchmarkStatusEnum("status").notNull().default("pending"),
  upvotes: integer("upvotes").notNull().default(0),
  sourceUrl: text("source_url"),
  notes: text("notes"),
  importSource: text("import_source"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const benchmarkUpvotes = pgTable("benchmark_upvotes", {
  userId: text("user_id").notNull(),
  benchmarkId: uuid("benchmark_id").notNull(),
})

export const communityNotes = pgTable("community_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  benchmarkId: uuid("benchmark_id").notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  pinned: integer("pinned").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
})

export const reputationEvents = pgTable("reputation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  eventType: text("event_type").notNull(),
  points: integer("points").notNull(),
  referenceId: uuid("reference_id"),
  createdAt: timestamp("created_at").defaultNow(),
})

