export type BusinessLabel = 'RoboFab' | 'TechNova';
export type OrderStatus = 'new' | 'inProgress' | 'waiting' | 'completed' | 'delivered' | 'cancelled';
export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type OrderSection = 'printing3d' | 'design' | 'pcbPrinting' | 'outsourcedPrinting';
export type MachineStatus = 'active' | 'maintenance' | 'offline';
export type DesignType = '3dDesign' | 'pcbDesign';
export type OutsourcedStatus = 'sent' | 'inProgress' | 'received' | 'delivered' | 'cancelled';
export type UserRole = 'owner' | 'admin' | 'staff' | 'viewer';
export type ClientCategory = 'printing3d' | '3dDesign' | 'pcbDesign' | 'pcbPrinting' | 'externalPrinting';
export type WaitingReason =
  | 'clientConfirmation' | 'material' | 'payment' | 'file'
  | 'machineAvailability' | 'externalCompany' | 'other';
export type ActivityType =
  | 'created' | 'stageChanged' | 'statusChanged' | 'started' | 'finished'
  | 'markedReady' | 'delivered' | 'onHold' | 'cancelled' | 'noteAdded' | 'fieldUpdated';

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

// ── Per-section order stages ──────────────────────────────────────────────────
export type PrintingStage =
  | 'new' | 'reviewingFile' | 'waitingClientConfirm' | 'waitingMaterial'
  | 'scheduledPrinting' | 'printing' | 'postProcessing' | 'readyDelivery'
  | 'delivered' | 'cancelled';

export type DesignStage =
  | 'new' | 'requirementsReceived' | 'inDesign' | 'waitingClientReview'
  | 'revision' | 'finalFilesReady' | 'delivered' | 'cancelled';

export type PcbStage =
  | 'new' | 'fileReview' | 'preparingBoard' | 'printing' | 'finishing'
  | 'readyDelivery' | 'delivered' | 'cancelled';

export type OutsourcedStage =
  | 'new' | 'sentExternal' | 'inProgressOutside' | 'receivedCompany'
  | 'checked' | 'readyDelivery' | 'delivered' | 'cancelled';

export type OrderStage = PrintingStage | DesignStage | PcbStage | OutsourcedStage;

export interface GramAllocation {
  businessLabel: BusinessLabel;
  machineId: string;
  machineName: string;
  grams: number;
}

export interface Order {
  id: string;
  section: OrderSection;
  orderName: string;
  clientName: string;
  clientPhone: string;
  businessLabel: BusinessLabel;
  receivedDate: string;
  deliveryDate: string;
  status: OrderStatus;
  priority: OrderPriority;
  price: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  // Stage tracking (section-specific, replaces coarse status for ops board)
  stage?: OrderStage;
  waitingReason?: WaitingReason;
  internalDeadlineNotes?: string;

  // Timeline scheduling
  plannedStartDate?: string;
  printStartTime?: string;
  printEndDate?: string;
  printEndTime?: string;
  printDurationHours?: number;
  actualStartTime?: string;
  actualFinishTime?: string;
  deliveredDate?: string;

  // 3D Printing specific
  machineId?: string;
  machineName?: string;
  material?: string;
  color?: string;
  quantity?: number;
  grams?: number;
  gramAllocations?: GramAllocation[];
  splitGrams?: boolean;

  // Design specific
  designType?: DesignType;

  // PCB specific
  boardType?: string;
  boardSize?: string;
  layers?: number;

  // Outsourced specific
  companyName?: string;
  contactPerson?: string;
  dateSent?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  cost?: number;
  sellingPrice?: number;
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
  category: ClientCategory[];
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

export interface MonthlyReport {
  month: number;
  year: number;
  totalOrders: number;
  totalRevenue: number;
  totalPaid: number;
  totalRemaining: number;
  totalGrams: number;
  gramsByMachine: Record<string, { robofab: number; techNova: number; total: number }>;
  gramsByLabel: { robofab: number; techNova: number };
  lateOrders: number;
  completedOrders: number;
  deliveredOrders: number;
  missingGramsOrders: number;
}

export interface BusinessLabelStats {
  ordersThisMonth: number;
  gramsThisMonth: number;
  revenue: number;
  paid: number;
  remaining: number;
  lateOrders: number;
  urgentOrders: number;
  completedOrders: number;
  activeOrders: number;
}

export interface DashboardStats {
  totalOrdersThisMonth: number;
  totalGramsThisMonth: number;
  gramsByMachine: Record<string, number>;
  gramsByRoboFab: number;
  gramsByTechNova: number;
  lateOrdersCount: number;
  ordersDueToday: number;
  ordersDueThisWeek: number;
  missingGramsCount: number;
  urgentOrdersCount: number;
  recentOrders: Order[];
  robofab: BusinessLabelStats;
  techNova: BusinessLabelStats;
}
