import { routeTo } from '../config/routes.js';
import { ApplicantModel } from '../models/ApplicantModel.js';
import { useAsync } from './useAsync.js';

/** /browse-candidates (views.browse_candidates). */
export function useBrowseCandidatesController() {
  const { data: candidates, loading } = useAsync(() => ApplicantModel.list(), [], []);
  return { candidates, loading, detailPath: routeTo.candidateDetail };
}

/** /candidate/:applicantId (views.candidate_detail). */
export function useCandidateDetailController(applicantId) {
  const { data: applicant, error } = useAsync(() => ApplicantModel.get(applicantId), [applicantId]);
  return { applicant, notFound: error?.status === 404 };
}
