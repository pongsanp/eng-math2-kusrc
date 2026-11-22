import type { SlideDef, SlideEmbed3DKind } from '../../slides/ch1SlidesData';
import { CH1_SLIDES } from '../../slides/ch1SlidesData';
import type { PrintScope } from '../../slides/inkUtils';
import { KaTeX } from '../KaTeX';
import { RichMathText } from './RichMathText';

interface SlidePrintViewProps {
  includeInk: boolean;
  inkImagesBySlide: Record<number, string>;
  printScope: PrintScope;
}

function StaticDiagramSVG({ kind }: { kind: SlideEmbed3DKind }) {
  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-bold text-slate-600 flex items-center justify-between">
        <span>แผนภาพประกอบ 3 มิติ (Interactive 3D บนเว็บ)</span>
        <span className="font-mono text-xs text-sky-700">pongsanp.github.io/eng-math2-kusrc</span>
      </div>
      <svg viewBox="0 0 240 190" className="w-full flex-1 my-2">
        <defs>
          <marker id="arr-sky" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#0284c7" />
          </marker>
          <marker id="arr-em" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#059669" />
          </marker>
          <marker id="arr-am" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#d97706" />
          </marker>
          <marker id="arr-rose" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#e11d48" />
          </marker>
        </defs>
        {/* Base 3D Axes */}
        <line x1="100" y1="115" x2="45" y2="155" stroke="#ef4444" strokeWidth="1.5" />
        <line x1="100" y1="115" x2="205" y2="115" stroke="#10b981" strokeWidth="1.5" />
        <line x1="100" y1="115" x2="100" y2="25" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="36" y="164" fontSize="11" fontWeight="bold" fill="#ef4444">x</text>
        <text x="210" y="119" fontSize="11" fontWeight="bold" fill="#10b981">y</text>
        <text x="96" y="18" fontSize="11" fontWeight="bold" fill="#3b82f6">z</text>

        {kind === 'plot_point' && (
          <g>
            <polyline points="100,115 72,135 160,135 160,60" fill="none" stroke="#0284c7" strokeWidth="2.5" />
            <rect x="72" y="60" width="88" height="75" fill="none" stroke="#94a3b8" strokeDasharray="3 3" />
            <circle cx="160" cy="60" r="5" fill="#f59e0b" />
            <text x="166" y="56" fontSize="11" fontWeight="bold" fill="#b45309">P(x, y, z)</text>
          </g>
        )}

        {kind === 'arithmetic' && (
          <g>
            <line x1="100" y1="115" x2="145" y2="85" stroke="#0284c7" strokeWidth="2.5" markerEnd="url(#arr-sky)" />
            <line x1="145" y1="85" x2="190" y2="105" stroke="#059669" strokeWidth="2.2" strokeDasharray="4 2" markerEnd="url(#arr-em)" />
            <line x1="100" y1="115" x2="190" y2="105" stroke="#d97706" strokeWidth="2.8" markerEnd="url(#arr-am)" />
            <text x="116" y="92" fontSize="11" fontWeight="bold" fill="#0284c7">u</text>
            <text x="172" y="88" fontSize="11" fontWeight="bold" fill="#059669">v</text>
            <text x="148" y="124" fontSize="11" fontWeight="bold" fill="#d97706">u + v</text>
          </g>
        )}

        {(kind === 'dir_angles' || kind === 'projection') && (
          <g>
            <line x1="100" y1="115" x2="165" y2="55" stroke="#0284c7" strokeWidth="2.6" markerEnd="url(#arr-sky)" />
            <line x1="100" y1="115" x2="195" y2="115" stroke="#059669" strokeWidth="2.2" markerEnd="url(#arr-em)" />
            <line x1="165" y1="55" x2="165" y2="115" stroke="#e11d48" strokeWidth="1.6" strokeDasharray="3 3" />
            <line x1="100" y1="115" x2="165" y2="115" stroke="#d97706" strokeWidth="3" markerEnd="url(#arr-am)" />
            <text x="130" y="75" fontSize="11" fontWeight="bold" fill="#0284c7">u</text>
            <text x="132" y="132" fontSize="10" fontWeight="bold" fill="#d97706">Proj_v(u)</text>
          </g>
        )}

        {kind === 'cross' && (
          <g>
            <polygon points="100,115 155,140 205,115 150,90" fill="rgba(6,182,212,0.18)" stroke="#0891b2" strokeDasharray="3 2" />
            <line x1="100" y1="115" x2="155" y2="140" stroke="#0284c7" strokeWidth="2.5" markerEnd="url(#arr-sky)" />
            <line x1="100" y1="115" x2="150" y2="90" stroke="#059669" strokeWidth="2.5" markerEnd="url(#arr-em)" />
            <line x1="100" y1="115" x2="100" y2="40" stroke="#e11d48" strokeWidth="3" markerEnd="url(#arr-rose)" />
            <text x="108" y="45" fontSize="11" fontWeight="bold" fill="#e11d48">u × v</text>
          </g>
        )}

        {kind === 'triple' && (
          <g>
            <polygon points="100,115 155,135 190,110 135,90" fill="rgba(139,92,246,0.12)" stroke="#7c3aed" strokeDasharray="3 2" />
            <polygon points="112,55 167,75 202,50 147,30" fill="rgba(139,92,246,0.16)" stroke="#7c3aed" strokeDasharray="3 2" />
            <line x1="100" y1="115" x2="112" y2="55" stroke="#d97706" strokeWidth="2.5" markerEnd="url(#arr-am)" />
            <line x1="100" y1="115" x2="155" y2="135" stroke="#0284c7" strokeWidth="2.5" markerEnd="url(#arr-sky)" />
            <line x1="100" y1="115" x2="135" y2="90" stroke="#059669" strokeWidth="2.5" markerEnd="url(#arr-em)" />
            <text x="155" y="148" fontSize="10" fontWeight="bold" fill="#6d28d9">V = |u · (v × w)|</text>
          </g>
        )}

        {kind === 'line3d' && (
          <g>
            <line x1="40" y1="95" x2="215" y2="45" stroke="#2563eb" strokeWidth="2.5" />
            <circle cx="110" cy="75" r="4.5" fill="#0284c7" />
            <circle cx="165" cy="59" r="5" fill="#d97706" />
            <line x1="100" y1="115" x2="110" y2="75" stroke="#6366f1" strokeWidth="1.8" />
            <line x1="100" y1="115" x2="165" y2="59" stroke="#d97706" strokeWidth="1.8" strokeDasharray="3 2" />
            <text x="102" y="65" fontSize="10" fontWeight="bold" fill="#0284c7">P₀</text>
            <text x="165" y="48" fontSize="10" fontWeight="bold" fill="#b45309">P(t)</text>
          </g>
        )}
      </svg>
      <div className="text-xs text-slate-500 text-center">
        สแกนหรือเปิดเว็บเพื่อหมุนกราฟ 3 มิติแบบ Interactive
      </div>
    </div>
  );
}

