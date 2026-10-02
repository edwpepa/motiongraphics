import React from "react";
import { BOLD, C, FONT } from "../theme";
import { mixColor } from "../lib/anim";
import { Avatar, Person } from "./Avatar";
import { Glyph, GlyphName } from "./Icons";
import { LiquidGlass } from "./Glass";

export const CARD_W = 390;
export const CARD_H = 440;

/** Dark glass card (lighter top half, hairline border) — the reference's "Ideas / Tasks / Time" cards. */
export const TaskerCard: React.FC<{
  person: Person;
  name: string;
  role: string;
  roleIcon?: GlyphName;
  rating?: string;
  jobs?: string;
  km?: string;
  selected?: number;
  note?: string;
}> = ({ person, name, role, roleIcon, rating, jobs, km, selected = 0, note }) => (
  <div style={{ position: "relative", width: CARD_W, height: CARD_H, fontFamily: FONT, fontWeight: BOLD, borderRadius: 38, boxShadow: `0 0 ${80 * selected}px rgba(0,191,99,${0.4 * selected})` }}>
    <LiquidGlass width={CARD_W} height={CARD_H} radius={38} tone="dark" strength={70} frost={18} style={{ position: "absolute", left: 0, top: 0 }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: 38, border: `${2 * selected}px solid rgba(0,191,99,${selected})`, pointerEvents: "none" }} />
    <div style={{ position: "absolute", left: 34, top: 44 }}>
      <Avatar person={person} size={124} lit={selected} />
    </div>
    {km && (
      <div
        style={{
          position: "absolute",
          right: 26,
          top: 30,
          padding: "8px 14px 8px 10px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.07)",
          fontSize: 20,
          color: C.nightInkSoft,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Glyph name="pin" size={18} color={C.nightInkSoft} weight={2.4} />
        {km}
      </div>
    )}
    <div style={{ position: "absolute", left: 36, top: 238, right: 30 }}>
      <div style={{ fontSize: 38, color: C.nightInk, letterSpacing: "-0.02em" }}>{name}</div>
      <div style={{ marginTop: 6, fontSize: 24, color: C.nightInkSoft, display: "flex", alignItems: "center", gap: 8 }}>
        {roleIcon && <Glyph name={roleIcon} size={22} color="#4aa8ff" weight={2.4} />}
        {role}
      </div>
      {rating && (
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 23 }}>
          <Glyph name="star" size={22} color="#ffb547" fill="#ffb547" weight={1.5} />
          <span style={{ color: "#ffb547" }}>{rating}</span>
          <span style={{ color: C.nightInkSoft }}>· {jobs}</span>
        </div>
      )}
      {note && <div style={{ marginTop: 24, fontSize: 23, color: C.nightInkSoft }}>{note}</div>}
    </div>
  </div>
);
