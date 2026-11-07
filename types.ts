export const TYPES_VERSION = '1.0.0';

export type UserRole = 'merchandiser' | 'supervisor' | 'buyer' | 'md';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  organization: string; // 'Company A (Tiruppur)', 'Company B (UK)', 'Company C (Germany)'
  unit?: string; // For supervisors: 'Unit 1 (Kangeyam Rd)', 'Unit 2 (Angeripalayam)', etc.
  buyerId?: string; // For buyers: 'buyer-b-uk', 'buyer-c-de'
  preferredLanguage?: 'en' | 'ta';
}

export type ProductionStage = 
  | 'Fabric In-House'
  | 'Cutting'
  | 'Printing'
  | 'Stitching'
  | 'Washing'
  | 'Finishing'
  | 'Final QC'
  | 'Packing';

export type OrderStatus = 'green' | 'amber' | 'red';

export interface SizeQuantity {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
}

export interface ColorBreakdown {
  colorName: string;
  hexCode: string;
  sizes: SizeQuantity[];
}

export interface Milestone {
  id: string;
  stage: ProductionStage;
  targetStartDate: string;
  targetEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  targetQuantity: number;
  completedQuantity: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  responsibleUnit: string;
}

export interface DailyLog {
  id: string;
  orderId: string;
  date: string;
  stage: ProductionStage;
  quantityDoneToday: number;
  supervisorId: string;
  supervisorName: string;
  unit: string;
  photoUrl?: string;
  originalNoteTamil?: string;
  englishTranslation?: string;
  aiReasonCategory?: string;
  aiConfidence?: number;
  isAiCorrectedByMerchandiser?: boolean;
  merchandiserReviewStatus: 'pending_review' | 'confirmed' | 'rejected';
  merchandiserComment?: string;
  isSharedWithBuyer: boolean;
  createdAt: string;
}

export interface DateChangeAudit {
  id: string;
  orderId: string;
  fieldChanged: string;
  previousValue: string;
  newValue: string;
  reason: string;
  authorizedBy: string;
  timestamp: string;
}

export interface Order {
  id: string;
  poNumber: string;
  buyerId: string;
  buyerName: string;
  styleDescription: string;
  productType: string;
  garmentImageUrl: string;
  unit: string;
  totalQuantity: number;
  fobPricePerPieceINR: number;
  orderValueINR: number;
  orderDate: string;
  exFactoryDate: string;
  currentStage: ProductionStage;
  totalQuantityDone: number;
  status: OrderStatus;
  colors: ColorBreakdown[];
  milestones: Milestone[];
  dailyLogs: DailyLog[];
  dateChangeAudits: DateChangeAudit[];
  merchandiserId: string;
  merchandiserName: string;
  hasUnconfirmedDelayWarning: boolean;
  confirmedBuyerWarning?: {
    warningText: string;
    confirmedAt: string;
    merchandiserName: string;
    mitigationPlan: string;
    revisedExFactoryDate?: string;
  };
}

export interface RunRateCalculation {
  targetQuantity: number;
  totalCompleted: number;
  remainingQuantity: number;
  daysRemaining: number;
  workingDaysRemaining: number;
  requiredDailyRunRate: number;
  currentDailyRunRate: number; // 3-day average
  projectedWorkingDaysToFinish: number;
  projectedCompletionDate: string;
  projectedSlipDays: number;
  status: OrderStatus;
  capacityVariancePercent: number; // ((current - required) / required) * 100
  potentialAirFreightRiskINR: number;
  potentialDiscountRiskINR: number;
  explanation: string;
}

export interface TamilNoteAnalysisResult {
  originalNoteTamil: string;
  englishTranslation: string;
  category: 
    | 'Yarn & Fabric Delay'
    | 'Machine Breakdown'
    | 'Needle Breakage / QC Alert'
    | 'Printing Screen / Strike-off Defect'
    | 'Subcontract Processor Delay'
    | 'Absenteeism / Power Outage'
    | 'Trims & Accessories Shortage'
    | 'Normal Production / General Note';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  isAmbiguous: boolean;
  recommendedMitigation: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DemoCredential {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  passwordHint: string;
  organization: string;
  description: string;
}
