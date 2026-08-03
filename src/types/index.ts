export type OrderCategory = 'chandelier' | 'holder' | 'general';
export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type PaymentMethod = 'cash' | 'vodafoneCash' | 'instapay' | 'bankTransfer' | 'notPaid' | 'other';
export type PaymentStatus = 'notSet' | 'notPaid' | 'depositPaid' | 'partiallyPaid' | 'fullyPaid' | 'remainingBalance';
export type MachineStatus = 'active' | 'maintenance' | 'offline';
export type UserRole = 'owner' | 'admin' | 'staff' | 'viewer';
export type ClientCategory = 'chandelier' | 'holder' | 'both' | 'general';
export type MaterialType = 'PLA' | 'PETG' | 'TPU' | 'ABS' | 'ASA' | 'Resin' | 'Other';
export type FilamentStatus = 'available' | 'low' | 'out';

export type ActivityType =
  | 'created' | 'stageChanged' | 'started' | 'finished'
  | 'markedReady' | 'delivered' | 'cancelled' | 'noteAdded' | 'fieldUpdated'
  | 'filamentReserved' | 'filamentConsumed' | 'filamentReleased'
  | 'machineSelected' | 'deliveryDateChanged' | 'paymentUpdated';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  timestamp: string;
  userId?: string;
  userName?: string;
  previousValue?: string;
  newValue?: string;
  note?: string;
}

// ── Unified production stage flow ──────────────────────────────────────────────
export type OrderStage =
  | 'new' | 'design' | 'slicing' | 'scheduledPrinting' | 'printing'
  | 'postProcessing' | 'qualityCheck' | 'readyDelivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  category: OrderCategory;
  orderName: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  productType?: string;
  receivedDate: string;
  deliveryDate: string;
  stage: OrderStage;
  priority: OrderPriority;
  price: number | null;
  paidAmount: number;
  remainingAmount: number | null;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentNotes?: string;
  makerWorldLink?: string;
  driveLink?: string;
  otherLink?: string;
  notes: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  // Timeline / stage timestamps
  designStartedAt?: string;
  designCompletedAt?: string;
  slicingStartedAt?: string;
  slicingCompletedAt?: string;
  printingStartedAt?: string;
  printingFinishedAt?: string;
  postProcessingDoneAt?: string;
  qualityCheckDoneAt?: string;
  readyForDeliveryAt?: string;
  deliveredDate?: string;
  cancelledAt?: string;

  // Print scheduling
  plannedStartDate?: string;
  printStartTime?: string;
  printEndDate?: string;
  printEndTime?: string;
  printDurationHours?: number;

  // Production
  machineId?: string;
  machineName?: string;
  quantity?: number;

  // Filament usage
  filamentId?: string;
  filamentName?: string;
  filamentColorName?: string;
  materialType?: MaterialType;
  estimatedGrams?: number;
  actualGrams?: number;
  reservedGrams?: number;
  stockConsumed?: boolean;
  stockOverride?: boolean;
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  status: MachineStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  category: ClientCategory;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: string;
  createdAt: string;
}

// ── Filament stock / inventory ─────────────────────────────────────────────────
export interface FilamentStock {
  id: string;
  filamentName: string;
  materialType: MaterialType;
  colorName: string;
  colorHex?: string;
  colorImageUrl?: string;
  brand?: string;
  supplier?: string;
  spoolWeight?: number;
  currentGrams: number;
  usedGrams: number;
  reservedGrams: number;
  minStockLevel: number;
  costPerKg?: number;
  purchaseDate?: string;
  storageLocation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalOrders: number;
  chandelierOrders: number;
  holderOrders: number;
  totalRevenue: number;
  totalPaid: number;
  totalRemaining: number;
  totalGrams: number;
  gramsByMachine: Record<string, number>;
  gramsByCategory: { chandelier: number; holder: number; general: number };
  gramsByColor: Record<string, number>;
  gramsByMaterial: Record<string, number>;
  lateOrders: number;
  completedOrders: number;
  deliveredOrders: number;
}

export interface CategoryStats {
  ordersThisMonth: number;
  gramsThisMonth: number;
  revenue: number;
  paid: number;
  remaining: number;
  lateOrders: number;
  urgentOrders: number;
  activeOrders: number;
}

export interface DashboardStats {
  totalOrdersThisMonth: number;
  totalGramsThisMonth: number;
  gramsByMachine: Record<string, number>;
  lateOrdersCount: number;
  ordersDueToday: number;
  ordersDueThisWeek: number;
  urgentOrdersCount: number;
  recentOrders: Order[];
  chandelier: CategoryStats;
  holder: CategoryStats;
}
