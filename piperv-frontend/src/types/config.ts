export interface SimulatorConfig {
  forwarding_enabled: boolean;
  IF_latency: number;
  ID_latency: number;
  EX_latency: number;
  MEM_latency: number;
  WB_latency: number;
  cache_enabled: boolean;
  L1_cache_size: number;
  L1_block_size: number;
  L1_miss_penalty: number;
}
