import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  threshold = 0.05,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not available (SSR / legacy), reveal immediately
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        threshold,
        // Start fading in slightly before the element enters the viewport to be ultra-smooth
        rootMargin: "0px 0px 60px 0px",
      },
    );

    const el = ref.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [threshold]);

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          transitionDelay: `${delay}ms`,
        }}
        className={`transition-all duration-500 ease-out will-change-transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
