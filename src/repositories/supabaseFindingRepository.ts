import { supabase } from "@/integrations/supabase/client";
import type { FindingRepository, FindingRow } from "./types";

export const supabaseFindingRepository: FindingRepository = {
  async listByScan(scanId: string): Promise<FindingRow[]> {
    const { data, error } = await supabase
      .from("findings")
      .select("*")
      .eq("scan_id", scanId)
      .order("severity");
    if (error) throw error;
    return data ?? [];
  },
};
