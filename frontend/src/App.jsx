import { useState } from "react";

const SCALE = [
  { max: 50, name: "Good", color: "#2f9e5b" },
  { max: 100, name: "Moderate", color: "#e3b81f" },
  { max: 150, name: "Unhealthy for Sensitive Groups", color: "#ef8a2b" },
  { max: 200, name: "Unhealthy", color: "#d6452f" },
  { max: 300, name: "Very Unhealthy", color: "#8a3a8c" },
  { max: 500, name: "Hazardous", color: "#6b1f33" },
];
const colorFor = (aqi) => (SCALE.find((s) => aqi <= s.max) || SCALE[5]).color;

function Scale({ aqi }) {
  const pct = aqi == null ? null : Math.min(aqi, 500) / 5;
  return (
    <div className="scale" role="img" aria-label={aqi == null ? "AQI scale from 0 to 500" : `AQI ${aqi} on a 0 to 500 scale`}>
      <div className="bar">
        {SCALE.map((s, i) => (
          <span key={s.name} style={{ background: s.color, flex: s.max - (SCALE[i - 1]?.max ?? 0) }} />
        ))}
        {pct != null && <i className="marker" style={{ left: `${pct}%` }} />}
      </div>
      <div className="ticks"><span>0</span><span>100</span><span>200</span><span>300</span><span>500</span></div>
    </div>
  );
}

function List({ title, items, tone }) {
  return (
    <section className={`panel ${tone}`}>
      <h3>{title}</h3>
      <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </section>
  );
}

export default function App() {
  const [form, setForm] = useState({ location: "", aqi: "", concern: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const liveAqi = form.aqi !== "" && +form.aqi >= 0 && +form.aqi <= 500 ? +form.aqi : null;

  async function submit(e) {
    e.preventDefault();
    setError("");
    const aqi = Number(form.aqi);
    if (form.location.trim().length < 2) return setError("Enter a location, such as a city or neighborhood.");
    if (form.aqi === "" || !Number.isInteger(aqi) || aqi < 0 || aqi > 500) return setError("Enter a whole-number AQI between 0 and 500.");
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: form.location.trim(), aqi, concern: form.concern.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "The request was not valid. Check your inputs.");
      setResult(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof TypeError ? "Can't reach the AirAware server. Make sure the backend is running on port 8000." : err.message);
    } finally { setLoading(false); }
  }

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <p className="brand">AirAware</p>
          <h1>Know what the air means for you, and what your neighborhood can do about it.</h1>
          <p className="lede">Enter an AQI reading for your area. AirAware turns it into clear steps for you, your community, and the years ahead.</p>
          <Scale aqi={liveAqi} />
        </div>
      </header>

      <main className="wrap">
        <form className="card" onSubmit={submit} noValidate>
          <div className="row">
            <label>Location
              <input value={form.location} onChange={set("location")} placeholder="e.g. Vijayawada, Andhra Pradesh" maxLength={120} />
            </label>
            <label>AQI (0–500)
              <input type="number" inputMode="numeric" min="0" max="500" value={form.aqi} onChange={set("aqi")} placeholder="e.g. 162" />
            </label>
          </div>
          <label>Concern <span className="opt">(optional)</span>
            <textarea rows="3" value={form.concern} onChange={set("concern")} maxLength={500}
              placeholder="e.g. I walk to work, and my school has outdoor assembly." />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? "Analyzing…" : "Analyze Air Quality"}</button>
          <p className="fine">You provide the AQI; AirAware does not fetch live data. Guidance is general and is not medical advice.</p>
        </form>

        {loading && (
          <div className="loading" role="status"><span className="dots"><b /><b /><b /></span> Gemini is reading the air for {form.location.trim() || "your area"}…</div>
        )}

        {result && !loading && (
          <div id="results" className="results">
            <section className="summary" style={{ "--c": colorFor(result.aqi) }}>
              <div className="num">{result.aqi}</div>
              <div>
                <h2>{result.category}</h2>
                <p className="where">{result.location}</p>
                <p>{result.what_it_means}</p>
              </div>
            </section>
            <div className="grid">
              <List title="What you can do today" items={result.individual_actions} tone="a" />
              <List title="What your community can do" items={result.community_actions} tone="b" />
              <List title="Building resilience over time" items={result.long_term_resilience} tone="c" />
            </div>
            <aside className="takeaway"><h3>Key takeaway</h3><p>{result.key_takeaway}</p></aside>
            <p className="fine">Generated by Gemini from your inputs. For symptoms or health conditions, talk to a healthcare professional.</p>
          </div>
        )}
      </main>
    </>
  );
}
