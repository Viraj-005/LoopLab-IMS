import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EditJobPost = () => {
  const { showNotification } = useNotification();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    category: 'Software Engineering',
    customCategory: '',
    location: 'Remote',
    stipend_range: '',
    capacity: 1,
    status: 'Draft',
    description: '',
    requirements: '',
    tags: '',
  });
  const [mediaFiles, setMediaFiles] = useState([]); 
  const [existingMedia, setExistingMedia] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const PREDEFINED_CATEGORIES = [
    'Software Engineering', 'AI Research', 'UX/UI Design', 'Operations', 'Marketing'
  ];

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/job-posts/${id}`);
        const job = res.data;
        
        const isCustom = !PREDEFINED_CATEGORIES.includes(job.category);
        
        setFormData({
          title: job.title,
          category: isCustom ? 'Other' : job.category,
          customCategory: isCustom ? job.category : '',
          location: job.location,
          stipend_range: job.stipend_range || '',
          capacity: job.capacity,
          status: job.status,
          description: job.description || '',
          requirements: job.requirements || '',
          tags: job.tags || '',
        });
        setShowCustomCategory(isCustom);
        setExistingMedia(job.media_url);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching job:", error);
        alert("Failed to load recruitment protocol.");
        navigate('/job-posts');
      }
    };
    fetchJob();
  }, [id, navigate]);

  const validateAndStageFile = (file) => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return { file, error: 'Unsupported format.', type: 'unknown' };
    }
    const preview = isImage ? URL.createObjectURL(file) : null;
    return { file, preview, type: isImage ? 'image' : 'video', error: null };
  };

  const addFiles = (files) => {
    const staged = Array.from(files).map(validateAndStageFile);
    setMediaFiles(staged); // Only one for now since backend takes the first one
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setShowCustomCategory(value === 'Other');
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Resolve final category
      const finalData = {
        ...formData,
        category: showCustomCategory ? formData.customCategory : formData.category
      };
      delete finalData.customCategory;

      await api.patch(`/job-posts/${id}`, finalData);

      // Upload media if new one selected
      if (mediaFiles.length > 0 && !mediaFiles[0].error) {
        const fd = new FormData();
        fd.append('files', mediaFiles[0].file);
        await api.post(`/job-posts/${id}/media`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showNotification(`Protocol for ${formData.title} updated successfully.`, "success");
      navigate('/job-posts');
    } catch (error) {
      console.error('Error updating job post:', error);
      showNotification("Update failed. Check system logs.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Modify Protocol</h1>
          <p className="text-on-surface-variant font-medium text-lg">Update the recruitment parameters for {formData.title}.</p>
        </div>
      </header>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="glass-card p-10 rounded-[2.5rem] border-white ring-1 ring-slate-200/30 space-y-8">
            <h3 className="text-2xl font-black text-on-surface font-headline mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Stream Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Position Title</label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Primary Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                >
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="AI Research">AI Research</option>
                  <option value="UX/UI Design">UX/UI Design</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other / Custom Protocol...</option>
                </select>
                {showCustomCategory && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Define Custom Category</label>
                    <input
                      required
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={handleChange}
                      className="w-full bg-white/60 border border-primary/20 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 focus:border-primary outline-none mt-1"
                      placeholder="e.g. Quantum Architecture"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Location</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                >
                  <option value="Remote">Remote Protocol</option>
                  <option value="Hybrid">Hybrid Stream</option>
                  <option value="On-site">On-site Lab</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Monthly Stipend (Optional)</label>
                <input
                  name="stipend_range"
                  value={formData.stipend_range}
                  onChange={handleChange}
                  className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 focus:border-primary outline-none"
                  placeholder="e.g. Rs. 25,000 / month"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                >
                  <option value="Draft">System Draft</option>
                  <option value="Live">Global Live</option>
                  <option value="Closed">Closed / Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Strategic Tags (Comma Separated)</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary opacity-40 text-xl">label</span>
                  <input
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full bg-white/60 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 focus:border-primary outline-none"
                    placeholder="e.g. Urgent, Remote, Backend, Quantum"
                  />
                </div>
            </div>
          </div>

          <div className="glass-card p-10 rounded-[2.5rem] border-white ring-1 ring-slate-200/30 space-y-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Mission Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={6}
                  className="w-full bg-white/60 border border-slate-200 rounded-3xl px-6 py-4 text-sm font-medium outline-none resize-none"
                />
              </div>
          </div>

          <div className="glass-card p-10 rounded-[2.5rem] border-white ring-1 ring-slate-200/30 space-y-6">
            <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">perm_media</span>
              Media Update
            </h3>
            
            {(existingMedia && mediaFiles.length === 0) && (
              <div className="mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Media</p>
                <div className="w-48 h-24 rounded-2xl overflow-hidden border border-slate-200">
                   {existingMedia.endsWith('.mp4') || existingMedia.endsWith('.webm') ? (
                     <video src={getMediaUrl(existingMedia)} className="w-full h-full object-cover" muted />
                   ) : (
                     <img src={getMediaUrl(existingMedia)} className="w-full h-full object-cover" alt="Existing" />
                   )}
                </div>
              </div>
            )}

            <div
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-4 py-10 rounded-3xl border-2 border-dashed transition-all ${
                dragOver ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'
              }`}
            >
              <span className="material-symbols-outlined text-3xl text-slate-300">add_photo_alternate</span>
              <p className="text-xs font-bold text-slate-400">Click or drag to replace media</p>
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </div>

            {mediaFiles.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                 <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{mediaFiles[0].type === 'video' ? 'videocam' : 'image'}</span>
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate">{mediaFiles[0].file.name}</p>
                    <p className="text-[10px] font-bold opacity-60 uppercase">Replacement Staged</p>
                 </div>
                 <button type="button" onClick={() => setMediaFiles([])} className="text-danger hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">delete</span>
                 </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-6 pt-4">
            <button type="button" onClick={() => navigate('/job-posts')} className="px-10 py-4 font-black text-xs uppercase tracking-widest text-on-surface-variant">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="hero-gradient text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 disabled:opacity-50"
            >
              {saving ? 'Syncing...' : 'Update Protocol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobPost;
