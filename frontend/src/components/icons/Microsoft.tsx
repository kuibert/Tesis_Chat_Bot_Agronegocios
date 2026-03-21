import React from "react";

type SvgProps = React.ComponentProps<"svg">;

interface MicrosoftIconProps extends SvgProps {}

export const MicrosoftIcon = ({ ...props }: MicrosoftIconProps) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fill="#f3f3f3" d="M0 0h23v23H0z" />
    <path fill="#f25022" d="M1 1h10v10H1z" />
    <path fill="#7db300" d="M12 1h10v10H12z" />
    <path fill="#00a4ef" d="M1 12h10v10H1z" />
    <path fill="#ffb900" d="M12 12h10v10H12z" />
  </svg>
);
