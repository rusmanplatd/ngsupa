import { Service, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Service()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabase.url, environment.supabase.key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        experimental: {
          passkey: true,
        } as any,
      },
    });
  }
}
