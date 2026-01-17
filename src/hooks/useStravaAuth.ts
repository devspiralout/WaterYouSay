import { useCallback, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { saveStravaTokens, clearStravaTokens, StravaTokens } from '../utils/strava';

// Register the web browser for auth session
WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || '';

// Strava OAuth endpoints
const discovery = {
  authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
  tokenEndpoint: 'https://www.strava.com/oauth/token',
  revocationEndpoint: 'https://www.strava.com/oauth/deauthorize',
};

export interface UseStravaAuthResult {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useStravaAuth(
  onConnect?: () => void,
  onDisconnect?: () => void
): UseStravaAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strava requires a web-based redirect URI
  // This GitHub Pages redirect bounces back to the app with the auth code
  const redirectUri = 'https://devspiralout.github.io/WaterYouSay/strava-callback/';

  // Debug: log the redirect URI
  console.log('Strava OAuth redirect URI:', redirectUri);

  // Create the auth request
  // Note: Strava uses comma-separated scopes and doesn't support PKCE
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: STRAVA_CLIENT_ID,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false,
      extraParams: {
        scope: 'read,activity:read',
      },
    },
    discovery
  );

  const connect = useCallback(async (): Promise<boolean> => {
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      setError('Strava credentials not configured');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prompt for Strava authorization
      const result = await promptAsync();
      console.log('Strava auth result:', result);

      if (result.type === 'success' && result.params.code) {
        // Exchange code for tokens
        const tokenResponse = await fetch(discovery.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code: result.params.code,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const data = await tokenResponse.json();

        const tokens: StravaTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_at,
        };

        await saveStravaTokens(tokens);
        onConnect?.();
        setIsLoading(false);
        return true;
      } else if (result.type === 'cancel') {
        setError('Authorization cancelled');
      } else if (result.type === 'error') {
        setError(result.error?.message || 'Authorization failed');
      }

      setIsLoading(false);
      return false;
    } catch (err) {
      console.error('Strava auth error:', err);
      setError(err instanceof Error ? err.message : 'Authorization failed');
      setIsLoading(false);
      return false;
    }
  }, [promptAsync, onConnect]);

  const disconnect = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await clearStravaTokens();
      onDisconnect?.();
    } catch (err) {
      console.error('Error disconnecting Strava:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  }, [onDisconnect]);

  return {
    connect,
    disconnect,
    isLoading,
    error,
  };
}

// Export credentials for use in other modules
export const getStravaCredentials = () => ({
  clientId: STRAVA_CLIENT_ID,
  clientSecret: STRAVA_CLIENT_SECRET,
});
