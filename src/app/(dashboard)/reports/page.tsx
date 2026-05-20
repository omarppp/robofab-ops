'use client';
import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAllOrders } from '@/hooks/useOrders';
import { calcMonthlyReport } from '@/utils/calculations';
import { formatCurrency, formatGrams } from '@/utils/formatters';
import { useTranslation } from '@/hooks/useTranslation';
import type { BusinessLabel } from '@/types';

const ROBOFAB_COLOR = '#06B6D4';
const TECHNOVA_COLOR = '#8B5CF6';

const SECTION_KEYS = [
  { value: 'printing3d',         key: 'section.printing3d' as const },
  { value: 'design',             key: 'section.design' as const },
  { value: 'pcbPrinting',        key: 'section.pcbPrinting' as const },
  { value: 'outsourcedPrinting', key: 'section.outsourcedPrinting' as const },
];

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

function LabelSummaryPanel({ name, color, accentClass, gramsByLabel, totalRevenue, totalPaid, totalRemaining }: {
  name: string; color: string; accentClass: string;
  gramsByLabel: { robofab: number; techNova: number };
  totalRevenue: number; totalPaid: number; totalRemaining: number;
}) {
  const { t } = useTranslation();
  const grams = name === 'RoboFab' ? gramsByLabel.robofab : gramsByLabel.techNova;
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 ${accentClass}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-slate-200 font-bold text-base">{name}</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <span className="text-slate-500 text-sm">{t('dash.gramsThisMonth')}</span>
          <span className="font-bold font-mono text-sm" style={{ color }}>{grams.toLocaleString()} {t('common.grams')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">{t('dash.revenue')}</span>
          <span className="text-slate-200 font-semibold">{formatCurrency(totalRevenue)} {t('common.sar')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">{t('dash.paid')}</span>
          <span className="text-green-400 font-semibold">{formatCurrency(totalPaid)} {t('common.sar')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">{t('dash.remaining')}</span>
          <span className="text-amber-400 font-semibold">{formatCurrency(totalRemaining)} {t('common.sar')}</span>
        </div>
      </div>
    </div>
  );
}

const selectCls = 'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20';

export default function ReportsPage() {
  const { orders, loading } = useAllOrders();
  const { t, isRTL } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [sectionFilter, setSectionFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState<BusinessLabel | ''>('');

  const filteredOrders = useMemo(() => orders.filter(o =>
    (!sectionFilter || o.section === sectionFilter) && (!labelFilter || o.businessLabel === labelFilter)
  ), [orders, sectionFilter, labelFilter]);

  const report = useMemo(() => calcMonthlyReport(filteredOrders, year, month), [filteredOrders, year, month]);

  const robofabMonthOrders = useMemo(() => filteredOrders.filter(o => {
    const d = new Date(o.createdAt);
    return o.businessLabel === 'RoboFab' && d.getFullYear() === year && d.getMonth() + 1 === month;
  }), [filteredOrders, year, month]);

  const techNovaMonthOrders = useMemo(() => filteredOrders.filter(o => {
    const d = new Date(o.createdAt);
    return o.businessLabel === 'TechNova' && d.getFullYear() === year && d.getMonth() + 1 === month;
  }), [filteredOrders, year, month]);

  const robofabRevenue  = useMemo(() => robofabMonthOrders.reduce((s, o) => s + (o.price || 0), 0), [robofabMonthOrders]);
  const techNovaRevenue = useMemo(() => techNovaMonthOrders.reduce((s, o) => s + (o.price || 0), 0), [techNovaMonthOrders]);
  const robofabPaid     = useMemo(() => robofabMonthOrders.reduce((s, o) => s + (o.paidAmount || 0), 0), [robofabMonthOrders]);
  const techNovaPaid    = useMemo(() => techNovaMonthOrders.reduce((s, o) => s + (o.paidAmount || 0), 0), [techNovaMonthOrders]);
  const robofabRemaining  = useMemo(() => robofabMonthOrders.reduce((s, o) => s + (o.remainingAmount || 0), 0), [robofabMonthOrders]);
  const techNovaRemaining = useMemo(() => techNovaMonthOrders.reduce((s, o) => s + (o.remainingAmount || 0), 0), [techNovaMonthOrders]);

  const machineChartData = useMemo(() =>
    Object.entries(report.gramsByMachine).map(([name, vals]) => ({ name, robofab: vals.robofab, techNova: vals.techNova })),
    [report]
  );

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
              <label className="text-xs text-slate-500">{t('reports.section')}</label>
              <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className={selectCls}>
                <option value="">{t('common.all')}</option>
                {SECTION_KEYS.map(({ value, key }) => <option key={value} value={value}>{t(key)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">{t('reports.businessLabel')}</label>
              <select value={labelFilter} onChange={e => setLabelFilter(e.target.value as any)} className={selectCls}>
                <option value="">{t('common.all')}</option>
                <option value="RoboFab">RoboFab</option>
                <option value="TechNova">Tech Nova</option>
              </select>
            </div>
          </div>
        </div>

        {/* RoboFab vs TechNova panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LabelSummaryPanel name="RoboFab" color={ROBOFAB_COLOR} accentClass="panel-cyan"
            gramsByLabel={report.gramsByLabel} totalRevenue={robofabRevenue} totalPaid={robofabPaid} totalRemaining={robofabRemaining} />
          <LabelSummaryPanel name="Tech Nova" color={TECHNOVA_COLOR} accentClass="panel-purple"
            gramsByLabel={report.gramsByLabel} totalRevenue={techNovaRevenue} totalPaid={techNovaPaid} totalRemaining={techNovaRemaining} />
        </div>

        {/* Summary stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard label={t('reports.totalOrders')}    value={report.totalOrders}                                colorClass="text-slate-200" />
          <SummaryCard label={t('reports.totalRevenue')}   value={`${formatCurrency(report.totalRevenue)} ${t('common.sar')}`}   colorClass="text-blue-400" />
          <SummaryCard label={t('reports.totalPaid')}      value={`${formatCurrency(report.totalPaid)} ${t('common.sar')}`}       colorClass="text-green-400" />
          <SummaryCard label={t('reports.totalRemaining')} value={`${formatCurrency(report.totalRemaining)} ${t('common.sar')}`}  colorClass="text-orange-400" />
          <SummaryCard label={t('reports.totalGrams')}     value={formatGrams(report.totalGrams)}                   colorClass="text-blue-400" />
          <SummaryCard label={t('reports.robofabGrams')}   value={formatGrams(report.gramsByLabel.robofab)}          colorClass="text-cyan-400" />
          <SummaryCard label={t('reports.technovaGrams')}  value={formatGrams(report.gramsByLabel.techNova)}         colorClass="text-violet-400" />
          <SummaryCard label={t('reports.lateOrders')}     value={report.lateOrders}                                colorClass="text-red-400" />
          <SummaryCard label={t('reports.completedOrders')} value={report.completedOrders}                          colorClass="text-green-400" />
          <SummaryCard label={t('reports.deliveredOrders')} value={report.deliveredOrders}                          colorClass="text-emerald-400" />
          <SummaryCard label={t('reports.missingGrams')}   value={report.missingGramsOrders}                        colorClass="text-amber-400" />
        </div>

        {/* Machine usage chart */}
        {machineChartData.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-slate-300 font-semibold mb-5 flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              {t('reports.machineUsage')}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={machineChartData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={(v: unknown, name: unknown) => [`${Number(v).toLocaleString()} ${t('common.grams')}`, name === 'robofab' ? 'RoboFab' : 'Tech Nova'] as [string, string]}
                />
                <Legend formatter={(v) => v === 'robofab' ? 'RoboFab' : 'Tech Nova'} wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Bar dataKey="robofab"  name="robofab"  fill={ROBOFAB_COLOR}  radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="techNova" name="techNova" fill={TECHNOVA_COLOR} radius={[3, 3, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Machine detail table */}
        {Object.keys(report.gramsByMachine).length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-slate-200 font-semibold text-sm">{t('reports.machineDetail')}</h3>
              <p className="text-slate-500 text-xs mt-0.5">{t(MONTH_KEYS[month - 1])} {year}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40">
                    <th className={`px-6 py-3 text-slate-400 font-medium text-xs uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>{t('reports.machine')}</th>
                    <th className="px-4 py-3 text-cyan-400 font-medium text-xs text-center">RoboFab ({t('common.grams')})</th>
                    <th className="px-4 py-3 text-violet-400 font-medium text-xs text-center">Tech Nova ({t('common.grams')})</th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-xs text-center">{t('common.total')} ({t('common.grams')})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(report.gramsByMachine).map(([machine, vals]) => (
                    <tr key={machine} className="hover:bg-slate-800/40 transition-colors">
                      <td className={`px-6 py-3 text-slate-200 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{machine}</td>
                      <td className="px-4 py-3 text-center text-cyan-400 font-mono text-sm">{vals.robofab.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center text-violet-400 font-mono text-sm">{vals.techNova.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center text-slate-200 font-mono font-semibold text-sm">{vals.total.toFixed(1)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-700 bg-slate-800/60 font-semibold">
                    <td className={`px-6 py-3 text-slate-300 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.total')}</td>
                    <td className="px-4 py-3 text-center text-cyan-400 font-mono">{report.gramsByLabel.robofab.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center text-violet-400 font-mono">{report.gramsByLabel.techNova.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center text-slate-100 font-mono">{report.totalGrams.toFixed(1)}</td>
                  </tr>
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
