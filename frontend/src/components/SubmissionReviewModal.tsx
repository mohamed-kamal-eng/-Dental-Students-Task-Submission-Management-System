import { useState, useEffect } from 'react';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { reviewDoctorSubmission, getDoctorSubmission } from '../lib/api';

interface SubmissionReviewModalProps {
  submissionId: number;
  onClose: () => void;
  onSaved: (updatedSubmission: any) => void;
}

interface SubmissionData {
  id: number;
  title: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  grade: number | null;
  status: string;
  feedback: string;
}

export default function SubmissionReviewModal({ 
  submissionId, 
  onClose, 
  onSaved 
}: SubmissionReviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [formData, setFormData] = useState({
    grade: '',
    status: 'Pending',
    feedback: ''
  });

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const response = await getDoctorSubmission(submissionId);
      const data = response.data;
      
      // Handle the actual API response structure
      const submission = data.submission || data;
      const feedback = data.feedback;
      
      const submissionData: SubmissionData = {
        id: submission.id || submission.submission_id,
        title: submission.title || submission.assignment_title || 'Assignment',
        studentName: submission.studentName || submission.student_name || `Student #${submission.studentId || submission.student_id}`,
        studentId: (submission.studentId || submission.student_id)?.toString() || '',
        submittedAt: submission.submittedAt || submission.submitted_at || '',
        grade: submission.grade || feedback?.grade || null,
        status: submission.status || 'Pending',
        feedback: feedback?.text || feedback?.feedback_text || submission.notes || ''
      };
      
      setSubmission(submissionData);
      setFormData({
        grade: submissionData.grade?.toString() || '',
        status: submissionData.status,
        feedback: submissionData.feedback
      });
    } catch (error) {
      console.error('Failed to load submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!submission) return;
    
    try {
      setSaving(true);
      
      // Map status values to backend expected format
      const statusMap: Record<string, string> = {
        'Pending': 'Pending',
        'Accepted': 'Accepted', 
        'Rejected': 'Rejected',
        'NeedsRevision': 'NeedsRevision'
      };
      
      const mappedStatus = statusMap[formData.status] || 'Accepted';
      
      const payload: any = {
        status: mappedStatus
      };
      
      // Add grade if provided (convert from 0-100 to 0-10 scale)
      if (formData.grade && formData.grade.trim()) {
        const gradeValue = parseFloat(formData.grade);
        if (!isNaN(gradeValue)) {
          // Convert from 0-100 scale to 0-10 scale
          payload.grade = gradeValue / 10;
        }
      }
      
      // Add feedback if provided
      if (formData.feedback && formData.feedback.trim()) {
        payload.feedback_text = formData.feedback;
      }
      
      // Backend validation: grade required for Accepted status
      if (mappedStatus === 'Accepted' && !payload.grade) {
        alert('Grade is required when accepting a submission.');
        return;
      }
      
      // Backend validation: feedback required for NeedsRevision status  
      if (mappedStatus === 'NeedsRevision' && !payload.feedback_text) {
        alert('Feedback is required when marking submission as needs revision.');
        return;
      }
      
      await reviewDoctorSubmission(submissionId, payload);
      
      const updatedSubmission = {
        ...submission,
        grade: payload.grade ? payload.grade * 10 : null, // Convert back to 0-100 scale
        status: mappedStatus,
        feedback: formData.feedback
      };
      
      onSaved(updatedSubmission);
      onClose();
    } catch (error) {
      console.error('Failed to save submission:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm rounded-3xl border border-white/20 p-8">
          <div className="text-white text-center">Loading submission...</div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm rounded-3xl border border-white/20 p-8">
          <div className="text-white text-center">Submission not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm rounded-3xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Submission Review</h2>
            <p className="text-blue-200">Review and grade student submission</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-white font-medium mb-2">Title</label>
            <div className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white">
              {submission.title}
            </div>
          </div>

          {/* Student Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Student</label>
              <div className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white">
                {submission.studentName}
              </div>
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Student ID</label>
              <div className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white">
                {submission.studentId}
              </div>
            </div>
          </div>

          {/* Submitted At */}
          <div>
            <label className="block text-blue-300 font-medium mb-2">Submitted At</label>
            <div className="w-full p-3 bg-blue-500/10 border border-blue-400/20 rounded-xl text-blue-200">
              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Not available'}
            </div>
          </div>

          {/* Grade and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Grade (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.grade}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="Enter grade..."
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400"
              >
                <option value="Pending" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Pending</option>
                <option value="Accepted" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Accepted</option>
                <option value="Rejected" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Rejected</option>
                <option value="NeedsRevision" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Needs Revision</option>
              </select>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-white font-medium mb-2">Feedback</label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder="Enter feedback for the student..."
              rows={6}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-60 font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors disabled:opacity-60 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
