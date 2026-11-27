import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Check, ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  DEFAULT_NOTEBOOK_ID,
  getDefaultNotebookName,
  type SlideNotebook,
} from '../../slides/notebookStorage';

interface NotebookSwitcherProps {
  isEn: boolean;
  notebooks: SlideNotebook[];
  activeNotebook: SlideNotebook;
  onSelectNotebook: (id: string) => void;
  onCreateNotebook: (name: string) => void;
  onRenameNotebook: (id: string, name: string) => void;
  onDeleteNotebook: (id: string) => void;
}

export function NotebookSwitcher({
  isEn,
  notebooks,
  activeNotebook,
  onSelectNotebook,
  onCreateNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}: NotebookSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const getDisplayName = (nb: SlideNotebook) =>
    nb.id === DEFAULT_NOTEBOOK_ID && nb.updatedAt === 0 ? getDefaultNotebookName(isEn) : nb.name;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setEditingId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      setEditingId(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - 316));
      setAnchorRect({ top: rect.bottom + 6, left });
    } else {
      setAnchorRect({ top: 52, left: 16 });
    }
    setOpen(true);
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateNotebook(trimmed);
    setNewName('');
    setOpen(false);
  };

  const handleSaveRename = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onRenameNotebook(id, trimmed);
    }
    setEditingId(null);
    setEditingName('');
  };

  const popover =
    open && anchorRect && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[110]"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={isEn ? 'Section Notebooks' : 'สมุดบันทึกแยก Sec / คาบสอน'}
              style={{ top: anchorRect.top, left: anchorRect.left }}
              className="fixed z-[115] w-[300px] max-w-[calc(100vw-16px)] rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-3 space-y-2.5 text-xs select-text"
            >
              <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-200">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isEn ? 'Section Notebooks' : 'สมุดบันทึกแยก Sec / คาบ'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isEn
                      ? 'Separate handwriting & blank pages per section'
                      : 'แยกเก็บลายมือและหน้ากระดาษเปล่าคนละชุด'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setEditingId(null);
                  }}
                  aria-label={isEn ? 'Close' : 'ปิด'}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
                {notebooks.map((nb) => {
                  const isActive = nb.id === activeNotebook.id;
                  const displayName = getDisplayName(nb);
                  const isEditing = editingId === nb.id;

                  if (isEditing) {
                    return (
                      <div
                        key={nb.id}
                        className="flex items-center gap-1 p-1 rounded-xl border border-teal-400 bg-teal-50/50"
                      >
                        <input
                          type="text"
                          value={editingName}
                          autoFocus
                          maxLength={60}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(nb.id);
                            if (e.key === 'Escape') {
                              e.stopPropagation();
                              setEditingId(null);
                            }
                          }}
                          className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(nb.id)}
                          aria-label={isEn ? 'Save' : 'บันทึก'}
                          className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={nb.id}
                      className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-xl border transition ${
                        isActive
                          ? 'border-teal-500 bg-teal-50 text-teal-950 font-bold'
                          : 'border-slate-200/80 hover:bg-slate-50 text-slate-700 font-semibold'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!isActive) onSelectNotebook(nb.id);
                          setOpen(false);
                        }}
                        className="flex-1 min-w-0 flex items-center gap-1.5 text-left"
                      >
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isActive ? <Check className="w-3 h-3" /> : <BookOpen className="w-2.5 h-2.5" />}
                        </span>
                        <span className="truncate">{displayName}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(nb.id);
                          setEditingName(displayName);
                        }}
                        title={isEn ? 'Rename notebook' : 'เปลี่ยนชื่อสมุด'}
                        aria-label={isEn ? 'Rename notebook' : 'เปลี่ยนชื่อสมุด'}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition shrink-0"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>

                      {nb.id !== DEFAULT_NOTEBOOK_ID && (
                        <button
                          type="button"
                          onClick={() => {
                            const msg = isEn
                              ? `Delete notebook "${displayName}" and all its handwritten notes?`
                              : `ต้องการลบสมุด "${displayName}" รวมถึงลายมือทั้งหมดในสมุดนี้หรือไม่?`;
                            if (window.confirm(msg)) {
                              onDeleteNotebook(nb.id);
                            }
                          }}
                          title={isEn ? 'Delete notebook' : 'ลบสมุดนี้'}
                          aria-label={isEn ? 'Delete notebook' : 'ลบสมุดนี้'}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500">
                  {isEn ? 'New Section / Class Notebook:' : 'สร้างสมุดใหม่ (เริ่มกระดานเปล่า):'}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newName}
                    maxLength={60}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                    }}
                    placeholder={isEn ? 'e.g., Sec 1, Sec 2 (Wed)' : 'เช่น Sec 1, Sec 2, กลุ่มบ่าย'}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none text-xs font-medium"
                  />
                  <button
                    type="button"
                    disabled={!newName.trim() || notebooks.length >= 30}
                    onClick={handleCreate}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-45 transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Add' : 'เพิ่ม'}</span>
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        title={
          isEn
            ? `Active notebook: ${getDisplayName(activeNotebook)} (Switch section / create new)`
            : `สมุดที่เปิดอยู่: ${getDisplayName(activeNotebook)} (กดเพื่อสลับ Sec หรือสร้างสมุดใหม่)`
        }
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[13px] font-bold transition shrink-0 ${
          activeNotebook.id === DEFAULT_NOTEBOOK_ID
            ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            : 'border-teal-400 bg-teal-50 hover:bg-teal-100 text-teal-900'
        }`}
      >
        <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        <span className="max-w-[96px] sm:max-w-[140px] truncate">
          {getDisplayName(activeNotebook)}
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
      </button>
      {popover}
    </>
  );
}
