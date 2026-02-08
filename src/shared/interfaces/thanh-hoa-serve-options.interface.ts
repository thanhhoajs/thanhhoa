import type { IStaticDirectoryConfig } from '@thanhhoajs/thanhhoa';
import type { Server } from 'bun';

export interface IThanhHoaServeOptions {
  port?: number;
  hostname?: string;
  staticDirectories?: IStaticDirectoryConfig[];
  spa?: boolean;
  redis?: {
    enabled: boolean;
    url?: string; // Redis connection URL
  };
}
