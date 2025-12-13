import React from 'react';

export enum Section {
  PDF_TOOLS = 'PDF_TOOLS',
  IDENTITY_LAB = 'IDENTITY_LAB',
  CV_FORGE = 'CV_FORGE',
  DOCUSCAN_AI = 'DOCUSCAN_AI',
  ADS_MAKER = 'ADS_MAKER',
  WAFID_INTEL = 'WAFID_INTEL',
  AI_WRITER = 'AI_WRITER',
  IMAGE_TOOLS = 'IMAGE_TOOLS',
  CODE_STUDIO = 'CODE_STUDIO',
  CONVERTER = 'CONVERTER',
}

export interface ToolDef {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  neonClass: string;
  action: () => void;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}