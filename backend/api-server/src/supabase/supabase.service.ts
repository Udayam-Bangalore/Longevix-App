import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  public readonly supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY must be configured');
    }

    this.logger.log(`Initializing Supabase client with URL: ${supabaseUrl}`);

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) => {
          const fetchOptions: RequestInit = {
            ...init,
            // @ts-ignore - signal timeout is supported in newer fetch implementations
            signal: init?.signal || AbortSignal.timeout(30000), // 30 second timeout
          };
          return fetch(url, fetchOptions);
        },
      },
    });
  }

  /**
   * Verify a JWT token and return the user
   */
  async verifyToken(token: string) {
    try {
      this.logger.debug('Verifying token...');
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        this.logger.error(`Token verification error: ${error.message}`);
        throw error;
      }

      this.logger.debug(
        `Token verified successfully for user: ${data.user?.id}`,
      );
      return data.user;
    } catch (error) {
      this.logger.error(`Failed to verify token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new user with email and password
   */
  async createUser(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { data, error };
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { data, error };
  }

  /**
   * Sign out a user
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }
}
