import { supabase } from "@/integrations/supabase/client";
import type { ScanRepository, ScanWithSession, Scan } from "./types";
import type { TablesInsert } from "@/integrations/supabase/types";

export const supabaseScanRepository: ScanRepository = {
  async create(data: TablesInsert<"scans">): Promise<Scan> {
    const { data: scan, error } = await supabase
      .from("scans")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return scan;
  },

  async listRecent(limit: number): Promise<ScanWithSession[]> {
    const { data, error } = await supabase
      .from("scans")
      .select("id, url, status, score, created_at, session_id, scan_sessions(name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ScanWithSession[];
  },

  async listAll(limit: number): Promise<ScanWithSession[]> {
    const { data, error } = await supabase
      .from("scans")
      .select("id, url, status, score, created_at, session_id, scan_sessions(name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ScanWithSession[];
  },

  async getById(id: string): Promise<Scan | null> {
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  },
};
