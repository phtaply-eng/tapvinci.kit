export default function StudentEducation({
  school, course, yearLevel,
}: { school: string | null; course: string | null; yearLevel: string | null }) {
  if (!school && !course && !yearLevel) return null
  const chip = 'rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300'
  return (
    <section className="border-t border-white/10 px-5 py-5">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">🎓 Education</p>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        {school && <p className="text-sm font-semibold text-white">{school}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {yearLevel && <span className={chip}>{yearLevel}</span>}
          {course && <span className={chip}>{course}</span>}
        </div>
      </div>
    </section>
  )
}