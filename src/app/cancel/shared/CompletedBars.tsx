export function CompletedBars() {
  return (
    <div className="flex items-center gap-2">
      {[1,2,3].map(n => <span key={n} className="h-1.5 w-6 rounded-full bg-emerald-500" />)}
    </div>
  );
}
