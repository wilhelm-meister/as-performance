export function OkBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-[9px] bg-[#f0f7f2] border border-[#c9e2d2] px-4 py-3 text-[13.5px] text-[#1d8a4e] font-medium anim-popin">
      ✓ {message}
    </div>
  );
}
