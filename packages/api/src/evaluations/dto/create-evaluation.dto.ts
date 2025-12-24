export interface CreateEvaluationDto {
  assetId: string;
  templateId: string;
  method?: 'manual' | 'import' | 'auto' | 'mixed';
}
