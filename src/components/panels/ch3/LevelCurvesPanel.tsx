import type { Ch3LevelCurvesState } from '../../../types';
import { MULTIVAR_FUNCS } from '../../../math/multivar';
import { SliderControl } from '../../SliderControl';

interface LevelCurvesPanelProps {
  state: Ch3LevelCurvesState;
  onChange: (next: Ch3LevelCurvesState) => void;
}

const FUNC_IDS = ['gaussian', 'paraboloid', 'saddle', 'waves', 'dome'] as const;

export function LevelCurvesPanel({ state, onChange }: LevelCurvesPanelProps) {
  const update = (patch: Partial<Ch3LevelCurvesState>) => onChange({ ...state, ...patch });
  const spec = MULTIVAR_FUNCS[state.funcId];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          เลือกฟังก์ชันสองตัวแปร z = f(x, y)
        </h3>
        <div className="grid grid-cols-1 gap-1.5">
          {FUNC_IDS.map((fid) => {
            const f = MULTIVAR_FUNCS[fid];
            const active = state.funcId === fid;
            return (
              <button
                key={fid}
                type="button"
                onClick={() => update({ funcId: fid })}
                className={`px-3 py-2 rounded-xl border text-left transition text-xs flex items-center justify-between gap-2 ${
                  active
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="truncate">{f.name.th}</span>
                <span className="text-[10px] opacity-75 shrink-0">{f.name.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          ปรับรูปร่างและความสูงตัด (Parameters & Level k)
        </div>
        <SliderControl
          label={state.funcId === 'dome' ? 'ขนาดรัศมีทรงกลม (a)' : 'ตัวคูณความสูง/ความชัน (a)'}
          value={state.scaleA}
          min={0.6}
          max={1.5}
          step={0.1}
          onChange={(scaleA) => update({ scaleA })}
        />
        <SliderControl
          label="ระดับตัด z = k (Level Curve Height)"
          value={state.sliceK}
          min={spec.zRange[0]}
          max={spec.zRange[1]}
          step={0.2}
          accentColor="#f59e0b"
          onChange={(sliceK) => update({ sliceK })}
        />
      </div>

      <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
        <strong>เส้นชั้นระดับ (Level Curve)</strong> คือรอยตัดของผิว 3 มิติด้วยระนาบแนวนอน <span className="font-mono font-bold">z = k</span> เมื่อฉายลงบนระนาบ <span className="font-mono font-bold">xy</span> จะได้แผนที่ความสูงด้านขวาล่าง
      </div>

      <div className="space-y-2 text-xs">
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            แสดงระนาบตัด z = k (Slicing Plane)
          </span>
          <input
            type="checkbox"
            checked={state.showSlicePlane}
            onChange={(e) => update({ showSlicePlane: e.target.checked })}
            className="w-4 h-4 accent-amber-500"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            แสดงแผนที่เส้นชั้นบนพื้นด้านล่าง (Floor Contours)
          </span>
          <input
            type="checkbox"
            checked={state.showContoursOnFloor}
            onChange={(e) => update({ showContoursOnFloor: e.target.checked })}
            className="w-4 h-4 accent-sky-600"
          />
        </label>
      </div>
    </div>
  );
}
