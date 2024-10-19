/**
 * Represents a ThanhHoa response.
 * @class ThanhHoaResponse
 * @description A class for handling ThanhHoa responses.
 */
export class ThanhHoaResponse {
  meta: { status: number; message: string };
  data: any;

  constructor(error?: { status?: number; message?: string; data?: any }) {
    this.meta = {
      status: error?.status ?? 500,
      message: error?.message ?? 'Internal Server Error',
    };
    this.data = error?.data;
  }

  toResponse(): Response {
    const payload = {
      meta: this.meta,
      data: this.data,
    };
    return new Response(JSON.stringify(payload), {
      status: this.meta.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
