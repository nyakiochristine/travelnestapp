import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const emptyForm = { name: '', location: '', lat: '', lng: '', category: 'Experience', type: 'attraction', region: '', tags: '', description: '', priceRange: '', estimatedDuration: '', openingHours: '', contactEmail: '', contactPhone: '', website: '', amenities: '' };
const api = 'http://localhost:3001/api/attractions';

function SMEPortal({ token }) {
  const [data, setData] = useState({ role: '', verificationStatus: '', listings: [] });
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const load = async () => {
    setLoading(true);
    try { const response = await fetch(`${api}/my`, { headers }); if (!response.ok) throw new Error('Could not load your business workspace.'); setData(await response.json()); }
    catch (error) { setMessage(error.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [token]);
  const requestAccess = async () => {
    const response = await fetch(`${api}/business-application`, { method: 'POST', headers }); const result = await response.json();
    setMessage(result.message || result.error); if (response.ok) load();
  };
  const submit = async event => {
    event.preventDefault();
    const payload = { ...form, amenities: form.amenities.split(',').map(value => value.trim()).filter(Boolean), tags: form.tags.split(',').map(value => value.trim()).filter(Boolean) };
    const response = await fetch(`${api}/add`, { method: 'POST', headers, body: JSON.stringify(payload) }); const result = await response.json();
    setMessage(result.message || result.error); if (response.ok) { setForm(emptyForm); load(); }
  };
  const remove = async id => {
    if (!window.confirm('Remove this listing?')) return;
    const response = await fetch(`${api}/${id}`, { method: 'DELETE', headers }); const result = await response.json();
    setMessage(result.message || result.error); if (response.ok) load();
  };
  const review = async (endpoint, id, status) => {
    const url = endpoint === 'business-applications' ? `${api}/${endpoint}/${id}` : endpoint === 'place-suggestions' ? `${api}/${endpoint}/${id}/status` : `${api}/${id}/status`;
    const response = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
    const result = await response.json(); setMessage(result.message || result.error || `Marked ${status}.`); if (response.ok) load();
  };
  const approved = data.role === 'admin' || (data.role === 'business' && data.verificationStatus === 'approved');
  return <section className="tool-card sme-portal">
    <div className="tool-header"><span className="badge">BUSINESS WORKSPACE</span><h3>Put your experience on the map</h3><p>Create a complete listing. Approved listings can appear in travellers’ discovery and planning tools.</p></div>
    {message && <p className="planner-error">{message}</p>}
    {loading ? <p>Loading your workspace…</p> : !approved ? <div className="sme-access"><h4>{data.verificationStatus === 'pending' ? 'Your business application is being reviewed' : 'Ready to list your business?'}</h4><p>{data.verificationStatus === 'pending' ? 'You can publish as soon as an administrator approves your account.' : 'Apply for verified business access to manage travel experiences on TravelNest.'}</p>{data.verificationStatus !== 'pending' && <button className="btn-primary" onClick={requestAccess}>Request business access</button>}</div> : <>
      <form className="tool-form sme-form" onSubmit={submit}>
        <h4>Create a listing</h4><input required placeholder="Business or experience name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="Town, area or destination" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        <div className="form-row"><input required type="number" step="any" placeholder="Latitude" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} /><input required type="number" step="any" placeholder="Longitude" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} /></div>
        <div className="form-row"><input placeholder="Category (e.g. Safari, Stay, Food)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="attraction">Attraction</option><option value="cafe">Café</option><option value="stay">Stay</option><option value="restaurant">Restaurant</option><option value="activity">Activity</option><option value="market">Market</option><option value="nightlife">Nightlife</option></select></div>
        <div className="form-row"><select required value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}><option value="">Choose Kenya region</option><option>Coast</option><option>Nairobi</option><option>Rift Valley</option><option>Central</option><option>Western</option><option>Southern Safari</option></select><input placeholder="Price range (e.g. 2,500–5,000)" value={form.priceRange} onChange={e => setForm({ ...form, priceRange: e.target.value })} /></div>
        <textarea placeholder="What makes this experience memorable?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <div className="form-row"><input placeholder="Typical duration" value={form.estimatedDuration} onChange={e => setForm({ ...form, estimatedDuration: e.target.value })} /><input placeholder="Opening hours" value={form.openingHours} onChange={e => setForm({ ...form, openingHours: e.target.value })} /></div>
        <input placeholder="Tags, separated by commas (e.g. family, sunset, budget)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /><input placeholder="Amenities, separated by commas" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} /><input type="email" placeholder="Contact email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /><input placeholder="Phone number" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} /><input type="url" placeholder="Website (optional)" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        <button className="btn-primary">Submit listing for review</button>
      </form>
      <div className="sme-listings"><h4>Your listings</h4>{data.listings.length ? data.listings.map(listing => <article key={listing._id}><div><strong>{listing.name}</strong><p>{listing.location} · <span className={`listing-status ${listing.status}`}>{listing.status}</span></p></div><button className="btn-delete" onClick={() => remove(listing._id)}>Remove</button></article>) : <p>No listings yet. Create your first one above.</p>}</div>
      {data.role === 'admin' && <section className="sme-listings admin-review"><h4>Admin review queue</h4><p>Business access requests</p>{data.businessApplications?.map(application => <article key={application._id}><div><strong>{application.name}</strong><p>{application.email}</p></div><div className="review-actions"><button className="btn-primary" onClick={() => review('business-applications', application._id, 'approved')}>Approve</button><button className="btn-delete" onClick={() => review('business-applications', application._id, 'rejected')}>Reject</button></div></article>)}<p>Pending business listings</p>{data.pendingListings?.map(listing => <article key={listing._id}><div><strong>{listing.name}</strong><p>{listing.owner?.name} · {listing.owner?.email}</p></div><div className="review-actions"><button className="btn-primary" onClick={() => review('', listing._id, 'approved')}>Approve</button><button className="btn-delete" onClick={() => review('', listing._id, 'rejected')}>Reject</button></div></article>)}<p>Traveller place suggestions</p>{data.placeSuggestions?.length ? data.placeSuggestions.map(suggestion => <article key={suggestion._id}><div><strong>{suggestion.name}</strong><p>{suggestion.submittedBy?.map(person => person.name).join(', ') || 'Traveller contribution'} · {suggestion.sourceItineraries?.length || 1} itinerary source{suggestion.sourceItineraries?.length === 1 ? '' : 's'}</p>{suggestion.notes && <p className="suggestion-notes">{suggestion.notes}</p>}</div><div className="review-actions"><button className="btn-primary" onClick={() => review('place-suggestions', suggestion._id, 'approved')}>Keep for listing</button><button className="btn-delete" onClick={() => review('place-suggestions', suggestion._id, 'rejected')}>Reject</button></div></article>) : <p>No community place suggestions yet.</p>}</section>}
    </>}
  </section>;
}
export default SMEPortal;
