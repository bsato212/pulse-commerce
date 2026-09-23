import { ValueTransformer } from 'typeorm';

export class ColumnNumericTransformer implements ValueTransformer {
  to(data: number | null): number | null {
    return data;
  }

  from(data: string | number | null): number | null {
    if (data === null || data === undefined) return null;
    const num = Number(data);
    return isNaN(num) ? 0 : num;
  }
}
