export interface TemplateDimension {
  key: string;
  weight: number;
  description: string;
  scoringGuide: Record<string, string>;
}

export interface CreateTemplateDto {
  name: string;
  assetType: string;
  dimensions: TemplateDimension[];
  ownerScope?: 'system' | 'tenant';
}
