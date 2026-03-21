interface SvgProps {
  className?: string;
  style?: React.CSSProperties;
}

export function FlagSvg({ className, style }: SvgProps) {
  return (
    <svg width="27" height="34" viewBox="0 0 27 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path d="M11.2694 21.2487H17.3871V33.4841H11.2694V21.2487Z" fill="#3F3F3F"/>
      <path d="M5.15172 27.3664H23.5047V33.4841H5.15172V27.3664Z" fill="#3F3F3F"/>
      <path d="M1.9319 30.5862H26.4026V33.4841H1.9319V30.5862Z" fill="#3F3F3F"/>
      <path d="M0 10.4623L11.2694 21.2487H17.3871L17.3977 5.26647e-06L11.2694 0L0 10.4623Z" fill="#BF0000"/>
    </svg>
  );
}

export function MineSvg({ className, style }: SvgProps) {
  return (
    <svg width="151" height="151" viewBox="0 0 151 151" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <g filter="url(#filter0_dii_38_17093)">
        <path d="M60.9244 42.2834C61.1106 42.7721 61.0626 43.2757 60.8514 43.6923C63.1899 43.9787 65.3318 44.901 67.099 46.2811C67.2441 45.8368 67.5665 45.4465 68.0441 45.2325L72.227 43.3577L70.3521 47.5407C70.1381 48.0181 69.7478 48.3404 69.3035 48.4854C70.6836 50.2526 71.6058 52.3946 71.8922 54.7331C72.3087 54.5218 72.8125 54.474 73.3012 54.6602L77.5846 56.2923L73.3012 57.9244C72.8124 58.1106 72.3088 58.0627 71.8922 57.8514C71.6058 60.1899 70.6836 62.3318 69.3035 64.099C69.7478 64.2441 70.1381 64.5665 70.3521 65.0441L72.2269 69.227L68.0441 67.3523C67.5665 67.1382 67.2441 66.7479 67.099 66.3035C65.3318 67.6836 63.1898 68.6058 60.8512 68.8922C61.0626 69.3088 61.1106 69.8125 60.9244 70.3014L59.2923 74.5847L57.6602 70.3014C57.474 69.8125 57.5219 69.3088 57.7333 68.8922C55.3946 68.6058 53.2526 67.6836 51.4853 66.3035C51.3402 66.7478 51.018 67.1381 50.5405 67.3521L46.3576 69.227L48.2323 65.0441C48.4464 64.5666 48.8367 64.2441 49.2809 64.099C47.9009 62.3318 46.9787 60.1899 46.6923 57.8514C46.2757 58.0626 45.7721 58.1106 45.2834 57.9244L41 56.2923L45.2834 54.6602C45.7721 54.474 46.2757 54.5219 46.6923 54.7331C46.9787 52.3946 47.9009 50.2526 49.2809 48.4854C48.8367 48.3404 48.4465 48.018 48.2325 47.5405L46.3576 43.3577L50.5405 45.2325C51.018 45.4465 51.3404 45.8367 51.4854 46.2809C53.2526 44.9009 55.3946 43.9787 57.7331 43.6923C57.5219 43.2757 57.474 42.7721 57.6602 42.2834L59.2923 38L60.9244 42.2834Z" fill="url(#paint0_radial_38_17093)"/>
      </g>
      <defs>
        <filter id="filter0_dii_38_17093" x="0" y="0" width="150.584" height="150.585" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="16" dy="19"/>
          <feGaussianBlur stdDeviation="28.5"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_38_17093"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_38_17093" result="shape"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="2" operator="dilate" in="SourceAlpha" result="effect2_innerShadow_38_17093"/>
          <feOffset dx="-4" dy="-4"/>
          <feGaussianBlur stdDeviation="8.5"/>
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="shape" result="effect2_innerShadow_38_17093"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="4" dy="4"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.72 0"/>
          <feBlend mode="normal" in2="effect2_innerShadow_38_17093" result="effect3_innerShadow_38_17093"/>
        </filter>
        <radialGradient id="paint0_radial_38_17093" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(53.633 50.6331) rotate(45.2938) scale(21.0902)">
          <stop stopColor="white"/>
          <stop offset="0.235577" stopColor="#5F5F5F"/>
          <stop offset="0.563404" stopColor="#212121"/>
          <stop offset="0.826923" stopColor="#070707"/>
        </radialGradient>
      </defs>
    </svg>
  );
}
