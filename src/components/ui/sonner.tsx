import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group font-sans"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#10141b]/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-[#e2e8f0] group-[.toaster]:border group-[.toaster]:border-white/[0.12] group-[.toaster]:shadow-[0_12px_40px_rgba(0,0,0,0.6)] group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:text-sm group-[.toaster]:gap-3",
          title: "font-bold text-white tracking-tight text-xs sm:text-sm",
          description: "group-[.toast]:text-gray-300 group-[.toast]:text-xs font-normal leading-relaxed mt-0.5",
          actionButton:
            "group-[.toast]:bg-[#00D084] group-[.toast]:text-black group-[.toast]:font-black group-[.toast]:rounded-xl group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs hover:group-[.toast]:bg-[#00b875] transition-all",
          cancelButton:
            "group-[.toast]:bg-white/[0.08] group-[.toast]:text-gray-300 group-[.toast]:rounded-xl group-[.toast]:text-xs hover:group-[.toast]:bg-white/[0.15] transition-all",
          closeButton:
            "!border-white/[0.1] !bg-[#141a23] !text-gray-400 hover:!text-white hover:!bg-white/[0.1] !rounded-lg !transition",
          success:
            "!border-[#00D084]/40 !bg-[#10141b]/95 !text-[#e2e8f0] [&_[data-icon]]:!text-[#00D084] shadow-[0_8px_32px_rgba(0,208,132,0.18)]",
          error:
            "!border-rose-500/40 !bg-[#10141b]/95 !text-[#e2e8f0] [&_[data-icon]]:!text-rose-400 shadow-[0_8px_32px_rgba(244,63,94,0.18)]",
          warning:
            "!border-amber-500/40 !bg-[#10141b]/95 !text-[#e2e8f0] [&_[data-icon]]:!text-amber-400 shadow-[0_8px_32px_rgba(245,158,11,0.18)]",
          info:
            "!border-sky-500/40 !bg-[#10141b]/95 !text-[#e2e8f0] [&_[data-icon]]:!text-sky-400 shadow-[0_8px_32px_rgba(14,165,233,0.18)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
