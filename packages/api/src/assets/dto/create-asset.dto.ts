export interface CreateAssetDto {
  name: string;
  description?: string;
  type?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}
