export function Stepper({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => {
          const cls = n < index ? 'bg-emerald-500' : n === index ? 'bg-gray-400' : 'bg-gray-300';
          return <span key={n} className={`h-1.5 w-6 rounded-full ${cls}`} />;
        })}
      </div>
      <span>Step {index} of 3</span>
    </div>
  );
}
