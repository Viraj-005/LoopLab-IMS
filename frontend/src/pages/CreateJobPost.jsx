import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CreateJobPost = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
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

  // Media state
  const [mediaFiles, setMediaFiles] = useState([]); // { file, preview, type:'image'|'video', error }
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const validateAndStageFile = (file) => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return { file, error: 'Unsupported format. Use JPG, PNG, WebP, GIF, MP4, WebM, or MOV.', type: 'unknown' };
    }
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return { file, error: `Image exceeds 10 MB limit (${formatBytes(file.size)}).`, type: 'image' };
    }
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return { file, error: `Video exceeds 100 MB limit (${formatBytes(file.size)}).`, type: 'video' };
    }

    const preview = isImage ? URL.createObjectURL(file) : null;
    return { file, preview, type: isImage ? 'image' : 'video', error: null };
  };

  const addFiles = (files) => {
    const staged = Array.from(files).map(validateAndStageFile);
    setMediaFiles((prev) => [...prev, ...staged]);
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // ── Drag-and-drop ────────────────────────────────────────────────────────

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  // ── Form ─────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setShowCustomCategory(value === 'Other');
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Resolve final category
      const finalData = {
        ...formData,
        category: showCustomCategory ? formData.customCategory : formData.category
      };
      // Remove temporary key
      delete finalData.customCategory;

      // Submit form fields
      const res = await api.post('/job-posts/', finalData);
      const jobId = res.data?.id;

      // Upload media if any (valid files only)
      const valid = mediaFiles.filter((m) => !m.error);
      if (jobId && valid.length > 0) {
        const fd = new FormData();
        valid.forEach((m) => fd.append('files', m.file));
        await api.post(`/job-posts/${jobId}/media`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showNotification(`Protocol for ${formData.title} initialized successfully.`, "success");
      navigate('/job-posts');
    } catch (error) {
      console.error('Error creating job post:', error);
      showNotification("Failed to initialize protocol. Check system authorization.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-on-surface font-headline mb-2">Initialize Opening</h1>
          <p className="text-on-surface-variant font-medium text-lg">Define the recruitment protocol for a new intern stream.</p>
        </div>
      </header>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Stream Identity ── */}
          <div className="glass-card p-10 rounded-[2.5rem] border-white ring-1 ring-slate-200/30 space-y-8">
            <h3 className="text-2xl font-black text-on-surface font-headline mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">data_object</span>
              Stream Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Position Title</label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 focus:border-primary tonal-transition outline-none"
                  placeholder="e.g. Senior Backend Architecture Intern"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Primary Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-primary/20 focus:border-primary outline-none"
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
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Location Stream</label>
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
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Initial Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-white/60 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                >
                  <option value="Draft">System Draft</option>
                  <option value="Live">Global Live</option>
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
                <p className="text-[9px] text-on-surface-variant font-bold opacity-40 ml-2">These will appear as color-coded identifiers in the intern discovery portal.</p>
            </div>
          </div>

          {/* ── Protocol Specifications ── */}
          <div className="glass-card p-10 rounded-[2.5rem] border-white ring-1 ring-slate-200/30 space-y-8">
            <h3 className="text-2xl font-black text-on-surface font-headline mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">subject</span>
              Protocol Specifications
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Mission Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full bg-white/60 border border-slate-200 rounded-3xl px-6 py-4 text-sm font-medium focus:ring-2 ring-primary/20 focus:border-primary outline-none resize-none"
                placeholder="Detail the technical focus and lab expectations..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Requirements Log</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                className="w-full bg-white/60 border border-slate-200 rounded-3xl px-6 py-4 text-sm font-medium focus:ring-2 ring-primary/20 focus:border-primary outline-none resize-none"
                placeholder="Core skill sets and required certifications..."
              />
            </div>
          </div>

          {/* ── Media Attachments ── */}
          <div className="glass-card p-10 rounded-[2.5rem] border-white ring-1 ring-slate-200/30 space-y-6">
            <h3 className="text-2xl font-black text-on-surface font-headline flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">perm_media</span>
              Media Attachments
            </h3>
            <p className="text-xs text-on-surface-variant font-bold opacity-60 -mt-3">
              Attach images (JPG, PNG, WebP, GIF · max 10 MB each) or videos (MP4, WebM, MOV · max 100 MB each).
            </p>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-4 py-14 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none ${
                dragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-slate-200 hover:border-primary/50 hover:bg-primary/5 bg-slate-50/60'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-black text-on-surface">
                  {dragOver ? 'Drop your files here' : 'Drag & drop files here'}
                </p>
                <p className="text-xs text-on-surface-variant font-bold opacity-50">or click to browse from your device</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {['JPG', 'PNG', 'WebP', 'GIF', 'MP4', 'WebM', 'MOV'].map((ext) => (
                  <span key={ext} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-wider">
                    {ext}
                  </span>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(',')}
                multiple
                className="hidden"
                onChange={(e) => e.target.files?.length && addFiles(e.target.files)}
              />
            </div>

            {/* Staged media preview grid */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                {mediaFiles.map((m, idx) => (
                  <div
                    key={idx}
                    className={`relative group rounded-2xl overflow-hidden border-2 transition-all ${
                      m.error ? 'border-danger/40 bg-danger/5' : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    {/* Preview */}
                    {m.type === 'image' && m.preview && !m.error && (
                      <img
                        src={m.preview}
                        alt={m.file.name}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    {m.type === 'video' && !m.error && (
                      <div className="w-full h-32 bg-slate-900 flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-3xl text-white/60">videocam</span>
                        <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">Video</span>
                      </div>
                    )}
                    {(m.error || m.type === 'unknown') && (
                      <div className="w-full h-32 flex flex-col items-center justify-center gap-2 px-3">
                        <span className="material-symbols-outlined text-2xl text-danger">error</span>
                        <p className="text-[9px] text-danger font-black text-center leading-snug">{m.error}</p>
                      </div>
                    )}

                    {/* File info bar */}
                    <div className="px-3 py-2 bg-white/80 backdrop-blur-sm border-t border-slate-100">
                      <p className="text-[9px] font-black text-on-surface truncate">{m.file.name}</p>
                      <p className="text-[8px] text-slate-400 font-bold">{formatBytes(m.file.size)}</p>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-danger"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>

                    {/* Valid badge */}
                    {!m.error && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-success/80 text-white text-[8px] font-black uppercase tracking-wider">
                        {m.type}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add more tile */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary transition-all"
                >
                  <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Add more</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-6 pt-4">
            <button
              type="button"
              onClick={() => navigate('/job-posts')}
              className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-on-surface-variant hover:bg-slate-100 tonal-transition"
            >
              Terminate
            </button>
            <button
              type="submit"
              disabled={loading}
              className="hero-gradient text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 tonal-transition flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Deploy Protocol'}
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateJobPost;
