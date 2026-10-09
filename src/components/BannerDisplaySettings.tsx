import React, { useEffect, useRef, useState } from "react";
import { Play, Save } from "lucide-react";
import client from "../api/client";

const NAVY = "#1B2A5A"; const TEAL = "#1DAA8A"; const GRAY = "#9CA3AF";

const STYLES: { key: string; name: string; desc: string }[] = [
  { key: "fade",    name: "Fade",    desc: "Soft cross-fade with a gentle zoom" },
  { key: "slide",   name: "Slide",   desc: "Glides sideways, one replaces the next" },
  { key: "zoom",    name: "Zoom",    desc: "Pulls forward and dissolves into the next" },
  { key: "flip",    name: "Flip",    desc: "3D card flip to the next banner" },
  { key: "rise",    name: "Rise",    desc: "Floats up and fades, next rises in" },
  { key: "shuffle", name: "Shuffle", desc: "Mixes all styles so it never gets boring" },
];
const REAL = ["fade", "slide", "zoom", "flip", "rise"];

const CSS = [
  "@keyframes bd-in-fade{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}",
  "@keyframes bd-out-fade{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.04)}}",
  "@keyframes bd-in-slide{from{opacity:0;transform:translateX(45%)}60%{opacity:1}to{opacity:1;transform:translateX(0)}}",
  "@keyframes bd-out-slide{from{opacity:1;transform:translateX(0)}55%{opacity:0}to{opacity:0;transform:translateX(-45%)}}",
  "@keyframes bd-in-zoom{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}",
  "@keyframes bd-out-zoom{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.14)}}",
  "@keyframes bd-in-rise{from{opacity:0;transform:translateY(30px)}60%{opacity:1}to{opacity:1;transform:translateY(0)}}",
  "@keyframes bd-out-rise{from{opacity:1;transform:translateY(0)}60%{opacity:0}to{opacity:0;transform:translateY(-30px)}}",
  "@keyframes bd-in-flip{0%{opacity:0;transform:perspective(900px) rotateY(90deg)}50%{opacity:0;transform:perspective(900px) rotateY(90deg)}51%{opacity:1}100%{opacity:1;transform:perspective(900px) rotateY(0)}}",
  "@keyframes bd-out-flip{0%{opacity:1;transform:perspective(900px) rotateY(0)}49%{opacity:1}50%{opacity:0;transform:perspective(900px) rotateY(-90deg)}100%{opacity:0;transform:perspective(900px) rotateY(-90deg)}}",
].join("\n");

const SAMPLES = [
  { id: "s1", title: "Upgrade to Iterambere", subtitle: "Unlimited products and 2 staff", bgColor: "#1DAA8A", textColor: "#FFFFFF", ctaLabel: "Upgrade" },
  { id: "s2", title: "Advertise here", subtitle: "Reach business owners across Rwanda", bgColor: "#1B2A5A", textColor: "#FFFFFF", ctaLabel: "Contact us" },
  { id: "s3", title: "Become an agent", subtitle: "Earn commission every month", bgColor: "#7C3AED", textColor: "#FFFFFF", ctaLabel: "Join" },
];

function Slide({ a, anim }: { a: any; anim: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0, borderRadius: 14, padding: 18, boxSizing: "border-box",
      background: a.bgColor || NAVY, color: a.textColor || "#fff", overflow: "hidden",
      animation: anim, backfaceVisibility: "hidden",
      ...(a.imageUrl ? { backgroundImage: "url(" + a.imageUrl + ")", backgroundSize: "cover", backgroundPosition: "center" } : {}),
    }}>
      <div style={{ fontSize: 15, fontWeight: 800 }}>{a.title}</div>
      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>{a.subtitle}</div>
      {a.ctaLabel && <span style={{ display: "inline-block", marginTop: 12, background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{a.ctaLabel}</span>}
    </div>
  );
}

