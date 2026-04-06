import { supabase } from "@/integrations/supabase/client";
import type { SessionRepository, SessionRow, SessionSummary } from "./types";
import type { TablesInsert } from "@/integrations/supabase/types";

export const supabaseSessionRepository: SessionRepository = {
  async list(): Promise<SessionRow[]> {
    const { data, error } = await supabase
      .from("scan_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listSummary(): Promise<SessionSummary[]> {
    const { data, error } = await supabase
      .from("scan_sessions")
      .select("id, name, url_pattern, expires_at")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },

  async create(data: TablesInsert<"scan_sessions">): Promise<void> {
    const { error } = await supabase.from("scan_sessions").insert(data);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("scan_sessions").delete().eq("id", id);
    if (error) throw error;
  },
};
