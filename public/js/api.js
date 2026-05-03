const BASE = '/api';

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Profile
  getProfile:          ()            => request('GET',    '/profile'),
  saveProfile:         (data)        => request('PUT',    '/profile', data),

  // Jobs
  getJobs:             ()            => request('GET',    '/jobs'),
  getJob:              (id)          => request('GET',    `/jobs/${id}`),
  createJob:           (data)        => request('POST',   '/jobs', data),
  updateJob:           (id, data)    => request('PUT',    `/jobs/${id}`, data),
  deleteJob:           (id)          => request('DELETE', `/jobs/${id}`),

  // Responsibilities
  createResp:          (jobId, data) => request('POST',   `/jobs/${jobId}/responsibilities`, data),
  updateResp:          (jobId, id, data) => request('PUT', `/jobs/${jobId}/responsibilities/${id}`, data),
  deleteResp:          (jobId, id)   => request('DELETE', `/jobs/${jobId}/responsibilities/${id}`),
  bulkUpdateResps:     (jobId, data) => request('PUT',    `/jobs/${jobId}/responsibilities`, data),

  // Skill Categories
  getSkillCategories:  ()            => request('GET',    '/skill-categories'),
  createCategory:      (data)        => request('POST',   '/skill-categories', data),
  updateCategory:      (id, data)    => request('PUT',    `/skill-categories/${id}`, data),
  deleteCategory:      (id)          => request('DELETE', `/skill-categories/${id}`),

  // Skills
  getSkills:           ()            => request('GET',    '/skills'),
  createSkill:         (data)        => request('POST',   '/skills', data),
  updateSkill:         (id, data)    => request('PUT',    `/skills/${id}`, data),
  deleteSkill:         (id)          => request('DELETE', `/skills/${id}`),

  // Certifications
  getCertifications:   ()            => request('GET',    '/certifications'),
  createCert:          (data)        => request('POST',   '/certifications', data),
  updateCert:          (id, data)    => request('PUT',    `/certifications/${id}`, data),
  deleteCert:          (id)          => request('DELETE', `/certifications/${id}`),

  // Awards
  getAwards:           ()            => request('GET',    '/awards'),
  createAward:         (data)        => request('POST',   '/awards', data),
  updateAward:         (id, data)    => request('PUT',    `/awards/${id}`, data),
  deleteAward:         (id)          => request('DELETE', `/awards/${id}`),

  // AI
  aiReview:            (payload)     => request('POST',   '/ai/review', payload),

  // Settings
  getSettings:         ()            => request('GET',    '/settings'),
  saveSettings:        (data)        => request('POST',   '/settings', data),

  // Resumes
  getResumes:          ()            => request('GET',    '/resumes'),
  createResume:        (data)        => request('POST',   '/resumes', data),
  updateResume:        (id, data)    => request('PUT',    `/resumes/${id}`, data),
  deleteResume:        (id)          => request('DELETE', `/resumes/${id}`),
};
