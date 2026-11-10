import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { Button } from '../../components/ui/button';
import { FIELD_TYPES, FieldType, SelectOption, useFields } from '../../hooks/useDataModel';

const toFieldName = (s: string) =>
  s.trim().replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^[A-Z0-9]+/, (m) => m.toLowerCase().replace(/^[0-9]+/, ''));

function OptionsEditor({ options, onChange }: { options: SelectOption[]; onChange: (o: SelectOption[]) => void }) {
  return (
    <div className="space-y-2">
      {options.map((o, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={o.label}
            placeholder="Option label"
            className="p-2 border rounded-md flex-1"
            onChange={(e) => onChange(options.map((x, j) => (j === i ? { ...x, label: e.target.value, value: e.target.value.trim() } : x)))}
          />
          <button type="button" aria-label="Remove option" className="text-gray-400 hover:text-red-600" onClick={() => onChange(options.filter((_, j) => j !== i))}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <Button type="button" onClick={() => onChange([...options, { value: '', label: '' }])}><Plus className="h-4 w-4 mr-2" />Add option</Button>
    </div>
  );
}

export default function ObjectDetailPage() {
  const { objectId } = useParams<{ objectId: string }>();
  const { fields, loading, error, create, remove, reorder } = useFields(objectId);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [required, setRequired] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const hasOptions = type === 'select' || type === 'multi_select';

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await create({
        label: label.trim(), name: toFieldName(label), field_type: type,
        options: hasOptions ? options.filter((o) => o.value) : [], is_required: required,
      });
      setLabel(''); setOptions([]); setRequired(false); setType('text');
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const onDragEnd = (r: DropResult) => {
    if (!r.destination || r.destination.index === r.source.index) return;
    const ids = fields.map((f) => f.id);
    const [moved] = ids.splice(r.source.index, 1);
    ids.splice(r.destination.index, 0, moved);
    void reorder(ids);
  };

  return (
    <PageLayout title="Fields" description={`Fields for ${objectId}`} actions={<Link to="/settings/data-model" className="text-sm text-blue-600 hover:underline">Back to data model</Link>}>
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-lg shadow-sm p-6 border">
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          {loading ? <p className="text-sm text-gray-500">Loading...</p> : fields.length === 0 ? (
            <p className="text-sm text-gray-500">No fields yet.</p>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="fields">
                {(drop) => (
                  <ul ref={drop.innerRef} {...drop.droppableProps} className="divide-y">
                    {fields.map((f, i) => (
                      <Draggable key={f.id} draggableId={f.id} index={i}>
                        {(drag) => (
                          <li ref={drag.innerRef} {...drag.draggableProps} className="py-2 flex items-center gap-3 bg-white">
                            <span {...drag.dragHandleProps} aria-label="Drag to reorder" className="text-gray-400 cursor-grab"><GripVertical size={16} /></span>
                            <span className="font-medium flex-1">{f.label}{f.is_required && <span className="text-red-500 ml-1">*</span>}</span>
                            <span className="text-xs text-gray-500">{f.name}</span>
                            <span className="text-xs bg-gray-100 rounded px-2 py-0.5">{f.field_type}</span>
                            {!f.is_system && (
                              <button aria-label={`Delete ${f.label}`} className="text-gray-400 hover:text-red-600" onClick={() => { if (window.confirm(`Delete field ${f.label}?`)) void remove(f.id); }}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {drop.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold mb-3">Add field</h3>
          <form onSubmit={onAdd} className="space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <label className="text-sm">
                <span className="block text-gray-700 mb-1">Label</span>
                <input required value={label} onChange={(e) => setLabel(e.target.value)} className="p-2 border rounded-md" />
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 mb-1">Type</span>
                <select value={type} onChange={(e) => setType(e.target.value as FieldType)} className="p-2 border rounded-md">
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="text-sm flex items-center gap-2 pb-2">
                <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />Required
              </label>
            </div>
            {hasOptions && <OptionsEditor options={options} onChange={setOptions} />}
            <Button type="submit"><Plus className="h-4 w-4 mr-2" />Add field</Button>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </form>
        </section>
      </div>
    </PageLayout>
  );
}
