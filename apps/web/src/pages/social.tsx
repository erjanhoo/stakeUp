import { useI18n } from '../lib/i18n';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Flame,
  Sun,
  BookOpen,
  Dumbbell,
  Sprout,
  UsersRound,
  ArrowUpRight,
  ArrowLeft,
  Plus,
  Copy,
  Check,
  LockKeyhole,
  CalendarDays,
  Clock3,
  ShieldCheck,
  Flag,
  LogOut,
} from 'lucide-react';
import {
  circleSchema,
  challengeSchema,
  creditsToMinor,
  type CircleInput,
  type CircleSummary,
  type CircleDetail,
  type ChallengeSummary,
  type ChallengeDetail,
  type Invitation,
} from '@stakeup/contracts';
import { useAuth } from '../lib/auth';
import { api, message } from '../lib/api';
import {
  useResource,
  invitationToken,
  PENDING_INVITE,
  credits,
  tomorrow,
  addDays,
} from '../lib/social';
import { Brand, Avatar, ErrorMessage, Loading } from '../components/common';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
const icons = { flame: Flame, sun: Sun, book: BookOpen, dumbbell: Dumbbell, sprout: Sprout };
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function CircleIcon({ icon }: { icon: CircleInput['icon'] }) {
  const Icon = icons[icon] ?? Flame;
  return (
    <span className="circle-icon">
      <Icon size={25} />
    </span>
  );
}
function Failure({ error, reload }: { error: string; reload: () => void }) {
  const { t } = useI18n();

  return (
    <div className="retry-error">
      <ErrorMessage message={error} />
      <Button variant="outline" onClick={reload}>
        {t('Try again')}{' '}
      </Button>
    </div>
  );
}
function JoinForm({ initial = '', onJoin }: { initial?: string; onJoin?: (id: string) => void }) {
  const { t } = useI18n();

  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const navigate = useNavigate();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const token = invitationToken(String(new FormData(event.currentTarget).get('invite')));
      const result = await api<{ circleId: string }>('/invitations/join', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      sessionStorage.removeItem(PENDING_INVITE);
      if (onJoin) onJoin(result.circleId);
      else navigate(`/app/circles/${result.circleId}`);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        {t('Invitation link or code')}{' '}
        <Input
          name="invite"
          defaultValue={initial}
          placeholder={t('Paste the link your friend sent')}
          required
          autoComplete="off"
        />
      </label>
      {error ? <ErrorMessage message={error} /> : null}
      <Button type="submit" disabled={busy}>
        {busy ? t('Joining…') : t('Join circle')}
        <ArrowUpRight size={17} />
      </Button>
    </form>
  );
}
export function CirclesPage() {
  const { t } = useI18n();

  const { data, error, loading, reload } = useResource<CircleSummary[]>('/circles');
  const [showArchived, setShowArchived] = useState(false);
  return (
    <>
      <div className="page-heading heading-with-action">
        <div>
          <span className="eyebrow">{t('GOOD COMPANY. SHARED AMBITION.')}</span>
          <h1>
            {t('Your people. Your circles')}
            <span>.</span>
          </h1>
          <p>{t('Private spaces for friends who bring out your better.')}</p>
        </div>
        <Button asChild>
          <Link to="/app/circles/new">
            <Plus size={17} />
            {t('Create a circle')}{' '}
          </Link>
        </Button>
      </div>
      {error ? <Failure error={error} reload={reload} /> : null}
      {loading && !data ? <Loading /> : null}
      <div className="circle-grid">
        {data
          ?.filter((c) => showArchived || !c.archived)
          .map((c) => (
            <Link key={c.id} to={`/app/circles/${c.id}`} className="panel circle-card">
              <div className="circle-card-top">
                <CircleIcon icon={c.icon} />
                <span className="pill">
                  {c.archived ? t('Archived') : c.role === 'owner' ? t('Your circle') : t('Member')}
                </span>
              </div>
              <h2>{c.name}</h2>
              <p>{c.description || t('A private corner for your people.')}</p>
              <div className="circle-card-foot">
                <span>
                  <UsersRound size={15} />
                  {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                </span>
                <span>
                  {c.challengeCount} {t('challenges')} <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ))}
      </div>
      {data?.length === 0 ? (
        <section className="panel feature-empty">
          <CircleIcon icon="sprout" />
          <h2>{t('Everything’s better with a circle.')}</h2>
          <p>
            {t(
              'Start a private group, invite your friends, and turn a shared ambition into a daily promise.',
            )}{' '}
          </p>
          <Button asChild variant="outline">
            <Link to="/app/circles/new">
              {t('Create your first circle')} <ArrowUpRight size={17} />
            </Link>
          </Button>
        </section>
      ) : null}
      {data?.some((c) => c.archived) ? (
        <label className="inline-check">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t('Show archived circles')}{' '}
        </label>
      ) : null}
      <section className="panel join-panel">
        <div>
          <span className="eyebrow">{t('GOT AN INVITATION?')}</span>
          <h2>{t('Your people are waiting.')}</h2>
          <p>{t('Only people with a valid private invitation can join a Circle.')}</p>
        </div>
        <JoinForm />
      </section>
    </>
  );
}
function CircleFields({ initial }: { initial?: CircleInput }) {
  const { t } = useI18n();

  return (
    <>
      <label>
        {t('Circle name')}{' '}
        <Input
          name="name"
          required
          minLength={3}
          maxLength={60}
          placeholder={t('The morning crew')}
          defaultValue={initial?.name}
        />
      </label>
      <label>
        {t('Description')}{' '}
        <textarea
          name="description"
          rows={3}
          maxLength={300}
          placeholder={t('What brings your people together?')}
          defaultValue={initial?.description}
        />
      </label>
      <label>
        {t('Circle icon')}{' '}
        <select name="icon" defaultValue={initial?.icon ?? 'flame'}>
          <option value="flame">{t('Flame · consistency')}</option>
          <option value="sun">{t('Sun · fresh starts')}</option>
          <option value="book">{t('Book · learning')}</option>
          <option value="dumbbell">{t('Dumbbell · movement')}</option>
          <option value="sprout">{t('Sprout · growth')}</option>
        </select>
      </label>
    </>
  );
}
export function CreateCircle() {
  const { t } = useI18n();

  const navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const input = circleSchema.parse(Object.fromEntries(new FormData(event.currentTarget)));
      const c = await api<CircleDetail>('/circles', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      navigate(`/app/circles/${c.id}`);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/app/circles">
        <ArrowLeft size={16} />
        {t('Your circles')}{' '}
      </Link>
      <div className="page-heading">
        <span className="eyebrow">{t('MAKE ROOM FOR GOOD COMPANY')}</span>
        <h1>
          {t('A little circle. Big possibilities')}
          <span>.</span>
        </h1>
        <p>{t('You’ll be the owner. Invite friends with a private, expiring link.')}</p>
      </div>
      <section className="panel narrow-panel">
        <form className="form-stack" onSubmit={submit}>
          <CircleFields />
          {error ? <ErrorMessage message={error} /> : null}
          <Button type="submit" disabled={busy}>
            {busy ? t('Creating…') : t('Create circle')}
            <ArrowUpRight size={17} />
          </Button>
        </form>
        <p className="secure-caption">
          <LockKeyhole size={15} /> {t('Private by default. No public directory.')}{' '}
        </p>
      </section>
    </>
  );
}
function AcceptanceRoster({ challenge }: { challenge: ChallengeSummary }) {
  const { t } = useI18n();

  return (
    <div className="acceptance-roster">
      <p>
        {challenge.status === 'proposed'
          ? t('Only members who accept will participate. Others may sit out.')
          : t('The participant list is locked.')}
      </p>
      {challenge.acceptances?.map((p) => (
        <div key={p.userId}>
          <span>{p.displayName}</span>
          <span className={p.status === 'accepted' ? 'accepted-label' : 'muted'}>
            {p.status === 'accepted'
              ? t('✓ Rules accepted')
              : p.status === 'withdrawn'
                ? t('Withdrew')
                : t('Not accepted')}
          </span>
        </div>
      ))}
    </div>
  );
}
function ChallengeCard({ challenge: c }: { challenge: ChallengeSummary }) {
  const { t, language } = useI18n();

  return (
    <Link className="challenge-card" to={`/app/challenges/${c.id}`}>
      <span className="challenge-card-icon">
        <Flag size={21} />
      </span>
      <div>
        <span className={`pill ${c.status === 'active' ? 'pill-active' : ''}`}>
          {c.status === 'proposed'
            ? t('Accepting members')
            : c.status === 'active'
              ? t('Active · rules locked')
              : c.status === 'completed'
                ? t('Completed')
                : t('Cancelled')}
        </span>
        <h3>{c.rules.title}</h3>
        <p>
          {c.rules.startDate} – {c.rules.endDate} · {c.rules.cutoff} {c.rules.timezone}
        </p>
        <span className="muted">
          {c.acceptedCount} {t('accepted ·')} {credits(c.rules.penaltyMinor, language)}{' '}
          {t('per missed day')}{' '}
        </span>
      </div>
      <ArrowUpRight size={19} />
      <AcceptanceRoster challenge={c} />
    </Link>
  );
}
export function CirclePage() {
  const { t, language } = useI18n();

  const { id } = useParams();
  const { data: c, error, loading, reload } = useResource<CircleDetail>(`/circles/${id}`);
  const [invite, setInvite] = useState<Invitation | null>(null),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(''),
    [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setInvite(null);
    setCopied(false);
    setActionError('');
  }, [id]);
  async function action(kind: 'invite' | 'leave' | 'archive') {
    setBusy(true);
    setActionError('');
    try {
      const result = await api<Invitation>(`/circles/${id}/${kind}`, { method: 'POST' });
      if (kind === 'invite') {
        setInvite(result);
        setCopied(false);
      } else if (kind === 'leave') navigate('/app/circles');
      else await reload();
    } catch (e) {
      setActionError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function edit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setActionError('');
    try {
      const input = circleSchema.parse(Object.fromEntries(new FormData(event.currentTarget)));
      await api(`/circles/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
      await reload();
    } catch (e) {
      setActionError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (loading && !c) return <Loading />;
  if (error) return <Failure error={error} reload={reload} />;
  if (!c) return null;
  const link = invite ? `${location.origin}/join#token=${invite.token}` : '';
  return (
    <>
      <Link className="back-link" to="/app/circles">
        <ArrowLeft size={16} />
        {t('Your circles')}{' '}
      </Link>
      <div className="circle-detail-heading">
        <CircleIcon icon={c.icon} />
        <div>
          <span className="eyebrow">
            {t('PRIVATE CIRCLE ·')} {c.memberCount} {t('MEMBERS')}
          </span>
          <h1>{c.name}</h1>
          <p>{c.description || t('A little accountability. A lot of possibility.')}</p>
        </div>
        {c.archived ? (
          <span className="pill">{t('Archived')}</span>
        ) : (
          <div className="heading-actions">
            {c.role === 'owner' ? (
              <Button variant="outline" disabled={busy} onClick={() => void action('invite')}>
                {t('Invite friends')} <Plus size={16} />
              </Button>
            ) : null}
            <Button asChild>
              <Link to={`/app/circles/${c.id}/challenges/new`}>
                {t('New challenge')} <ArrowUpRight size={17} />
              </Link>
            </Button>
          </div>
        )}
      </div>
      {actionError ? <ErrorMessage message={actionError} /> : null}
      {invite ? (
        <section className="panel invite-panel">
          <div className="panel-heading">
            <h2>{t('A little invitation to something good.')}</h2>
            <LockKeyhole size={19} />
          </div>
          <p>
            {t('Share privately. This link expires')}{' '}
            {new Date(invite.expiresAt).toLocaleDateString(language)} {t('and admits up to')}{' '}
            {invite.maxUses} {t('people.')}{' '}
          </p>
          <div className="copy-row">
            <Input
              aria-label={t('Invitation link')}
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                } catch {
                  setActionError('Select the link and copy it manually.');
                }
              }}
            >
              {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? t('Copied') : t('Copy')}
            </Button>
          </div>
        </section>
      ) : null}
      <div className="social-detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>{t('Shared promises')}</h2>
            <span className="count-pill">{c.challenges.length}</span>
          </div>
          {c.challenges.length ? (
            c.challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))
          ) : (
            <div className="small-empty">
              <Flag size={30} />
              <h3>{t('What will you show up for?')}</h3>
              <p>
                {t(
                  'Propose your first challenge. Everyone accepts the same rules before it starts.',
                )}
              </p>
              {!c.archived ? (
                <Button asChild variant="outline">
                  <Link to={`/app/circles/${c.id}/challenges/new`}>
                    {t('Make a shared promise')} <ArrowUpRight size={16} />
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </section>
        <aside className="panel member-panel">
          <div className="panel-heading">
            <h2>{t('In your corner')}</h2>
            <UsersRound size={20} />
          </div>
          {c.members.map((member) => (
            <div className="member-row" key={member.userId}>
              <Avatar name={member.displayName} />
              <div>
                <strong>{member.displayName}</strong>
                <span>@{member.username}</span>
              </div>
              {member.role === 'owner' ? <span className="pill">{t('Owner')}</span> : null}
            </div>
          ))}
        </aside>
      </div>
      <section className="panel recent-activity">
        <div className="panel-heading">
          <h2>{t('Circle activity')}</h2>
          <Clock3 size={18} />
        </div>
        {c.events.map((event) => (
          <div className="activity-row" key={event.id}>
            <span className="activity-icon">
              <Check size={17} />
            </span>
            <div>
              <strong>{event.actorName}</strong>
              <p>{t(event.title)}</p>
            </div>
            <time dateTime={event.createdAt}>
              {new Date(event.createdAt).toLocaleDateString(language, {
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </div>
        ))}
      </section>
      {!c.archived ? (
        <section className="circle-management">
          {c.role === 'owner' ? (
            <details className="panel">
              <summary>{t('Manage circle')}</summary>
              <form onSubmit={edit} className="form-stack">
                <CircleFields initial={c} />
                <Button disabled={busy} type="submit">
                  {t('Save circle details')}{' '}
                </Button>
              </form>
              <div className="archive-action">
                <p>
                  {t(
                    'Archiving preserves history and cancels proposals. Active challenges must be resolved first.',
                  )}{' '}
                </p>
                <Button variant="outline" disabled={busy} onClick={() => void action('archive')}>
                  {t('Archive circle')}{' '}
                </Button>
              </div>
            </details>
          ) : (
            <div className="leave-note">
              <p>
                {t('Active challenge participants must stay until their challenge is resolved.')}
              </p>
              <Button variant="outline" disabled={busy} onClick={() => void action('leave')}>
                <LogOut size={15} />
                {t('Leave circle')}{' '}
              </Button>
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
export function JoinCircle() {
  const { t } = useI18n();

  const auth = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    try {
      const fromHash = new URLSearchParams(location.hash.slice(1)).get('token');
      const saved = fromHash ?? sessionStorage.getItem(PENDING_INVITE) ?? '';
      const parsed = invitationToken(saved);
      setToken(parsed);
      sessionStorage.setItem(PENDING_INVITE, parsed);
      history.replaceState(null, '', '/join');
    } catch (e) {
      setError(message(e));
    }
  }, []);
  return (
    <div className="onboarding">
      <header>
        <Brand />
        <span className="eyebrow">{t('AN INVITATION TO SHOW UP')}</span>
      </header>
      <main>
        <div className="onboarding-heading">
          <span className="page-icon">
            <UsersRound />
          </span>
          <h1>{t('Good company is waiting.')}</h1>
          <p>{t('A private circle. A shared ambition. Your next small step.')}</p>
        </div>
        <section className="panel">
          {auth.loading ? (
            <Loading />
          ) : error ? (
            <>
              <ErrorMessage message={error} />
              <Button asChild variant="outline">
                <Link to="/app/circles">{t('Your circles')}</Link>
              </Button>
            </>
          ) : !auth.profile ? (
            <>
              <p className="muted">
                {t(
                  'Sign in or create an account to use this invitation. We’ll keep it here while you get settled.',
                )}{' '}
              </p>
              <div className="heading-actions">
                <Button asChild>
                  <Link to="/login">{t('Log in')}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/register">{t('Create account')}</Link>
                </Button>
              </div>
            </>
          ) : !auth.profile.onboardingCompleted ? (
            <Button asChild>
              <Link to="/onboarding">{t('Finish your profile')}</Link>
            </Button>
          ) : token ? (
            <JoinForm initial={token} onJoin={(id) => navigate(`/app/circles/${id}`)} />
          ) : null}
        </section>
      </main>
    </div>
  );
}
export function CreateChallenge() {
  const { t } = useI18n();

  const { id } = useParams();
  const { profile } = useAuth();
  const { data: circle, error: circleError } = useResource<CircleDetail>(`/circles/${id}`);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const start = tomorrow(profile?.timezone ?? 'UTC');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const form = new FormData(event.currentTarget);
      const input = challengeSchema.parse({
        ...Object.fromEntries(form),
        weekdays: form.getAll('weekdays').map(Number),
        penaltyMinor: creditsToMinor(String(form.get('penalty'))),
        maxPenaltyMinor: creditsToMinor(String(form.get('cap'))),
        graceDays: Number(form.get('graceDays')),
      });
      const c = await api<ChallengeSummary>(`/circles/${id}/challenges`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      navigate(`/app/challenges/${c.id}`);
    } catch (e) {
      setError(
        e && typeof e === 'object' && 'issues' in e
          ? (e.issues as { message: string }[])[0].message
          : message(e),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to={`/app/circles/${id}`}>
        <ArrowLeft size={16} />
        {circle?.name ?? t('Back to circle')}
      </Link>
      <div className="page-heading">
        <span className="eyebrow">{t('A PROMISE WORTH KEEPING')}</span>
        <h1>
          {t('What will you show up for')}
          <span>?</span>
        </h1>
        <p>{t('Publish clear rules, then let your people choose to join.')}</p>
      </div>
      {circleError ? <ErrorMessage message={circleError} /> : null}
      <form className="challenge-form" onSubmit={submit}>
        <section className="panel form-stack">
          <h2>{t('01 · The shared ambition')}</h2>
          <label>
            {t('Challenge title')}{' '}
            <Input
              name="title"
              required
              minLength={3}
              maxLength={80}
              placeholder={t('Read 20 pages a day')}
            />
          </label>
          <label>
            {t('Description')}{' '}
            <textarea
              name="description"
              rows={3}
              maxLength={1000}
              placeholder={t('Why does this matter to your circle?')}
            />
          </label>
          <div className="form-row">
            <label>
              {t('Start date')}{' '}
              <Input name="startDate" type="date" defaultValue={start} min={start} required />
            </label>
            <label>
              {t('End date')}{' '}
              <Input
                name="endDate"
                type="date"
                defaultValue={addDays(start, 29)}
                min={start}
                required
              />
            </label>
          </div>
          <label>
            {t('Challenge timezone')}{' '}
            <select name="timezone" defaultValue={profile?.timezone ?? 'UTC'}>
              {['UTC', ...Intl.supportedValuesOf('timeZone')]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((tz) => (
                  <option key={tz}>{tz}</option>
                ))}
            </select>
          </label>
          <fieldset>
            <legend>{t('Scheduled weekdays')}</legend>
            <div className="weekday-options">
              {weekdays.map((day, i) => (
                <label key={day}>
                  <input type="checkbox" name="weekdays" value={i} defaultChecked />
                  <span>{t(day)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            {t('Upload window opens')}{' '}
            <Input name="opening" type="time" defaultValue="00:00" required />
          </label>
          <label>
            {t('Upload window closes')}{' '}
            <Input name="cutoff" type="time" defaultValue="20:00" required />
          </label>
          <p className="field-hint">
            {t(
              'Start tomorrow or later. Up to 90 days. On DST overlaps the later instant is used; skipped times move forward by the clock-change gap.',
            )}{' '}
          </p>
        </section>
        <section className="panel form-stack">
          <h2>{t('02 · What showing up looks like')}</h2>
          <label>
            {t('Evidence requirements')}{' '}
            <textarea
              name="evidenceRequirements"
              required
              minLength={10}
              maxLength={500}
              rows={4}
              placeholder={t(
                'Describe the photo and notes your circle will expect. Be honest about what a photo can and cannot show.',
              )}
            />
          </label>
          <label>
            {t('Allowed photo source')}{' '}
            <select name="capturePolicy" defaultValue="camera_or_upload">
              <option value="camera_or_upload">{t('Camera or uploaded photo')}</option>
              <option value="camera_only">{t('Camera capture only')}</option>
            </select>
          </label>
          <div className="quiet-info">
            <ShieldCheck size={19} />
            <p>
              {t(
                'A plausible photo cannot prove that an action happened. Evidence is reviewed by peers. AI does not prove completion.',
              )}{' '}
            </p>
          </div>
          <h2>{t('03 · Keep the stakes friendly')}</h2>
          <div className="form-row">
            <label>
              {t('Virtual penalty per missed day')}{' '}
              <Input
                name="penalty"
                inputMode="decimal"
                defaultValue="5.00"
                pattern="[0-9]+([.][0-9]{1,2})?"
                required
              />
            </label>
            <label>
              {t('Maximum total penalty')}{' '}
              <Input
                name="cap"
                inputMode="decimal"
                defaultValue="100.00"
                pattern="[0-9]+([.][0-9]{1,2})?"
                required
              />
            </label>
          </div>
          <label>
            {t('Grace days')}{' '}
            <Input name="graceDays" type="number" min={0} max={7} defaultValue={1} required />
          </label>
          <p className="field-hint">
            {t('Virtual credits only. No deposits, charges or withdrawals.')}{' '}
          </p>
          <div className="reward-policy">
            <strong>{t('Discipline rewards · policy v2')}</strong>
            <p>
              {t(
                'Chosen grace days are excused. Reserve them before the upload deadline. Unused days are not assigned automatically.',
              )}{' '}
            </p>
          </div>
        </section>
        <section className="panel publish-panel">
          <LockKeyhole size={22} />
          <div>
            <h3>{t('One shared version of the rules.')}</h3>
            <p>
              {t(
                'Publishing fixes these rules. You and your friends must each accept them. Activation locks the roster and creates deadlines.',
              )}{' '}
            </p>
          </div>
          {error ? <ErrorMessage message={error} /> : null}
          <Button disabled={busy || !!circleError || circle?.archived} type="submit">
            {busy ? t('Publishing…') : t('Publish proposal')}
            <ArrowUpRight size={18} />
          </Button>
        </section>
      </form>
    </>
  );
}
export function ChallengePage() {
  const { t, language } = useI18n();

  const { id } = useParams();
  const { data: c, error, loading, reload } = useResource<ChallengeDetail>(`/challenges/${id}`);
  const [agreed, setAgreed] = useState(false),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState('');
  async function action(kind: 'accept' | 'withdraw' | 'activate' | 'cancel') {
    setBusy(true);
    setActionError('');
    try {
      await api(`/challenges/${id}/${kind}`, {
        method: 'POST',
        body: kind === 'accept' ? JSON.stringify({ rulesHash: c!.rulesHash }) : undefined,
      });
      await reload();
    } catch (e) {
      setActionError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (loading && !c) return <Loading />;
  if (error) return <Failure error={error} reload={reload} />;
  if (!c) return null;
  const r = c.rules;
  return (
    <>
      <Link className="back-link" to={`/app/circles/${c.circleId}`}>
        <ArrowLeft size={16} />
        {c.circleName}
      </Link>
      <div className="page-heading">
        <span className="eyebrow">
          {c.status === 'active'
            ? 'ACTIVE · RULES AND ROSTER LOCKED'
            : c.status === 'proposed'
              ? 'A SHARED PROMISE · OPEN FOR ACCEPTANCE'
              : c.status === 'completed'
                ? 'COMPLETED · RESULTS FINAL'
                : 'CANCELLED PROPOSAL'}
        </span>
        <h1>
          {r.title}
          <span>.</span>
        </h1>
        <p>{r.description}</p>
      </div>
      {['active', 'completed'].includes(c.status) ? (
        <div className="heading-actions" style={{ marginBottom: 24 }}>
          <Button asChild>
            <Link to={`/app/challenges/${c.id}/evidence`}>{t('Submit & review proof')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/app/challenges/${c.id}/competition`}>
              {c.status === 'completed' ? t('Final results') : t('Standings & virtual pool')}
            </Link>
          </Button>
        </div>
      ) : null}
      {actionError ? <ErrorMessage message={actionError} /> : null}
      <div className="social-detail-grid">
        <section className="panel rules-panel">
          <div className="panel-heading">
            <h2>{t('The rules, in plain sight')}</h2>
            <ShieldCheck size={21} />
          </div>
          <dl className="rules-grid">
            <div>
              <dt>{t('Challenge dates')}</dt>
              <dd>
                {r.startDate} → {r.endDate}
              </dd>
            </div>
            <div>
              <dt>{t('Daily upload window')}</dt>
              <dd>
                {r.opening ?? '00:00'}–{r.cutoff} · {r.timezone}
              </dd>
            </div>
            <div>
              <dt>{t('Scheduled days')}</dt>
              <dd>{r.weekdays.map((d) => t(weekdays[d])).join(' · ')}</dd>
            </div>
            <div>
              <dt>{t('Grace days')}</dt>
              <dd>{r.graceDays}</dd>
            </div>
            <div>
              <dt>{t('Per missed day')}</dt>
              <dd>{credits(r.penaltyMinor, language)}</dd>
            </div>
            <div>
              <dt>{t('Your maximum')}</dt>
              <dd>{credits(r.maxPenaltyMinor, language)}</dd>
            </div>
          </dl>
          <h3>{t('What counts as evidence')}</h3>
          <p className="evidence-requirement">{r.evidenceRequirements}</p>
          <span className="pill">
            {r.capturePolicy === 'camera_only' ? t('Camera capture only') : t('Camera or upload')}
          </span>
          <div className="reward-policy">
            <strong>
              {t(
                r.rewardPolicy === 'discipline_v1'
                  ? 'Proportional discipline rewards · v1'
                  : 'Discipline rewards · policy v2',
              )}
            </strong>
            <p>
              {t(
                (r.gracePolicy ?? 'automatic_v1') === 'automatic_v1'
                  ? '80% completion eligibility. No real money. Grace days excuse the earliest misses; accepted days count toward your discipline score.'
                  : 'Chosen grace days are excused. Reserve them before the upload deadline. Unused days are not assigned automatically.',
              )}{' '}
            </p>
            <p>{t('See standings and the virtual pool for current projections.')}</p>
          </div>
          <details className="rule-version">
            <summary>{t('View the immutable rule fingerprint')}</summary>
            <code>{c.rulesHash}</code>
            <p>{t('Each acceptance records this exact server-issued rule version.')}</p>
          </details>
        </section>
        <aside className="panel">
          <div className="panel-heading">
            <h2>{t('Showing up together')}</h2>
            <span className="count-pill">{c.acceptedCount}</span>
          </div>
          {c.participants
            .filter((p) => p.status === 'accepted')
            .map((p) => (
              <div className="member-row" key={p.userId}>
                <Avatar name={p.displayName} />
                <div>
                  <strong>{p.displayName}</strong>
                  <span>
                    {t('Accepted')} {new Date(p.acceptedAt).toLocaleDateString(language)}
                  </span>
                </div>
                <Check size={17} />
              </div>
            ))}
          <AcceptanceRoster challenge={c} />
          {!c.acceptedCount ? (
            <p className="muted">{t('Be the first to make the promise.')}</p>
          ) : null}
          {c.status === 'proposed' ? (
            c.ownStatus === 'accepted' ? (
              <div className="acceptance-box">
                <span className="pill pill-active">
                  <Check size={14} />
                  {t('You accepted these rules')}{' '}
                </span>
                <Button variant="ghost" disabled={busy} onClick={() => void action('withdraw')}>
                  {t('Withdraw before activation')}{' '}
                </Button>
              </div>
            ) : (
              <div className="acceptance-box">
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  {t(
                    'I accept these dates, upload window, evidence rules, grace days, virtual penalties and cap.',
                  )}{' '}
                </label>
                <Button disabled={!agreed || busy} onClick={() => void action('accept')}>
                  {busy ? t('Saving…') : t('Accept rules & join')}
                  <Check size={17} />
                </Button>
              </div>
            )
          ) : null}
          {c.canManage && c.status === 'proposed' ? (
            <div className="activation-box">
              <LockKeyhole size={21} />
              <h3>{t('Ready for day one?')}</h3>
              <p>
                {t(
                  'At least two people must accept. Only accepted members participate; unaccepted Circle members sit out. Activation locks the rules and roster. No one can enroll or withdraw afterward.',
                )}{' '}
              </p>
              <Button
                disabled={busy || c.acceptedCount < 2}
                onClick={() => void action('activate')}
              >
                {t('Activate & lock roster')}{' '}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => void action('cancel')}>
                {t('Cancel proposal')}{' '}
              </Button>
            </div>
          ) : null}
          {c.status === 'active' ? (
            <div className="quiet-info">
              <LockKeyhole size={21} />
              <div>
                <p>{t('The shared promise is locked.')}</p>
                <Link className="text-link" to={`/app/challenges/${c.id}/evidence`}>
                  {t('Submit & review proof →')}{' '}
                </Link>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
      {c.obligations.length ? (
        <section className="panel schedule-panel">
          <div className="panel-heading">
            <h2>{t('Your frozen schedule')}</h2>
            <CalendarDays size={21} />
          </div>
          <p>
            {t('Server-generated deadlines follow')} {r.timezone}
            {t('. Your timestamps are fixed across clock changes.')}{' '}
          </p>
          <div className="schedule-list">
            {c.obligations.map((o) => (
              <div className="schedule-row" key={o.id}>
                <span>{o.localDate}</span>
                <strong>
                  {new Intl.DateTimeFormat(language, {
                    timeZone: r.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  }).format(new Date(o.deadlineAt))}
                </strong>
                <span className="pill">
                  {new Date(o.deadlineAt) > new Date() ? t('Scheduled') : t('Window closed')}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
