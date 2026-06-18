import { Service, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';
import { ToastService } from '../../shared/ui/toast/toast';

@Service()
export class PushNotificationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly supabase = inject(SupabaseService);
  private readonly toastService = inject(ToastService);

  private firebaseApp: FirebaseApp | null = null;
  private messaging: Messaging | null = null;

  private readonly _permissionGranted = signal(false);
  private readonly _token = signal<string | null>(null);

  readonly permissionGranted = this._permissionGranted.asReadonly();
  readonly token = this._token.asReadonly();

  constructor() {
    if (this.isBrowser) {
      this.initFirebase();
    }
  }

  private initFirebase(): void {
    try {
      this.firebaseApp = initializeApp(environment.firebase);
      this.messaging = getMessaging(this.firebaseApp);

      // Listen for foreground messages
      onMessage(this.messaging, (payload) => {
        const title = payload.notification?.title || 'Notification';
        const body = payload.notification?.body || '';
        this.toastService.info(`${title}: ${body}`);
      });
    } catch (e) {
      console.error('Failed to initialize Firebase Messaging:', e);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isBrowser || !this.messaging) return false;

    try {
      const permission = await Notification.requestPermission();
      this._permissionGranted.set(permission === 'granted');

      if (permission === 'granted') {
        await this.retrieveToken();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async retrieveToken(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      const token = await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey,
      });

      this._token.set(token);
      return token;
    } catch (e) {
      console.error('Failed to retrieve FCM token:', e);
      return null;
    }
  }

  async registerToken(userId: string): Promise<void> {
    const token = this._token();
    if (!token) return;

    try {
      await this.supabase.client.from('device_tokens').upsert(
        {
          user_id: userId,
          token,
          platform: 'web',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );
    } catch (e) {
      console.error('Failed to register FCM token:', e);
    }
  }

  async unregisterToken(): Promise<void> {
    const token = this._token();
    if (!token) return;

    try {
      await this.supabase.client
        .from('device_tokens')
        .delete()
        .eq('token', token);
      this._token.set(null);
    } catch (e) {
      console.error('Failed to unregister FCM token:', e);
    }
  }
}
