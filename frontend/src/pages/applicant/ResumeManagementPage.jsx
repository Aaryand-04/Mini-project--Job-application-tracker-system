import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { resumeService } from '../../services/resumeService';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Download,
  ExternalLink,
  Star,
  AlertCircle,
  FileCheck,
  Loader2,
  X,
  File,
  Sparkles,
  Info,
  ArrowRight
} from 'lucide-react';

export default function ResumeManagementPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  // Delete State
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action loaders
  const [selectingId, setSelectingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resumeService.getMyResumes();
      if (data.success) {
        setResumes(data.resumes || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve your resumes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setUploadError(null);
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setUploadError('Invalid format. Only PDF, DOC, and DOCX files are allowed.');
      setSelectedFile(null);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setUploadError('File is too large. Maximum allowed size is 5MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await resumeService.uploadResume(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (res.success) {
        setSuccessMessage(`"${res.resume.fileName}" uploaded successfully!`);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchResumes();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSelectDefault = async (resumeId) => {
    try {
      setSelectingId(resumeId);
      const res = await resumeService.selectResume(resumeId);
      if (res.success) {
        setSuccessMessage('Primary resume updated for future job applications.');
        await fetchResumes();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set primary resume.');
    } finally {
      setSelectingId(null);
    }
  };

  const handleDownload = async (resume) => {
    try {
      setDownloadingId(resume._id);
      await resumeService.downloadResume(resume._id, resume.fileName);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download resume file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewInline = async (resume) => {
    try {
      await resumeService.viewResumeInline(resume._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to preview resume file.');
    }
  };

  const confirmDelete = async () => {
    if (!resumeToDelete) return;
    try {
      setIsDeleting(true);
      const res = await resumeService.deleteResume(resumeToDelete._id);
      if (res.success) {
        setSuccessMessage(`Resume "${resumeToDelete.fileName}" removed.`);
        setResumeToDelete(null);
        await fetchResumes();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete resume.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Standard';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileBadgeColor = (fileName) => {
    const lower = (fileName || '').toLowerCase();
    if (lower.endsWith('.pdf')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (lower.endsWith('.docx')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const defaultResume = resumes.find((r) => r.isDefault);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Step 7 • Applicant Portfolio
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {resumes.length} {resumes.length === 1 ? 'Resume' : 'Resumes'} Uploaded
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Resume Management
            </h1>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors self-start sm:self-auto"
          >
            <span>Search Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Flash Notifications */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Overview Stats & Architecture Swimlane Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Total Uploaded</p>
              <h3 className="text-xl font-bold text-slate-900">{resumes.length}</h3>
              <p className="text-[11px] text-slate-500">PDF, DOC, DOCX supported</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400">Primary for Applications</p>
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {defaultResume ? defaultResume.fileName : 'None Selected'}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium">
                {defaultResume ? 'Active for 1-Click Apply' : 'Upload & mark default'}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-100/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900">Activity Diagram</p>
              <p className="text-xs text-indigo-700 leading-snug mt-0.5">
                Applicant &rarr; Upload Resume &rarr; Select Resume when Applying
              </p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Upload New Resume</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely store your resume on the server. Your files are isolated and only accessible to you.
            </p>
          </div>

          {/* Drag & Drop Target */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
              id="resume-file-input"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  selectedFile
                    ? 'bg-emerald-100 text-emerald-600'
                    : isDragging
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {selectedFile ? (
                  <FileCheck className="w-7 h-7" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  <p className="text-[11px] text-blue-600 font-medium">Click to change file</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">
                    <span className="text-blue-600 underline">Click to browse</span> or drag and drop your resume file here
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports PDF, DOC, and DOCX (Max size: 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Validation Error Banner */}
          {uploadError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  Uploading {selectedFile?.name}...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons for Upload */}
          {selectedFile && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isUploading}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                id="upload-resume-submit-btn"
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Confirm & Upload</span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Uploaded Resumes List */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Resumes</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your stored files. Choose which resume should be pre-selected when applying to jobs.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
              {resumes.length} {resumes.length === 1 ? 'file' : 'files'} saved
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading your resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No resumes uploaded yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your resume above in PDF or DOCX format so you can easily attach it to job applications in Step 8.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload First Resume</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.map((resume) => {
                const isSelected = resume.isDefault;
                const isSelectingThis = selectingId === resume._id;
                const isDownloadingThis = downloadingId === resume._id;

                return (
                  <div
                    key={resume._id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Icon & File Info */}
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${getFileBadgeColor(
                            resume.fileName
                          )}`}
                        >
                          <FileText className="w-6 h-6" />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {resume.fileName}
                            </h3>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Primary Resume
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span className="font-mono text-slate-500 font-medium">
                              {resume.resumeId}
                            </span>
                            <span>•</span>
                            <span>{formatFileSize(resume.fileSize)}</span>
                            <span>•</span>
                            <span>
                              Uploaded {new Date(resume.uploadedAt || resume.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                        {/* Primary Selector */}
                        {!isSelected ? (
                          <button
                            onClick={() => handleSelectDefault(resume._id)}
                            disabled={isSelectingThis}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title="Set as your primary resume when applying to jobs"
                          >
                            {isSelectingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Star className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-500" />
                            )}
                            <span>Set as Primary</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active Choice</span>
                          </span>
                        )}

                        {/* View Inline Preview */}
                        <button
                          onClick={() => handleViewInline(resume)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                          title="Preview in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => handleDownload(resume)}
                          disabled={isDownloadingThis}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          title="Download resume"
                        >
                          {isDownloadingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setResumeToDelete(resume)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors cursor-pointer"
                          title="Delete resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Delete "{resumeToDelete.fileName}"?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This will permanently delete this resume from the database and remove the file from the secure storage disk. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResumeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-resume-btn"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
