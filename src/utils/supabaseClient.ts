import {createClient} from "@supabase/supabase-js";
import {apiURL, apiKey} from "../environment.ts";
import type {Database} from "../types/database.ts";

export const supabase = createClient<Database>(apiURL, apiKey)