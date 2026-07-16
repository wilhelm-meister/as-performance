export function PlateChip({ plate }: { plate: string }) {
  return (
    <span className="font-mono font-semibold text-[13px] bg-[#1d1d1f] text-white px-2 py-[3px] rounded-[5px] tracking-[0.5px] whitespace-nowrap">
      {plate}
    </span>
  );
}
