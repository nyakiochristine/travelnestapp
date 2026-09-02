import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const INTERESTS = ['Wildlife', 'Beach', 'Culture', 'Adventure', 'Historical'];
const REGIONS = ['Coast', 'Nairobi', 'Rift Valley', 'Central', 'Western', 'Southern Safari'];
function SmartPlanner({ token, onCreated }) {
  const [attractions, setAttractions] = useState([]);
  const [form, setForm] = useState({ title: '', baseAttractionId: '', region: '', days: 3, pace: 'balanced', budget: '', interests: [] });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { fetch(window.__TRAVELNEST_API_URL__ + '/api/attractions').then(r => r.json()).then(data => setAttractions(Array.isArray(data) ? data : [])).catch(() => setError('Could not load destinations.')); }, []);
  const toggleInterest = interest => setForm(current => ({ ...current, interests: current.interests.includes(interest) ? current.interests.filter(value => value !== interest) : [...current.interests, interest] }));
  const generate = async event => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch(window.__TRAVELNEST_API_URL__ + '/api/smart-planner/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not generate your itinerary.');
      setResult(data); onCreated();
    } catch (issue) { setError(issue.message); } finally { setLoading(false); }
  };
  return <div className="tool-card planner-v2">
    <div className="tool-header"><span className="badge">SMART PLANNER</span><h3>Build a trip that fits you</h3><p>Start with a landmark and get an editable route made from places genuinely nearby.</p><div className="planner-promise"><span>⌖</span> Nearby-only planning — no long cross-country jumps in a day.</div></div>
    <form onSubmit={generate} className="tool-form planner-form">
      <input placeholder="Name this trip" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}><option value="">Use the starting place’s region</option>{REGIONS.map(region => <option key={region} value={region}>{region}</option>)}</select>
      <select value={form.baseAttractionId} onChange={e => setForm({ ...form, baseAttractionId: e.target.value })} required><option value="">Choose your starting landmark</option>{attractions.map(item => <option key={item._id} value={item._id}>{item.name} — {item.location}</option>)}</select>
      <div className="planner-row"><label>Days<select value={form.days} onChange={e => setForm({ ...form, days: e.target.value })}>{[1,2,3,4,5,6,7].map(day => <option key={day}>{day}</option>)}</select></label><label>Travel pace<select value={form.pace} onChange={e => setForm({ ...form, pace: e.target.value })}><option value="relaxed">Relaxed</option><option value="balanced">Balanced</option><option value="packed">Packed</option></select></label><label>Budget (optional)<input value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="e.g. KES 40,000" /></label></div>
      <fieldset><legend>What are you into?</legend><div className="interest-chips">{INTERESTS.map(interest => <button type="button" className={form.interests.includes(interest) ? 'selected' : ''} key={interest} onClick={() => toggleInterest(interest)}>{interest}</button>)}</div></fieldset>
      <button className="btn-ml planner-submit" disabled={loading}>{loading ? 'Building your route…' : 'Generate my itinerary →'}</button>
    </form>
    {error && <p className="planner-error">{error}</p>}
    {result && <section className="planner-result"><div><span className="badge">YOUR PLAN</span><h4>{result.itinerary.title}</h4><p>{result.summary.region} · {result.summary.days} days · {result.summary.pace} pace · {result.summary.interestMatch}</p><small className="planner-distance-note">⌖ {result.summary.nearbyStops} nearby match{result.summary.nearbyStops === 1 ? '' : 'es'} found within {result.summary.distanceLimitKm} km.</small>{result.summary.usedInterestFallback && <small className="planner-fallback-note">No nearby places matched your selected interest, so we included other local highlights instead of adding a far-away stop.</small>}</div>{result.dailyPlan.map(day => <article key={day.day}><strong>Day {day.day} — {day.theme}</strong><p>{day.stops.join(' → ')}</p><small>{day.rationale}</small></article>)}</section>}
  </div>;
}
export default SmartPlanner;
