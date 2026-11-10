import { useI18n } from '../lib/i18n';
import { ProofConversation, GracePlanner } from '../components/community';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Camera, ArrowLeft, ImagePlus, Check, ShieldCheck } from 'lucide-react';
import type {
  ChallengeDetail,
  EvidencePage as EvidenceData,
  Proof,
  GraceChoice,
} from '@stakeup/contracts';
import { useResource } from '../lib/social';
import { api, message, supabase } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { ErrorMessage, Loading } from '../components/common';
import './evidence.css';
async function prepare(file: File) {
  if (file.size > 20_000_000) throw new Error('Choose a photo smaller than 20 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Use JPEG, PNG or WebP.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}
function Photo({ challengeId, proof }: { challengeId: string; proof: Proof }) {
  const [url, setUrl] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true,
      object = '';
    const controller = new AbortController();
    void (async () => {
      try {
        const session = supabase ? (await supabase.auth.getSession()).data.session : null;
        const r = await fetch(`/api/challenges/${challengeId}/evidence/${proof.id}/photo`, {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
          signal: controller.signal,
        });
        if (!r.ok) throw new Error('Unable to load this private photo.');
        object = URL.createObjectURL(await r.blob());
        if (live) setUrl(object);
        else URL.revokeObjectURL(object);
      } catch (e) {
        if (live) setError(message(e));
      }
    })();
    return () => {
      live = false;
      controller.abort();
      if (object) URL.revokeObjectURL(object);
    };
  }, [challengeId, proof.id]);
  return error ? (
    <ErrorMessage message={error} />
  ) : url ? (
    <img
      className="evidence-photo"
      src={url}
      alt={`Evidence shared by ${proof.name} for ${proof.localDate}`}
    />
  ) : (
    <Loading />
  );
}
function Review({
  proof: s,
  challengeId,
  reload,
  closed,
}: {
  proof: Proof;
  challengeId: string;
  reload: () => Promise<void>;
  closed: boolean;
}) {
  const { t, language } = useI18n();

  const { profile } = useAuth();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [reason, setReason] = useState('');
  const own = s.userId === profile?.id;
  async function act(kind: 'vote' | 'dispute', decision?: 'accept' | 'reject') {
    setError('');
    setBusy(true);
    try {
      await api(`/challenges/${challengeId}/evidence/${s.id}/${kind}`, {
        method: 'POST',
        body: JSON.stringify({ reason, decision }),
      });
      setReason('');
      await reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="proof-entry">
      <div className="proof-entry-heading">
        <div>
          <span className="eyebrow">
            {s.localDate} · {s.name}
          </span>
          <h2>{t(s.status.replace('_', ' '))}</h2>
        </div>
        <span className="pill">
          {s.receivedAt ? new Date(s.receivedAt).toLocaleString(language) : t('Upload incomplete')}
        </span>
      </div>
      {s.receivedAt ? <Photo challengeId={challengeId} proof={s} /> : null}
      <p>{s.note}</p>
      {s.review ? (
        <div className="verification-note">
          <ShieldCheck size={20} />
          <div>
            <strong>{t('Development review · human judgment needed')}</strong>
            {[...s.review.observations, ...s.review.unverified].map((text) => (
              <p key={text}>{t(text)}</p>
            ))}
          </div>
        </div>
      ) : null}
      <details>
        <summary>
          {t('Review history ·')} {s.events.length} {t('events')}
        </summary>
        {s.events.map((e, i) => (
          <p key={i}>
            <time>{new Date(e.createdAt).toLocaleString(language)}</time> ·{' '}
            {t(e.kind.replaceAll('_', ' '))}{' '}
            {['ai_reviewed', 'accepted', 'rejected'].includes(e.kind) ? t(e.reason) : e.reason}
          </p>
        ))}
        {s.votes.map((v) => (
          <p key={`${v.userId}-${v.round}`}>
            {v.name}: {t(v.decision)} — {v.reason} {t('(round')} {v.round + 1})
          </p>
        ))}
      </details>
      {!closed &&
      !own &&
      ['ai_reviewed', 'disputed'].includes(s.status) &&
      !s.votes.some((v) => v.userId === profile?.id && v.round === s.round) ? (
        <div className="review-actions">
          <label>
            {t('Your review')}{' '}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder={t('What did you observe? Explain your decision.')}
            />
          </label>
          <div className="heading-actions">
            <Button
              disabled={busy || reason.trim().length < 5}
              onClick={() => void act('vote', 'accept')}
            >
              <Check size={16} />
              {t('Endorse proof')}{' '}
            </Button>
            <Button
              variant="outline"
              disabled={busy || reason.trim().length < 5}
              onClick={() => void act('vote', 'reject')}
            >
              {t('Flag as invalid')}{' '}
            </Button>
          </div>
        </div>
      ) : null}
      {!closed &&
      s.round === 0 &&
      ((own && s.status === 'rejected') ||
        (!own && ['accepted', 'rejected'].includes(s.status))) ? (
        <details className="review-actions">
          <summary>{own ? t('Appeal this rejection') : t('Dispute the decision')}</summary>
          <label>
            {t('Explain the dispute')}{' '}
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </label>
          <Button
            variant="outline"
            disabled={busy || reason.trim().length < 10}
            onClick={() => void act('dispute')}
          >
            {t('Open dispute')}{' '}
          </Button>
        </details>
      ) : null}
      <ProofConversation challengeId={challengeId} proofId={s.id} />
      {error ? <ErrorMessage message={error} /> : null}
    </article>
  );
}
export function EvidencePage() {
  const { t, language } = useI18n();

  const { id } = useParams();
  const challenge = useResource<ChallengeDetail>(`/challenges/${id}`),
    evidence = useResource<EvidenceData>(`/challenges/${id}/evidence`);
  const [photo, setPhoto] = useState(''),
    [source, setSource] = useState<'camera' | 'upload'>('camera'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const grace = useResource<GraceChoice[]>(`/challenges/${id}/grace`);
  const c = challenge.data;
  const today = c
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: c.rules.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(clock))
    : '';
  const open = c?.obligations.find(
    (o) =>
      !grace.data?.some((g) => g.obligationId === o.id) &&
      o.localDate === today &&
      new Date(o.deadlineAt).getTime() >= clock &&
      (!o.opensAt || new Date(o.opensAt).getTime() <= clock),
  );
  const submitted =
    open && evidence.data?.proofs.some((s) => s.obligationId === open.id && s.receivedAt);
  async function choose(file: File | undefined, kind: 'camera' | 'upload') {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      setPhoto(await prepare(file));
      setSource(kind);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const note = String(new FormData(e.currentTarget).get('note'));
    try {
      await api(`/challenges/${id}/evidence`, {
        method: 'POST',
        body: JSON.stringify({ photo, source, obligationId: open!.id, note }),
      });
      setPhoto('');
      setNotice('Photo received. Your proof is ready for peer review.');
      await evidence.reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (challenge.loading && !c) return <Loading />;
  return (
    <>
      <Link className="back-link" to={`/app/challenges/${id}`}>
        <ArrowLeft size={16} />
        {t('Back to challenge')}{' '}
      </Link>
      <div className="page-heading">
        <span className="eyebrow">{t('SHOW THE EFFORT. KEEP THE CONTEXT.')}</span>
        <h1>
          {t('Proof, with perspective')}
          <span>.</span>
        </h1>
        <p>
          {c?.rules.title} · {c?.rules.timezone}
        </p>
      </div>
      {challenge.error || evidence.error || grace.error ? (
        <ErrorMessage message={challenge.error || evidence.error || grace.error} />
      ) : null}
      <nav className="kinetic-tabs" aria-label={t('Proof workspace')}>
        <a href="#submit-proof">01 / {t('Submit proof')}</a>
        <a href="#proof-review">02 / {t('Review & history')}</a>
        <a href="#grace-planner">03 / {t('Grace days')}</a>
      </nav>
      <div className="evidence-layout">
        <aside className="evidence-submit" id="submit-proof">
          <h2>{t('Your next small win.')}</h2>
          <p>{c?.rules.evidenceRequirements}</p>
          {c ? (
            <GracePlanner challenge={c} choices={grace.data ?? []} reload={grace.reload} />
          ) : null}
          {open && !submitted ? (
            <form onSubmit={submit} className="form-stack">
              <p>
                {t('Opens')}{' '}
                {open.opensAt ? new Date(open.opensAt).toLocaleString(language) : t('at midnight')}{' '}
                {t('· Submit by')}{' '}
                <strong>{new Date(open.deadlineAt).toLocaleString(language)}</strong>{' '}
                {t('in your device timezone. Server receipt time is authoritative.')}{' '}
              </p>
              <div className="capture-options">
                <label className="button button-outline">
                  <Camera size={18} />
                  {t('Take a photo')}{' '}
                  <input
                    aria-label={t('Take a photo')}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    disabled={busy}
                    onChange={(e) => void choose(e.target.files?.[0], 'camera')}
                  />
                </label>
                {c?.rules.capturePolicy === 'camera_or_upload' ? (
                  <label className="button button-outline">
                    <ImagePlus size={18} />
                    {t('Choose photo')}{' '}
                    <input
                      aria-label={t('Choose photo')}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busy}
                      onChange={(e) => void choose(e.target.files?.[0], 'upload')}
                    />
                  </label>
                ) : null}
              </div>
              {photo ? (
                <img
                  className="photo-preview"
                  src={`data:image/jpeg;base64,${photo}`}
                  alt={t('Your selected proof preview')}
                />
              ) : null}
              <label>
                {t('Context for your circle')}{' '}
                <textarea
                  name="note"
                  maxLength={500}
                  rows={3}
                  placeholder={t('What did you do? What can this photo show?')}
                />
              </label>
              <Button disabled={!photo || busy} type="submit">
                {busy ? t('Preparing proof…') : t('Submit private proof')}
              </Button>
            </form>
          ) : (
            <p className="quiet-info">
              {submitted
                ? t('Your proof for today has been submitted.')
                : t('No submission window is open right now. Check the schedule below.')}
            </p>
          )}
          <p className="field-hint">
            {t(
              'Photos are private to your Circle. GPS metadata is removed. Camera capture is a requested source, not proof of when a photo was taken. JPEG, PNG and WebP are supported; photos are resized before upload.',
            )}{' '}
          </p>
          {error ? <ErrorMessage message={error} /> : null}
          {notice ? <p role="status">{t(notice)}</p> : null}
          <details>
            <summary>{t('Your submission windows')}</summary>
            {c?.obligations.map((o) => {
              const s = evidence.data?.proofs.find((s) => s.obligationId === o.id);
              return (
                <p key={o.id}>
                  {o.localDate} ·{' '}
                  {grace.data?.some((g) => g.obligationId === o.id)
                    ? t('Excused')
                    : s
                      ? t(s.status.replace('_', ' '))
                      : new Date(o.deadlineAt) < new Date()
                        ? t('Expired — no proof')
                        : t('Scheduled')}
                  <br />
                  <small>
                    {o.opensAt ? new Date(o.opensAt).toLocaleTimeString(language) : '00:00'}–
                    {new Date(o.deadlineAt).toLocaleString(language)}
                  </small>
                </p>
              );
            })}
          </details>
        </aside>
        <section className="evidence-stream" id="proof-review">
          <div className="stream-intro">
            <span className="eyebrow">{t('CIRCLE CONTACT SHEET')}</span>
            <p>
              {t(
                'AI never decides completion. Decisions require a strict majority of eligible peers. Rejection and dispute resolution need at least two independent reviewers. If your Circle is too small, review stays unresolved; no penalty is finalized.',
              )}{' '}
            </p>
          </div>
          {evidence.loading && !evidence.data ? <Loading /> : null}
          {evidence.data?.proofs.length === 0 ? (
            <div className="proof-empty">
              <Camera size={42} />
              <h2>{t('A little effort belongs here.')}</h2>
              <p>{t('Your Circle’s submitted photos and review history will appear here.')}</p>
            </div>
          ) : null}
          {evidence.data?.proofs.map((s) => (
            <Review
              key={s.id}
              proof={s}
              challengeId={id!}
              reload={evidence.reload}
              closed={c?.status === 'completed'}
            />
          ))}
        </section>
      </div>
    </>
  );
}
