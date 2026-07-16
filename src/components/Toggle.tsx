"use client";

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-[40px] h-[24px] rounded-full transition-colors duration-150 shrink-0 cursor-pointer disabled:opacity-50 ${
        checked ? "bg-[#0071e3]" : "bg-[#d2d2d7]"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-150 ${
          checked ? "translate-x-[16px]" : ""
        }`}
      />
    </button>
  );
}
