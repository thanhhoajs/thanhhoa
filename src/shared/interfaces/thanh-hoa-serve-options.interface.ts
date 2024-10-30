import type { IStaticDirectoryConfig } from '@thanhhoajs/thanhhoa';
import type { ServeOptions } from 'bun';

export interface IThanhHoaServeOptions extends Omit<ServeOptions, 'fetch'> {
  staticDirectories?: IStaticDirectoryConfig[];
}
