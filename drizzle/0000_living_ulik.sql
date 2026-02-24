CREATE TABLE "benchmark_upvotes" (
	"user_id" text NOT NULL,
	"benchmark_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"hardware_id" uuid NOT NULL,
	"system_ram_gb" integer,
	"hardware_notes" text,
	"model_id" uuid NOT NULL,
	"quantization" text,
	"quant_bits" real,
	"quant_format" text,
	"engine" text NOT NULL,
	"engine_version" text,
	"engine_params" jsonb,
	"tokens_per_second" real NOT NULL,
	"prompt_tokens_per_second" real,
	"time_to_first_token_ms" real,
	"parallel_requests" integer DEFAULT 1,
	"context_size" integer,
	"os" text,
	"driver_version" text,
	"status" "benchmark_status" DEFAULT 'pending' NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"source_url" text,
	"notes" text,
	"import_source" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"benchmark_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"pinned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hardware" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"architecture_type" text NOT NULL,
	"brand" text NOT NULL,
	"name" text NOT NULL,
	"vram_gb" integer,
	"ram_gb" integer,
	"memory_bandwidth_gbps" real,
	"tdp_watts" integer,
	"release_year" integer,
	"status" "hardware_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"family" text NOT NULL,
	"params_billion" real NOT NULL,
	"context_length" integer,
	"hf_id" text,
	"hf_downloads" integer,
	"hf_likes" integer,
	"hf_tags" text[],
	"hf_pipeline_tag" text,
	"status" "model_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reputation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"points" integer NOT NULL,
	"reference_id" uuid,
	"created_at" timestamp DEFAULT now()
);
