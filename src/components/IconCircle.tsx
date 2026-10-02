import React from "react";
import { COLORS } from "../constants";

interface IconCircleProps {
  size?: number;
  children: React.ReactNode;
}

/** Light-green circular icon chip, matching the real app's "Local / Chat / Verificat" row. */
export const IconCircle: React.FC<IconCircleProps> = ({ size = 76, children }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: COLORS.greenTint,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);
