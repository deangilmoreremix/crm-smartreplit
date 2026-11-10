import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Database } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { Button } from '../../components/ui/button';
import { STANDARD_OBJECTS, useObjects } from '../../hooks/useDataModel';

const toCamel = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^[0-9]+/, '');

export default function DataModelPage() {
  const { objects, loading, error, create, remove } = useObjects();
  const [singular, setSingular] = useState('');
  const [plural, setPlural] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const ns = toCamel(singular);
    const np = toCamel(plural || `${singular}s`);
    try {
      await create({
        name_singular: ns, name_plural: np, label_singular: singular.trim(),
        label_plural: plural.trim() || `${singular.trim()}s`, icon: null,
      });
      setSingular('');
      setPlural('');
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <PageLayout title="Data model" description="Standard and custom objects, and the fields on each.">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold mb-3">Standard objects</h3>
          <ul className="divide-y">
            {STANDARD_OBJECTS.map((o) => (
              <li key={o} className="py-2 flex items-center justify-between">
                <span className="capitalize">{o}</span>
                <Link className="text-blue-600 hover:underline text-sm" to={`/settings/data-model/${o}`}>Custom fields</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold mb-3 flex items-center"><Database size={18} className="mr-2 text-gray-500" />Custom objects</h3>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          {loading ? <p className="text-sm text-gray-500">Loading...</p> : objects.length === 0 ? (
            <p className="text-sm text-gray-500">No custom objects yet.</p>
          ) : (
            <ul className="divide-y">
              {objects.map((o) => (
                <li key={o.id} className="py-2 flex items-center justify-between">
                  <div>
                    <Link className="font-medium text-blue-600 hover:underline" to={`/settings/data-model/${o.id}`}>{o.label_plural}</Link>
                    <span className="ml-2 text-xs text-gray-500">/o/{o.name_plural}</span>
                  </div>
                  {!o.is_system && (
                    <button
                      aria-label={`Delete ${o.label_plural}`}
                      className="text-gray-400 hover:text-red-600"
                      onClick={() => { if (window.confirm(`Delete ${o.label_plural} and all its records?`)) void remove(o.id); }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={onAdd} className="mt-4 flex flex-wrap gap-2 items-end">
            <label className="text-sm">
              <span className="block text-gray-700 mb-1">Singular label</span>
              <input required value={singular} onChange={(e) => setSingular(e.target.value)} placeholder="Project" className="p-2 border rounded-md" />
            </label>
            <label className="text-sm">
              <span className="block text-gray-700 mb-1">Plural label</span>
              <input value={plural} onChange={(e) => setPlural(e.target.value)} placeholder="Projects" className="p-2 border rounded-md" />
            </label>
            <Button type="submit"><Plus className="h-4 w-4 mr-2" />Add object</Button>
          </form>
          {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
        </section>
      </div>
    </PageLayout>
  );
}