function renderPrintSlide(
  slide: SlideDef,
  index: number,
  total: number,
  includeInk: boolean,
  scopeText: string,
  inkDataUrl?: string,
) {
  return (
    <div
      key={slide.id}
      className="print-slide-page bg-white text-slate-900 p-5 pb-3 flex flex-col justify-between border border-slate-200"
    >
      {/* Slide Stage (matches on-screen overlay stage for 1:1 handwritten ink alignment) */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 pb-2.5">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">01417168</span>
              <span>{slide.tagTh}</span>
              <span className="text-slate-400">• {slide.tagEn}</span>
            </div>
            <h2 className="text-[28px] leading-tight font-extrabold text-slate-900 mt-1">
              {slide.titleTh}
            </h2>
            <p className="text-sm text-slate-500">{slide.subtitle ?? slide.titleEn}</p>
          </div>
          <div className="text-sm font-mono font-bold text-slate-500 shrink-0">
            {index + 1} / {total}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 py-3">
          {slide.kind === 'example' && slide.examples ? (
            <div className="h-full flex flex-col gap-3">
              {slide.examples.map((ex, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col rounded-2xl border border-slate-200 p-4 bg-slate-50/50"
                >
                  <div className="text-[19px] font-bold text-slate-900 leading-snug">
                    {ex.label && (
                      <span
                        className={`mr-2 px-2.5 py-0.5 rounded text-sm font-bold ${
                          ex.label.includes('แนวข้อสอบ')
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {ex.label}
                      </span>
                    )}
                    <RichMathText text={ex.promptTh} />
                  </div>
                  {ex.promptLatex && (
                    <div className="mt-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 inline-block text-[20px] text-sky-900">
                      <KaTeX math={ex.promptLatex} />
                    </div>
                  )}

                  <div
                    className="flex-1 mt-2.5 rounded-xl border border-dashed border-slate-300 bg-white"
                    style={{
                      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                      backgroundSize: '18px 18px',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={`h-full grid gap-4 ${slide.embed3D ? 'grid-cols-12' : 'grid-cols-1'}`}>
              <div
                className={
                  slide.embed3D
                    ? 'col-span-7 flex flex-col justify-center gap-3'
                    : slide.kind === 'summary'
                      ? 'grid grid-cols-2 gap-4 items-stretch'
                      : 'flex flex-col justify-center gap-3'
                }
              >
                {slide.cards?.map((card, cIdx) => (
                  <div
                    key={cIdx}
                    className={`rounded-2xl border border-slate-200 bg-slate-50/60 ${
                      slide.kind === 'summary'
                        ? 'p-3.5 space-y-1.5 flex flex-col justify-between'
                        : 'p-4 space-y-2'
                    }`}
                  >
                    <div className="text-[19px] font-bold text-slate-800">
                      <RichMathText text={card.heading} />
                    </div>
                    {card.bullets && (
                      <ul className="space-y-1.5 text-[17px] text-slate-700 list-disc pl-6 leading-relaxed">
                        {card.bullets.map((b, bIdx) => (
                          <li key={bIdx}>
                            <RichMathText text={b} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {card.formulas && (
                      <div
                        className={
                          card.formulaCols === 2 ? 'grid grid-cols-2 gap-2' : 'space-y-2'
                        }
                      >
                        {card.formulas.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className={`rounded-xl bg-white border border-slate-200 px-3.5 py-2 ${
                              slide.kind === 'summary' ? 'text-[16px]' : 'text-[18px]'
                            }`}
                          >
                            {f.label && (
                              <div className="text-[13px] font-semibold text-slate-500 mb-0.5">
                                {f.label}
                              </div>
                            )}
                            <KaTeX math={f.latex} />
                          </div>
                        ))}
                      </div>
                    )}
                    {card.note && (
                      <div className="text-[14px] font-semibold text-amber-800">{card.note}</div>
                    )}
                  </div>
                ))}
              </div>
              {slide.embed3D && (
                <div className="col-span-5">
                  <StaticDiagramSVG kind={slide.embed3D} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transparent Handwritten Ink PNG Overlay */}
        {includeInk && inkDataUrl && (
          <img
            src={inkDataUrl}
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2">
        <span>01417168 คณิตศาสตร์วิศวกรรม II • คณะวิทยาศาสตร์ ศรีราชา ม.เกษตรศาสตร์</span>
        <span>
          {scopeText} •{' '}
          {includeInk ? 'ฉบับรวมลายมือประกอบการสอน' : 'ฉบับเว้นที่เขียนประกอบการสอน (GoodNotes)'}
        </span>
      </div>
    </div>
  );
}

export function SlidePrintView({
  includeInk,
  inkImagesBySlide,
  printScope,
}: SlidePrintViewProps) {
  const slidesToPrint =
    printScope === 'lec1'
      ? CH1_SLIDES.filter((s) => s.lecture === 1)
      : printScope === 'lec2'
        ? CH1_SLIDES.filter((s) => s.lecture === 2)
        : CH1_SLIDES;

  const scopeText =
    printScope === 'lec1' ? 'คาบที่ 1' : printScope === 'lec2' ? 'คาบที่ 2' : 'ครบทั้งบท';

  return (
    <div className="hidden print:block">
      {slidesToPrint.map((s, idx) =>
        renderPrintSlide(s, idx, slidesToPrint.length, includeInk, scopeText, inkImagesBySlide[s.id]),
      )}
    </div>
  );
}
