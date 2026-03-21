// Inline SVG digit components from design assets
// Each number uses the exact pixel-segment style from the Figma/design files

interface SvgProps {
  className?: string;
  style?: React.CSSProperties;
}

// "0" — same segment style, all bars except middle
export function Num0({ className, style }: SvgProps) {
  return (
    <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      {/* top-left vertical */}
      <path d="M6.46707 0V19.8323H0V0H6.46707Z" fill="#222222"/>
      {/* top-right vertical */}
      <path d="M23.5689 0V19.8323H17.1018V0H23.5689Z" fill="#222222"/>
      {/* bottom-left vertical */}
      <path d="M6.46707 13.3653V33.1976H0V13.3653H6.46707Z" fill="#222222"/>
      {/* bottom-right vertical */}
      <path d="M23.5689 13.3653V33.1976H17.1018V13.3653H23.5689Z" fill="#222222"/>
      {/* top bar */}
      <path d="M23.5689 6.46707H0V0H23.5689V6.46707Z" fill="#222222"/>
      {/* bottom bar */}
      <path d="M23.5689 33.1976H0V26.7305H23.5689V33.1976Z" fill="#222222"/>
    </svg>
  );
}

export function Num1({ className, style }: SvgProps) {
  return (
    <svg width="7" height="34" viewBox="0 0 7 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M6.46707 0V33.3413H0V0H6.46707Z" fill="#0000FF"/>
    </svg>
  );
}

export function Num2({ className, style }: SvgProps) {
  return (
    <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M23.5689 1.03023e-06V19.8323H17.1018V1.03023e-06H23.5689Z" fill="#008000"/>
      <path d="M6.46707 13.3653V33.1976H9.85091e-07V13.3653H6.46707Z" fill="#008000"/>
      <path d="M23.5689 6.46707L0 6.46707L2.82684e-07 0L23.5689 1.03023e-06V6.46707Z" fill="#008000"/>
      <path d="M23.5689 33.3413L0 33.3413L2.82684e-07 26.8743H23.5689V33.3413Z" fill="#008000"/>
      <path d="M23.5689 19.8323L0 19.8323L9.85091e-07 13.3653H23.5689V19.8323Z" fill="#008000"/>
    </svg>
  );
}

export function Num3({ className, style }: SvgProps) {
  return (
    <svg width="22" height="34" viewBox="0 0 22 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M21.2695 9.29718e-07V33.3413H14.8024V9.29718e-07H21.2695Z" fill="#FF0000"/>
      <path d="M21.2695 6.46707L0 6.46707L2.82684e-07 0L21.2695 9.29718e-07V6.46707Z" fill="#FF0000"/>
      <path d="M21.2695 33.3413L0 33.3413L2.82684e-07 26.8743H21.2695V33.3413Z" fill="#FF0000"/>
      <path d="M21.2695 19.9042H0L2.82684e-07 13.4371L21.2695 13.4371V19.9042Z" fill="#FF0000"/>
    </svg>
  );
}

export function Num4({ className, style }: SvgProps) {
  return (
    <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M23.5689 0V19.8323H17.1018V0H23.5689Z" fill="#000080"/>
      <path d="M23.5689 13.3653V33.1976H17.1018V13.3653H23.5689Z" fill="#000080"/>
      <path d="M6.46707 0V19.8323H7.02407e-07V0H6.46707Z" fill="#000080"/>
      <path d="M23.5689 19.8323H7.02407e-07L0 13.3653L23.5689 13.3653V19.8323Z" fill="#000080"/>
    </svg>
  );
}

export function Num5({ className, style }: SvgProps) {
  return (
    <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M6.46707 0V19.8323H9.85091e-07V0H6.46707Z" fill="#800000"/>
      <path d="M23.5689 13.3653V33.1976H17.1018V13.3653H23.5689Z" fill="#800000"/>
      <path d="M23.5689 6.46707L0 6.46707L9.85091e-07 0L23.5689 1.09644e-06V6.46707Z" fill="#800000"/>
      <path d="M23.5689 19.8323H9.85091e-07L2.82685e-07 13.3653L23.5689 13.3653V19.8323Z" fill="#800000"/>
      <path d="M23.5689 33.1976H0L2.82685e-07 26.7305H23.5689V33.1976Z" fill="#800000"/>
    </svg>
  );
}

export function Num6({ className, style }: SvgProps) {
  return (
    <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M6.46707 0V33.1976H9.85091e-07V0H6.46707Z" fill="#008080"/>
      <path d="M23.5689 13.3653V33.1976H17.1018V13.3653H23.5689Z" fill="#008080"/>
      <path d="M23.5689 6.46707L0 6.46707L9.85091e-07 0L23.5689 1.09644e-06V6.46707Z" fill="#008080"/>
      <path d="M23.5689 19.8323H0L2.82684e-07 13.3653L23.5689 13.3653V19.8323Z" fill="#008080"/>
      <path d="M23.5689 33.1976H9.85091e-07L2.82684e-07 26.7305H23.5689V33.1976Z" fill="#008080"/>
    </svg>
  );
}

export function Num7({ className, style }: SvgProps) {
  return (
    <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M23.5689 0V19.8323H17.1018V0H23.5689Z" fill="black"/>
      <path d="M23.5689 13.3653V33.1976H17.1018V13.3653H23.5689Z" fill="black"/>
      <path d="M23.5689 6.46707L0 6.46707L2.82684e-07 6.62122e-08L23.5689 0V6.46707Z" fill="black"/>
    </svg>
  );
}

export function Num8({ className, style }: SvgProps) {
  return (
    <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M6.46707 0V19.8323H9.85091e-07V0H6.46707Z" fill="#808080"/>
      <path d="M23.5689 0V19.8323H17.1018V0H23.5689Z" fill="#808080"/>
      <path d="M23.5689 13.3653V33.1976H17.1018V13.3653H23.5689Z" fill="#808080"/>
      <path d="M6.46707 13.3653V33.1976H9.85091e-07V13.3653H6.46707Z" fill="#808080"/>
      <path d="M23.5689 6.46707L0 6.46707L9.85091e-07 0H23.5689V6.46707Z" fill="#808080"/>
      <path d="M23.5689 19.8323H9.85091e-07V13.3653H23.5689V19.8323Z" fill="#808080"/>
      <path d="M23.5689 33.1976H9.85091e-07L2.82684e-07 26.7305H23.5689V33.1976Z" fill="#808080"/>
    </svg>
  );
}

export const NUMBER_SVGS: Record<number, React.ComponentType<SvgProps>> = {
  0: Num0,
  1: Num1,
  2: Num2,
  3: Num3,
  4: Num4,
  5: Num5,
  6: Num6,
  7: Num7,
  8: Num8,
};
