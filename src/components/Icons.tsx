import React from "react";
import { COLORS } from "../constants";

const base = {
  fill: "none",
  stroke: COLORS.white,
  strokeWidth: 5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const FaucetIcon: React.FC<{ size?: number; color?: string; accent?: string }> = ({ size = 64, color = COLORS.ink, accent = COLORS.green }) => {
  const s = { ...base, stroke: color };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path {...s} d="M14 28V18a6 6 0 0 1 6-6h8" />
      <path {...s} d="M28 12h14a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H30" />
      <path {...s} d="M14 28h16a6 6 0 0 1 6 6v2" />
      <circle cx={14} cy={33} r={3} fill={accent} stroke="none" />
      <path stroke={accent} strokeWidth={5} strokeLinecap="round" d="M14 40c0 4 4 4 4 8" />
    </svg>
  );
};

export const CabinetIcon: React.FC<{ size?: number; color?: string; accent?: string }> = ({ size = 64, color = COLORS.ink, accent = COLORS.green }) => {
  const s = { ...base, stroke: color };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect {...s} x={12} y={10} width={40} height={44} rx={4} />
      <line {...s} x1={32} y1={10} x2={32} y2={54} />
      <circle cx={26} cy={32} r={2.5} fill={accent} stroke="none" />
      <circle cx={38} cy={32} r={2.5} fill={accent} stroke="none" />
    </svg>
  );
};

export const PaintRollerIcon: React.FC<{ size?: number; color?: string; accent?: string }> = ({ size = 64, color = COLORS.ink, accent = COLORS.green }) => {
  const s = { ...base, stroke: color };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect {...s} x={10} y={14} width={28} height={16} rx={4} />
      <line {...s} x1={44} y1={22} x2={44} y2={50} />
      <line {...s} x1={44} y1={50} x2={52} y2={50} />
      <circle cx={24} cy={22} r={3} fill={accent} stroke="none" />
    </svg>
  );
};

export const BuildingIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect {...base} x={16} y={10} width={32} height={44} rx={2} />
    <line {...base} x1={24} y1={20} x2={24} y2={20} />
    <line {...base} x1={24} y1={28} x2={30} y2={28} />
    <line {...base} x1={34} y1={28} x2={40} y2={28} />
    <line {...base} x1={24} y1={38} x2={30} y2={38} />
    <line {...base} x1={34} y1={38} x2={40} y2={38} />
    <rect {...base} x={27} y={46} width={10} height={8} />
  </svg>
);

export const ChainIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect {...base} x={8} y={24} width={22} height={16} rx={8} />
    <rect {...base} x={34} y={24} width={22} height={16} rx={8} />
  </svg>
);

export const CheckBadge: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx={24} cy={24} r={22} fill={COLORS.green} />
    <path stroke={COLORS.white} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M15 24l6 6 12-13" />
  </svg>
);

export const StopwatchIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = COLORS.white }) => {
  const s = { ...base, stroke: color };
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle {...s} cx={20} cy={22} r={13} />
      <line {...s} x1={20} y1={22} x2={20} y2={14} />
      <line {...s} x1={20} y1={22} x2={25} y2={25} />
      <line {...s} x1={16} y1={5} x2={24} y2={5} />
    </svg>
  );
};
