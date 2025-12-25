export interface AiAnalysisRequestDto {
  assetId: string;
  templateId: string;
  evaluationId?: string;
  context?: string;
}

export interface AiAnalysisResponseDto {
  scores: Record<string, number>;
  rationales: Record<string, string>;
  suggestions: string[];
  reportMarkdown: string;
}
