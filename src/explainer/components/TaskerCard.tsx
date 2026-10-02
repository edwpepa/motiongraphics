import React from "react";
import { C, FONT } from "../theme";
import { mixColor } from "../lib/anim";
import { Avatar } from "./Avatar";

export const CARD_W = 390;
export const CARD_H = 440;

/** Dark glass card (lighter top half, hairline border) — the reference's "Ideas / Tasks / Time" cards. */
export const TaskerCard: React.FC<{
  emoji: string;
  name: string;
  role: string;
  rating?: string;
  jobs?: string;
  km?: string;
  selected?: number;
  avatarBg?: string;
  note?: string;
}> = ({ emoji, name, role, rating, jobs, km, selected = 0, avatarBg, note }) => (
  <div
    style={{
      position: "relative",
      width: CARD_W,
      height: CARD_H,
      borderRadius: 34,
      overflow: "hidden",
      background: C.nightCard,
      border: `${1.5 + 1.5 * selected}px solid ${selected > 0 ? mixColor("#2b302e", C.green, selected) : "rgba(255,255,255,0.08)"}`,
      boxShadow: `0 40px 80px rgba(0,0,0,0.55), 0 0 ${70 * selected}px rgba(0,191,99,${0.35 * selected})`,
      fontFamily: FONT,
    }}
  >
    <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: "47%", background: `linear-gradient(180deg, #2a2f2d 0%, ${C.nightCardTop} 100%)` }} />
    <div style={{ position: "absolute", left: 34, top: 44 }}>
      <Avatar emoji={emoji} size={120} lit={selected} bg={avatarBg} />
    </div>
    {km && (
      <div
        style={{
          position: "absolute",
          right: 26,
          top: 30,
          padding: "8px 14px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.07)",
          fontSize: 20,
          fontWeight: 600,
          color: C.nightInkSoft,
        }}
      >
        📍 {km}
      </div>
    )}
    <div style={{ position: "absolute", left: 36, top: 238, right: 30 }}>
      <div style={{ fontSize: 38, fontWeight: 700, color: C.nightInk, letterSpacing: "-0.02em" }}>{name}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 500, color: C.nightInkSoft }}>{role}</div>
      {rating && (
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 10, fontSize: 23, fontWeight: 600 }}>
          <span style={{ color: "#ffb547" }}>★ {rating}</span>
          <span style={{ color: C.nightInkSoft }}>· {jobs}</span>
        </div>
      )}
      {note && <div style={{ marginTop: 24, fontSize: 23, fontWeight: 600, color: C.nightInkSoft }}>{note}</div>}
    </div>
  </div>
);
