import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * SecretManager provides a unified way to retrieve configuration secrets.  It
 * attempts to fetch secrets from AWS Secrets Manager when a `AWS_SECRET_ID`
 * environment variable is set, otherwise falls back to environment variables
 * directly.  If both are unavailable, an empty string is returned.
 */
class SecretManager {
  private client: SecretsManagerClient | null;
  private cache: Map<string, string>;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    try {
      this.client = new SecretsManagerClient({ region });
    } catch (error) {
      console.warn('AWS Secrets Manager client could not be initialized:', error);
      this.client = null;
    }
    this.cache = new Map();
  }

  /**
   * Retrieve a secret by name.  First checks the cache, then tries
   * AWS Secrets Manager, and finally falls back to environment variables.
   *
   * @param name Name of the secret to retrieve
   * @returns Secret value or empty string if not found
   */
  public async getSecret(name: string): Promise<string> {
    // Return from cache if available
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }
    // Try AWS Secrets Manager if client is initialized
    if (this.client) {
      try {
        const data = await this.client.send(new GetSecretValueCommand({ SecretId: name }));
        let secret: string;
        if (data.SecretString) {
          secret = data.SecretString;
        } else if (data.SecretBinary) {
          secret = Buffer.from(data.SecretBinary as Uint8Array).toString('utf8');
        } else {
          secret = '';
        }
        this.cache.set(name, secret);
        return secret;
      } catch (error) {
        console.warn(`Secret ${name} not found in AWS Secrets Manager:`, error);
      }
    }
    // Fallback to environment variable
    const envSecret = process.env[name];
    if (envSecret) {
      this.cache.set(name, envSecret);
      return envSecret;
    }
    console.warn(`Secret ${name} is not defined in environment variables or Secrets Manager.`);
    return '';
  }
}

// Export a singleton instance for reuse
export const secretManager = new SecretManager();