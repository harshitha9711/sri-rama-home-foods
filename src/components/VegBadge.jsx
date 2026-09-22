export default function VegBadge({ type }) {
  const isNonVeg =
    type === "non_veg" ||
    type === "non-veg" ||
    type === "nonveg";

  if (isNonVeg) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-red-600 shadow-sm">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-red-500 bg-red-500" />
        NON-VEG
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-green-700 shadow-sm">
      <span className="h-2.5 w-2.5 rounded-full border-2 border-green-600 bg-green-600" />
      VEG
    </span>
  );
}