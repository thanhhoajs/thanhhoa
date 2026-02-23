import type { IStaticDirectoryConfig } from '@thanhhoajs/thanhhoa';
import type { BunFile } from 'bun';

export interface IThanhHoaServeOptions {
  port?: number;
  hostname?: string;
  staticDirectories?: IStaticDirectoryConfig[];
  spa?: boolean;
  redis?: {
    enabled: boolean;
    url?: string; // Redis connection URL
  };
  /**
   * TLS configuration for HTTPS.
   * Uses Bun's native TLS support.
   *
   * @example
   * app.listen({ port: 443, tls: { key: Bun.file('./key.pem'), cert: Bun.file('./cert.pem') } });
   */
  tls?: {
    key: string | BunFile | Buffer;
    cert: string | BunFile | Buffer;
    ca?: string | BunFile | Buffer;
    passphrase?: string;
  };
}
