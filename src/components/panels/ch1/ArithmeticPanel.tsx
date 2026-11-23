import type { AppLang, ArithmeticState } from '../../../types';
import {
  ARITHMETIC_PRESETS,
  fmtVecAngle,
  fmtVecIJK,
  vecAdd,
  vecScale,
  vecSub,
} from '../../../math/vectors';
import { fmtNum } from '../../../math/latex';
import { KaTeX } from '../../KaTeX';
import { SliderControl } from '../../SliderControl';
import { Vec3SliderGroup } from '../../Vec3SliderGroup';

interface ArithmeticPanelProps {
  state: ArithmeticState;
  lang?: AppLang;
  onChange: (next: ArithmeticState) => void;
}

export function ArithmeticPanel({ state, lang = 'th', onChange }: ArithmeticPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<ArithmeticState>) => onChange({ ...state, ...patch });

  const result =
    state.operation === 'add'
      ? vecAdd(state.u, state.v)
      : state.operation === 'sub'
        ? vecSub(state.u, state.v)
        : vecScale(state.u, state.scalarK);

  const opExpr =
    state.operation === 'add'
      ? '\\mathbf{u} + \\mathbf{v}'
      : state.operation === 'sub'
        ? '\\mathbf{u} - \\mathbf{v}'
        : `${fmtNum(state.scalarK)}\\mathbf{u}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Presets' : 'ตัวอย่างประกอบการสอน (Presets)'}
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {ARITHMETIC_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update(p.value)}
              className="text-left px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:border-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate"
            >
              {isEn ? p.label.en : p.label.th}
            </button>
          ))}
        </div>
      </div>

      {/* Operation Selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {(
          [
            { id: 'add', th: 'บวก u + v', en: 'Add u + v' },
            { id: 'sub', th: 'ลบ u - v', en: 'Sub u - v' },
            { id: 'scalar', th: 'คูณสเกลาร์ k u', en: 'Scale k u' },
          ] as const
        ).map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => update({ operation: op.id })}
            className={`py-2 px-2 rounded-xl border text-xs font-semibold transition ${
              state.operation === op.id
                ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            {isEn ? op.en : op.th}
          </button>
        ))}
      </div>

      <Vec3SliderGroup
        title={isEn ? 'Vector u (Blue)' : 'เวกเตอร์ u (สีฟ้า)'}
        value={state.u}
        min={-3.5}
        max={3.5}
        lang={lang}
        badgeColor="text-sky-600 dark:text-sky-400"
        onChange={(u) => update({ u })}
      />

      {state.operation !== 'scalar' ? (
        <Vec3SliderGroup
          title={isEn ? 'Vector v (Green)' : 'เวกเตอร์ v (สีเขียว)'}
          value={state.v}
          min={-3.5}
          max={3.5}
          lang={lang}
          badgeColor="text-emerald-600 dark:text-emerald-400"
          onChange={(v) => update({ v })}
        />
      ) : (
        <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30">
          <SliderControl
            label={isEn ? 'Scalar Multiplier k' : 'ค่าสเกลาร์ k (Scalar Multiplier)'}
            value={state.scalarK}
            min={-2.5}
            max={2.5}
            step={0.25}
            accentColor="#f59e0b"
            onChange={(scalarK) => update({ scalarK })}
          />
        </div>
      )}

      {state.operation !== 'scalar' && (
        <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/25 space-y-2.5">
          <SliderControl
            label={isEn ? 'Head-to-Tail Slide' : 'เลื่อนต่อหัว-หาง (Head-to-Tail Slide)'}
            value={state.slideProgress}
            min={0}
            max={1}
            step={0.05}
            accentColor="#10b981"
            onChange={(slideProgress) => update({ slideProgress })}
          />
          {state.operation === 'add' && (
            <label className="flex items-center justify-between text-xs cursor-pointer pt-1">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {isEn ? 'Show Parallelogram Law' : 'แสดงกฎสี่เหลี่ยมด้านขนาน (Parallelogram)'}
              </span>
              <input
                type="checkbox"
                checked={state.showParallelogram}
                onChange={(e) => update({ showParallelogram: e.target.checked })}
                className="w-4 h-4 accent-sky-600"
              />
            </label>
          )}
        </div>
      )}

      {/* Result Card */}
      <div className="p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 space-y-1.5 text-xs">
        <div className="font-bold text-amber-900 dark:text-amber-200">
          {isEn ? 'Resultant Vector (Gold)' : 'ผลลัพธ์ (Resultant Vector — สีทอง)'}
        </div>
        <div className="overflow-x-auto overflow-y-hidden leading-normal py-0.5 text-slate-900 dark:text-white">
          <KaTeX math={`${opExpr} = ${fmtVecAngle(result)} = ${fmtVecIJK(result)}`} />
        </div>
      </div>
    </div>
  );
}