export default function BannerDisplaySettings({ slides }: { slides: any[] }) {
  const [style, setStyle]     = useState("fade");
  const [seconds, setSeconds] = useState(6);
  const [saved, setSaved]     = useState({ style: "fade", seconds: 6 });
  const [msg, setMsg]         = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving]   = useState(false);

  // live preview
  const list = slides && slides.length > 0 ? slides : SAMPLES;
  const [cur, setCur]   = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [pStyle, setPStyle] = useState("fade");
  const curRef = useRef(0);
  curRef.current = cur;

  useEffect(() => {
    client.get("/announcements/display-settings").then(r => {
      const st = r.data?.style || "fade";
      const sec = Number(r.data?.dwellSeconds) || 6;
      setStyle(st); setSeconds(sec); setSaved({ style: st, seconds: sec });
    }).catch(() => {});
  }, []);

  const advance = () => {
    if (list.length < 2) return;
    const real = style === "shuffle" ? REAL[Math.floor(Math.random() * REAL.length)] : style;
    setPStyle(real);
    setPrev(curRef.current);
    setCur((curRef.current + 1) % list.length);
    setTick(t => t + 1);
  };

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(advance, seconds * 1000);
    return () => clearInterval(t);
  }, [style, seconds, list.length]);

  const dirty = style !== saved.style || seconds !== saved.seconds;

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await client.put("/announcements/display-settings", { style, dwellSeconds: seconds });
      setSaved({ style, seconds });
      setMsg({ ok: true, text: "Saved. Apps pick this up within a few minutes." });
    } catch (e: any) {
      const code = e?.response?.status;
      setMsg({ ok: false, text: code === 403 ? "Only Admin or Super Admin can change banner display." : "Could not save. Try again." });
    } finally { setSaving(false); }
  };

  const curAd  = list[cur % list.length];
  const prevAd = prev !== null ? list[prev % list.length] : null;

  return (
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: 20, marginBottom: 24 }}>
      <style>{CSS}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: NAVY }}>Banner display</h3>
        <button onClick={save} disabled={!dirty || saving}
          style={{ display: "flex", alignItems: "center", gap: 6, background: dirty ? NAVY : "#E5E7EB", color: dirty ? "#fff" : GRAY, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 12, cursor: dirty ? "pointer" : "default" }}>
          <Save size={14} /> {saving ? "Saving..." : "Save display"}
        </button>
      </div>
      <p style={{ color: GRAY, fontSize: 12, margin: "0 0 14px" }}>
        The app shows one banner at a time, then swaps to the next with the animation you choose. Admin and Super Admin only.
      </p>

      {msg && <div style={{ background: msg.ok ? "#ECFDF5" : "#FEF2F2", color: msg.ok ? "#059669" : "#DC2626", padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontWeight: 700, fontSize: 12 }}>{msg.text}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 18 }}>
            {STYLES.map(s => (
              <div key={s.key} onClick={() => setStyle(s.key)}
                style={{ cursor: "pointer", borderRadius: 12, padding: "12px 14px", border: style === s.key ? "2px solid " + TEAL : "2px solid #E5E7EB", background: style === s.key ? "#F0FDFA" : "#fff" }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: NAVY }}>{s.name}</div>
                <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>{s.desc}</div>
              </div>
            ))}
          </div>

          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            SECONDS PER BANNER: <span style={{ color: TEAL }}>{seconds}s</span>
          </label>
          <input type="range" min={3} max={15} step={1} value={seconds} onChange={e => setSeconds(Number(e.target.value))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: GRAY }}>
            <span>3s quick</span><span>6s balanced</span><span>15s slow</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <Play size={11} color={TEAL} /> LIVE PREVIEW ({list === SAMPLES ? "sample banners" : "your active banners"})
          </div>
          <div style={{ position: "relative", height: 130, borderRadius: 14, overflow: "hidden", background: "#F3F4F6" }}>
            {prevAd && <Slide key={"o" + tick} a={prevAd} anim={"bd-out-" + pStyle + " 750ms cubic-bezier(.4,0,.2,1) forwards"} />}
            <Slide key={"i" + tick} a={curAd} anim={tick === 0 ? "none" : "bd-in-" + pStyle + " 750ms cubic-bezier(.4,0,.2,1) forwards"} />
          </div>
          <div style={{ fontSize: 11, color: GRAY, marginTop: 8 }}>
            Style: <b style={{ color: NAVY }}>{style}</b> &middot; each banner stays {seconds}s
          </div>
        </div>
      </div>
    </div>
  );
}
