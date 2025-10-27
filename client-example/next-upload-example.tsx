import React, { useState } from 'react';

export default function RevitEvaluateForm() {
  const [images, setImages] = useState<File[]>([]);
  const [selfDescription, setSelfDescription] = useState('');
  const [checklist, setChecklist] = useState('');
  const [studentId, setStudentId] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [rubric, setRubric] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setImages(files);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.append('studentId', studentId);
      form.append('selfDescription', selfDescription);
      form.append('checklist', checklist);
      form.append('courseCode', courseCode);
      form.append('rubric', rubric);
      images.forEach((file) => form.append('images', file));

      const res = await fetch(process.env.NEXT_PUBLIC_EVAL_API || 'http://localhost:4000/evaluate', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
      <input placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
      <input placeholder="Course Code (e.g., CE 301)" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} />
      <textarea placeholder="Self Evaluation" value={selfDescription} onChange={(e) => setSelfDescription(e.target.value)} />
      <textarea placeholder="Checklist (JSON or text)" value={checklist} onChange={(e) => setChecklist(e.target.value)} />
      <textarea placeholder="Rubric (JSON or text)" value={rubric} onChange={(e) => setRubric(e.target.value)} />
      <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple onChange={onFileChange} />
      <button type="submit" disabled={loading}>{loading ? 'Evaluating...' : 'Evaluate'}</button>
      {result && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
      )}
    </form>
  );
}


