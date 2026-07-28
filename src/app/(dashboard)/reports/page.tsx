'use client';
import { useState, useMemo } from 'react';
import { BarChart3, Palette, Layers } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { StockStatusBadge } from '@/components/ui/Badge';
import { useAllOrders } from '@/hooks/useOrders';
import { useFilamentStock } from '@/hooks/useFilamentStock';
import { calcMonthlyReport } from '@/utils/calculations';
import { formatCurrency, formatGrams, filamentStatus, MATERIAL_TYPE_LABELS } from '@/utils/formatters';
import { useTranslation } from '@/hooks/useTranslation';
import type { OrderCategory } from '@/types';
import type { TranslationKey } from '@/i18n/translations';

const CHANDELIER_COLOR = '#F59E0B';
const HOLDER_COLOR = '#06B6D4';

const MONTH_KEYS = [
  'month.1','month.2','month.3','month.4','month.5','month.6',
  'month.7','month.8','month.9','month.10','month.11','month.12',
] as const;

function SummaryCard({ label, value, colorClass }: { label: string; value: string | number; colorClass: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      <div className="text-slate-500 text-xs mb-1.5">{label}</div>
      <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

function CategorySummaryPanel({ name, color, accentClass, orders, t }: {
  name: string; color: string; accentClass: string; orders: ReturnType<typeof useAllOrders>['orders']; t: (k: TranslationKey) => string;
}) {
  const revenue = orders.reduce((s, o) => s + (o.price || 0), 0);
  const paid = orders.reduce((s, o) => s + (o.paidAmount || 0), 0);
  const remaining = orders.reduce((s, o) => s + (o.remainingAmount || 0), 0);
  const grams = orders.reduce((s, o) => s + (o.actualGrams ?? o.estimatedGrams ?? 0), 0);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 ${accentClass}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-slate-200 font-bold text-base">{name}</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <span className="text-slate-500 text-sm">{t('reports.totalOrders')}</span>
          <span className="font-bold font-mono text-sm text-slate-200">{orders.length}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <span className="text-slate-500 text-sm">{t('dash.gramsThisMonth')}</span>
          <span className="font-bold font-mono text-sm" style={{ color }}>{grams.toLocaleString()} {t('common.grams')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">{t('dash.revenue')}</span>
          <span className="text-slate-200 font-semibold">{formatCurrency(revenue)} {t('common.sar')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">{t('dash.paid')}</span>
          <span className="text-green-400 font-semibold">{formatCurrency(paid)} {t('common.sar')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">{t('dash.remaining')}</span>
          <span className="text-amber-400 font-semibold">{formatCurrency(remaining)} {t('common.sar')}</span>
        </div>
      </div>
    </div>
  );
}

const selectCls = 'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20';

export default function ReportsPage() {
  const { orders, loading } = useAllOrders();
  const { filaments } = useFilamentStock();
  const { t, isRTL } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categoryFilter, setCategoryFilter] = useState<OrderCategory | ''>('');

  const filteredOrders = useMemo(() => orders.filter(o => !categoryFilter || o.category === categoryFilter), [orders, categoryFilter]);
  const report = useMemo(() => calcMonthlyReport(filteredOrders, year, month), [filteredOrders, year, month]);

  const monthOrders = useMemo(() => filteredOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  }), [filteredOrders, year, month]);

  const chandelierMonthOrders = useMemo(() => monthOrders.filter(o => o.category === 'chandelier'), [monthOrders]);
  const holderMonthOrders     = useMemo(() => monthOrders.filter(o => o.category === 'holder'), [monthOrders]);

  const machineChartData = useMemo(() =>
    Object.entries(report.gramsByMachine).map(([name, grams]) => ({ name, grams })),
    [report]
  );
  const colorChartData = useMemo(() =>
    Object.entries(report.gramsByColor).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, grams]) => ({ name, grams })),
    [report]
  );
  const materialChartData = useMemo(() =>
    Object.entries(report.gramsByMaterial).map(([name, grams]) => ({ name: MATERIAL_TYPE_LABELS[name as keyof typeof MATERIAL_TYPE_LABELS] || name, grams })),
    [report]
  );

  const lowStockItems = useMemo(() => filaments.filter(f => filamentStatus(f.currentGrams, f.minStockLevel) !== 'available'), [filaments]);

  const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  if (loading) return (
    <DashboardLayout title={t('reports.title')}>
      <LoadingSpinner text={t('common.loading')} />
    </DashboardLayout>
  );

  return (
    <DashboardLayout title={t('reports.title')}>
      <div className="space-y-5 animate-fade-in">

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-slate-300 font-semibold mb-4 text-sm">{t('reports.filters')}</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">{t('reports.month')}</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectCls}>
                {MONTH_KEYS.map((k, i) => <option key={i} value={i + 1}>{t(k)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">{t('reports.year')}</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className={selectCls}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">{t('reports.category')}</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as OrderCategory | '')} className={selectCls}>
                <option value="">{t('common.all')}</option>
                <option value="chandelier">{t('cat.chandelier')}</option>
                <option value="holder">{t('cat.holder')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chandelier vs Holder panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategorySummaryPanel name={t('cat.chandelier')} color={CHANDELIER_COLOR} accentClass="panel-amber" orders={chandelierMonthOrders} t={t} />
          <CategorySummaryPanel name={t('cat.holder')} color={HOLDER_COLOR} accentClass="panel-cyan" orders={holderMonthOrders} t={t} />
        </div>

        {/* Summary stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard label={t('reports.totalOrders')}     value={report.totalOrders}                                              colorClass="text-slate-200" />
          <SummaryCard label={t('reports.totalRevenue')}    value={`${formatCurrency(report.totalRevenue)} ${t('common.sar')}`}     colorClass="text-blue-400" />
          <SummaryCard label={t('reports.totalPaid')}       value={`${formatCurrency(report.totalPaid)} ${t('common.sar')}`}        colorClass="text-green-400" />
          <SummaryCard label={t('reports.totalRemaining')}  value={`${formatCurrency(report.totalRemaining)} ${t('common.sar')}`}   colorClass="text-orange-400" />
          <SummaryCard label={t('reports.totalGrams')}      value={formatGrams(report.totalGrams)}                                  colorClass="text-blue-400" />
          <SummaryCard label={t('cat.chandelier')}          value={report.chandelierOrders}                                          colorClass="text-amber-400" />
          <SummaryCard label={t('cat.holder')}              value={report.holderOrders}                                              colorClass="text-cyan-400" />
          <SummaryCard label={t('reports.lateOrders')}      value={report.lateOrders}                                                colorClass="text-red-400" />
          <SummaryCard label={t('reports.completedOrders')} value={report.completedOrders}                                           colorClass="text-green-400" />
          <SummaryCard label={t('reports.deliveredOrders')} value={report.deliveredOrders}                                           colorClass="text-emerald-400" />
        </div>

        {/* Machine usage chart */}
        {machineChartData.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-slate-300 font-semibold mb-5 flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              {t('reports.machineUsage')}
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={machineChartData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={(v: unknown) => [`${Number(v).toLocaleString()} ${t('common.grams')}`, t('reports.totalGrams')] as [string, string]}
                />
                <Bar dataKey="grams" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {colorChartData.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-slate-300 font-semibold mb-5 flex items-center gap-2 text-sm">
                <Palette className="w-4 h-4 text-violet-400" />
                {t('reports.byColor')}
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={colorChartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#e2e8f0' }} />
                  <Bar dataKey="grams" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {materialChartData.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-slate-300 font-semibold mb-5 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-cyan-400" />
                {t('reports.byMaterial')}
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={materialChartData}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#e2e8f0' }} />
                  <Bar dataKey="grams" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Low stock table */}
        {lowStockItems.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-slate-200 font-semibold text-sm">{t('reports.lowStockItems')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40">
                    <th className={`px-6 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>{t('stock.filamentName')}</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs text-center">{t('stock.currentGrams')}</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs text-center">{t('stock.minStockLevel')}</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs text-center">{t('stock.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lowStockItems.map(f => (
                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className={`px-6 py-3 text-slate-200 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{f.filamentName} — {f.colorName}</td>
                      <td className="px-4 py-3 text-center text-slate-300 font-mono text-sm">{f.currentGrams}g</td>
                      <td className="px-4 py-3 text-center text-slate-500 font-mono text-sm">{f.minStockLevel}g</td>
                      <td className="px-4 py-3 text-center"><StockStatusBadge status={filamentStatus(f.currentGrams, f.minStockLevel)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {report.totalOrders === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">{t('reports.noData')}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
