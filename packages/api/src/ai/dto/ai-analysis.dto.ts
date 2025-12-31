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
  projections?: Array<{
    scenario: string;
    description: string;
    outcome: string;
    probability: string;
  }>;
  specificRecommendations?: Array<{
    category: string;
    items: string[];
  }>;
}
