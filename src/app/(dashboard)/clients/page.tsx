'use client';
import { useState, useMemo } from 'react';
import { Plus, Search, Users, Phone, Mail, Pencil, Trash2, Package, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ClientForm from '@/components/forms/ClientForm';
import { useClients } from '@/hooks/useClients';
import { useAllOrders } from '@/hooks/useOrders';
import { useTranslation } from '@/hooks/useTranslation';
import { createClient, updateClient, deleteClient } from '@/lib/firestore';
import { formatDate } from '@/utils/dateUtils';
import { CLIENT_CATEGORY_LABELS } from '@/utils/formatters';
import { CLIENT_CATEGORIES, normalizeClientCategory } from '@/utils/clientCategory';
import type { Client, ClientCategory } from '@/types';

const selectCls = 'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20';

export default function ClientsPage() {
  const { clients, loading } = useClients();
  const { orders } = useAllOrders();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ClientCategory | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const clientOrderStats = useMemo(() => {
    const map: Record<string, { count: number; lastDate: string | null }> = {};
    for (const o of orders) {
      const key = o.clientId || `name:${o.clientName}`;
      const entry = map[key] || (map[key] = { count: 0, lastDate: null });
      entry.count += 1;
      if (!entry.lastDate || o.createdAt > entry.lastDate) entry.lastDate = o.createdAt;
    }
    return map;
  }, [orders]);

  const getStats = (client: Client) => clientOrderStats[client.id] || clientOrderStats[`name:${client.name}`] || { count: 0, lastDate: null };

  const filtered = useMemo(() => clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || '').toLowerCase().includes(q);
    const matchCategory = !categoryFilter || normalizeClientCategory(c.category) === categoryFilter;
    return matchSearch && matchCategory;
  }), [clients, search, categoryFilter]);

  const handleCreate = async (data: Partial<Client>) => {
    setSaving(true);
    try { await createClient(data as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>); setShowForm(false); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (data: Partial<Client>) => {
    if (!editClient) return;
    setSaving(true);
    try { await updateClient(editClient.id, data); setEditClient(null); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await deleteClient(deleteId); setDeleteId(null); }
    catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  return (
    <DashboardLayout title={t('clients.title')}>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 relative min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('clients.search')}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-10 pl-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as ClientCategory | '')} className={selectCls}>
            <option value="">{t('clients.filterCategory')}: {t('common.all')}</option>
            {CLIENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{CLIENT_CATEGORY_LABELS[cat]}</option>)}
          </select>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>{t('clients.add')}</Button>
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState title={t('clients.empty')} icon={<Users className="w-8 h-8 text-slate-600" />}
            action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>{t('clients.add')}</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((client, i) => {
              const stats = getStats(client);
              return (
                <div
                  key={client.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-slate-200 font-semibold truncate">{client.name}</h3>
                      <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span dir="ltr">{client.phone}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setEditClient(client)} className="text-slate-600 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(client.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <span className="inline-block text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md px-2 py-0.5 mt-1">
                    {CLIENT_CATEGORY_LABELS[normalizeClientCategory(client.category)]}
                  </span>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Package className="w-3.5 h-3.5" />
                      {stats.count} {t('clients.orderCount')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {stats.lastDate ? formatDate(stats.lastDate) : t('clients.noOrders')}
                    </div>
                  </div>

                  {client.notes && <p className="text-slate-600 text-xs mt-2 truncate">{client.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={t('clients.add')}>
        <ClientForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      <Modal open={!!editClient} onClose={() => setEditClient(null)} title={t('common.edit')}>
        {editClient && <ClientForm initial={editClient} onSubmit={handleUpdate} loading={saving} />}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} />
    </DashboardLayout>
  );
}
