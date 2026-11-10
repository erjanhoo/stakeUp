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
  return (
    <div className="retry-error">
      <ErrorMessage message={error} />
      <Button variant="outline" onClick={reload}>
        Try again
      </Button>
    </div>
  );
}
function JoinForm({ initial = '', onJoin }: { initial?: string; onJoin?: (id: string) => void }) {
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
        Invitation link or code
        <Input
          name="invite"
          defaultValue={initial}
          placeholder="Paste the link your friend sent"
          required
          autoComplete="off"
        />
      </label>
      {error ? <ErrorMessage message={error} /> : null}
      <Button type="submit" disabled={busy}>
        {busy ? 'Joining…' : 'Join circle'}
        <ArrowUpRight size={17} />
      </Button>
    </form>
  );
}
export function CirclesPage() {
  const { data, error, loading, reload } = useResource<CircleSummary[]>('/circles');
  const [showArchived, setShowArchived] = useState(false);
  return (
    <>
      <div className="page-heading heading-with-action">
        <div>
          <span className="eyebrow">GOOD COMPANY. SHARED AMBITION.</span>
          <h1>
            Your people. Your circles<span>.</span>
          </h1>
          <p>Private spaces for friends who bring out your better.</p>
        </div>
        <Button asChild>
          <Link to="/app/circles/new">
            <Plus size={17} />
            Create a circle
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
                  {c.archived ? 'Archived' : c.role === 'owner' ? 'Your circle' : 'Member'}
                </span>
              </div>
              <h2>{c.name}</h2>
              <p>{c.description || 'A private corner for your people.'}</p>
              <div className="circle-card-foot">
                <span>
                  <UsersRound size={15} />
                  {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                </span>
                <span>
                  {c.challengeCount} challenges
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ))}
      </div>
      {data?.length === 0 ? (
        <section className="panel feature-empty">
          <CircleIcon icon="sprout" />
          <h2>Everything’s better with a circle.</h2>
          <p>
            Start a private group, invite your friends, and turn a shared ambition into a daily
            promise.
          </p>
          <Button asChild variant="outline">
            <Link to="/app/circles/new">
              Create your first circle
              <ArrowUpRight size={17} />
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
          Show archived circles
        </label>
      ) : null}
      <section className="panel join-panel">
        <div>
          <span className="eyebrow">GOT AN INVITATION?</span>
          <h2>Your people are waiting.</h2>
          <p>Only people with a valid private invitation can join a Circle.</p>
        </div>
        <JoinForm />
      </section>
    </>
  );
}
function CircleFields({ initial }: { initial?: CircleInput }) {
  return (
    <>
      <label>
        Circle name
        <Input
          name="name"
          required
          minLength={3}
          maxLength={60}
          placeholder="The morning crew"
          defaultValue={initial?.name}
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          rows={3}
          maxLength={300}
          placeholder="What brings your people together?"
          defaultValue={initial?.description}
        />
      </label>
      <label>
        Circle icon
        <select name="icon" defaultValue={initial?.icon ?? 'flame'}>
          <option value="flame">Flame · consistency</option>
          <option value="sun">Sun · fresh starts</option>
          <option value="book">Book · learning</option>
          <option value="dumbbell">Dumbbell · movement</option>
          <option value="sprout">Sprout · growth</option>
        </select>
      </label>
    </>
  );
}
export function CreateCircle() {
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
        Your circles
      </Link>
      <div className="page-heading">
        <span className="eyebrow">MAKE ROOM FOR GOOD COMPANY</span>
        <h1>
          A little circle. Big possibilities<span>.</span>
        </h1>
        <p>You’ll be the owner. Invite friends with a private, expiring link.</p>
      </div>
      <section className="panel narrow-panel">
        <form className="form-stack" onSubmit={submit}>
          <CircleFields />
          {error ? <ErrorMessage message={error} /> : null}
          <Button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create circle'}
            <ArrowUpRight size={17} />
          </Button>
        </form>
        <p className="secure-caption">
          <LockKeyhole size={15} /> Private by default. No public directory.
        </p>
      </section>
    </>
  );
}
function AcceptanceRoster({ challenge }: { challenge: ChallengeSummary }) {
  return (
    <div className="acceptance-roster">
      <p>
        {challenge.status === 'proposed'
          ? 'Only members who accept will participate. Others may sit out.'
          : 'The participant list is locked.'}
      </p>
      {challenge.acceptances?.map((p) => (
        <div key={p.userId}>
          <span>{p.displayName}</span>
          <span className={p.status === 'accepted' ? 'accepted-label' : 'muted'}>
            {p.status === 'accepted'
              ? '✓ Rules accepted'
              : p.status === 'withdrawn'
                ? 'Withdrew'
                : 'Not accepted'}
          </span>
        </div>
      ))}
    </div>
  );
}
function ChallengeCard({ challenge: c }: { challenge: ChallengeSummary }) {
  return (
    <Link className="challenge-card" to={`/app/challenges/${c.id}`}>
      <span className="challenge-card-icon">
        <Flag size={21} />
      </span>
      <div>
        <span className={`pill ${c.status === 'active' ? 'pill-active' : ''}`}>
          {c.status === 'proposed'
            ? 'Accepting members'
            : c.status === 'active'
              ? 'Active · rules locked'
              : c.status === 'completed'
                ? 'Completed'
                : 'Cancelled'}
        </span>
        <h3>{c.rules.title}</h3>
        <p>
          {c.rules.startDate} – {c.rules.endDate} · {c.rules.cutoff} {c.rules.timezone}
        </p>
        <span className="muted">
          {c.acceptedCount} accepted · {credits(c.rules.penaltyMinor)} per missed day
        </span>
      </div>
      <ArrowUpRight size={19} />
      <AcceptanceRoster challenge={c} />
    </Link>
  );
}
export function CirclePage() {
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
        Your circles
      </Link>
      <div className="circle-detail-heading">
        <CircleIcon icon={c.icon} />
        <div>
          <span className="eyebrow">PRIVATE CIRCLE · {c.memberCount} MEMBERS</span>
          <h1>{c.name}</h1>
          <p>{c.description || 'A little accountability. A lot of possibility.'}</p>
        </div>
        {c.archived ? (
          <span className="pill">Archived</span>
        ) : (
          <div className="heading-actions">
            {c.role === 'owner' ? (
              <Button variant="outline" disabled={busy} onClick={() => void action('invite')}>
                Invite friends
                <Plus size={16} />
              </Button>
            ) : null}
            <Button asChild>
              <Link to={`/app/circles/${c.id}/challenges/new`}>
                New challenge
                <ArrowUpRight size={17} />
              </Link>
            </Button>
          </div>
        )}
      </div>
      {actionError ? <ErrorMessage message={actionError} /> : null}
      {invite ? (
        <section className="panel invite-panel">
          <div className="panel-heading">
            <h2>A little invitation to something good.</h2>
            <LockKeyhole size={19} />
          </div>
          <p>
            Share privately. This link expires {new Date(invite.expiresAt).toLocaleDateString()} and
            admits up to {invite.maxUses} people.
          </p>
          <div className="copy-row">
            <Input
              aria-label="Invitation link"
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
              {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </section>
      ) : null}
      <div className="social-detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Shared promises</h2>
            <span className="count-pill">{c.challenges.length}</span>
          </div>
          {c.challenges.length ? (
            c.challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))
          ) : (
            <div className="small-empty">
              <Flag size={30} />
              <h3>What will you show up for?</h3>
              <p>Propose your first challenge. Everyone accepts the same rules before it starts.</p>
              {!c.archived ? (
                <Button asChild variant="outline">
                  <Link to={`/app/circles/${c.id}/challenges/new`}>
                    Make a shared promise
                    <ArrowUpRight size={16} />
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </section>
        <aside className="panel member-panel">
          <div className="panel-heading">
            <h2>In your corner</h2>
            <UsersRound size={20} />
          </div>
          {c.members.map((member) => (
            <div className="member-row" key={member.userId}>
              <Avatar name={member.displayName} />
              <div>
                <strong>{member.displayName}</strong>
                <span>@{member.username}</span>
              </div>
              {member.role === 'owner' ? <span className="pill">Owner</span> : null}
            </div>
          ))}
        </aside>
      </div>
      <section className="panel recent-activity">
        <div className="panel-heading">
          <h2>Circle activity</h2>
          <Clock3 size={18} />
        </div>
        {c.events.map((event) => (
          <div className="activity-row" key={event.id}>
            <span className="activity-icon">
              <Check size={17} />
            </span>
            <div>
              <strong>{event.actorName}</strong>
              <p>{event.title}</p>
            </div>
            <time dateTime={event.createdAt}>
              {new Date(event.createdAt).toLocaleDateString(undefined, {
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
              <summary>Manage circle</summary>
              <form onSubmit={edit} className="form-stack">
                <CircleFields initial={c} />
                <Button disabled={busy} type="submit">
                  Save circle details
                </Button>
              </form>
              <div className="archive-action">
                <p>
                  Archiving preserves history and cancels proposals. Active challenges must be
                  resolved first.
                </p>
                <Button variant="outline" disabled={busy} onClick={() => void action('archive')}>
                  Archive circle
                </Button>
              </div>
            </details>
          ) : (
            <div className="leave-note">
              <p>Active challenge participants must stay until their challenge is resolved.</p>
              <Button variant="outline" disabled={busy} onClick={() => void action('leave')}>
                <LogOut size={15} />
                Leave circle
              </Button>
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
export function JoinCircle() {
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
        <span className="eyebrow">AN INVITATION TO SHOW UP</span>
      </header>
      <main>
        <div className="onboarding-heading">
          <span className="page-icon">
            <UsersRound />
          </span>
          <h1>Good company is waiting.</h1>
          <p>A private circle. A shared ambition. Your next small step.</p>
        </div>
        <section className="panel">
          {auth.loading ? (
            <Loading />
          ) : error ? (
            <>
              <ErrorMessage message={error} />
              <Button asChild variant="outline">
                <Link to="/app/circles">Your circles</Link>
              </Button>
            </>
          ) : !auth.profile ? (
            <>
              <p className="muted">
                Sign in or create an account to use this invitation. We’ll keep it here while you
                get settled.
              </p>
              <div className="heading-actions">
                <Button asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/register">Create account</Link>
                </Button>
              </div>
            </>
          ) : !auth.profile.onboardingCompleted ? (
            <Button asChild>
              <Link to="/onboarding">Finish your profile</Link>
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
        {circle?.name ?? 'Back to circle'}
      </Link>
      <div className="page-heading">
        <span className="eyebrow">A PROMISE WORTH KEEPING</span>
        <h1>
          What will you show up for<span>?</span>
        </h1>
        <p>Publish clear rules, then let your people choose to join.</p>
      </div>
      {circleError ? <ErrorMessage message={circleError} /> : null}
      <form className="challenge-form" onSubmit={submit}>
        <section className="panel form-stack">
          <h2>01 · The shared ambition</h2>
          <label>
            Challenge title
            <Input
              name="title"
              required
              minLength={3}
              maxLength={80}
              placeholder="Read 20 pages a day"
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={3}
              maxLength={1000}
              placeholder="Why does this matter to your circle?"
            />
          </label>
          <div className="form-row">
            <label>
              Start date
              <Input name="startDate" type="date" defaultValue={start} min={start} required />
            </label>
            <label>
              End date
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
            Challenge timezone
            <select name="timezone" defaultValue={profile?.timezone ?? 'UTC'}>
              {['UTC', ...Intl.supportedValuesOf('timeZone')]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((tz) => (
                  <option key={tz}>{tz}</option>
                ))}
            </select>
          </label>
          <fieldset>
            <legend>Scheduled weekdays</legend>
            <div className="weekday-options">
              {weekdays.map((day, i) => (
                <label key={day}>
                  <input type="checkbox" name="weekdays" value={i} defaultChecked />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Upload window opens
            <Input name="opening" type="time" defaultValue="00:00" required />
          </label>
          <label>
            Upload window closes
            <Input name="cutoff" type="time" defaultValue="20:00" required />
          </label>
          <p className="field-hint">
            Start tomorrow or later. Up to 90 days. On DST overlaps the later instant is used;
            skipped times move forward by the clock-change gap.
          </p>
        </section>
        <section className="panel form-stack">
          <h2>02 · What showing up looks like</h2>
          <label>
            Evidence requirements
            <textarea
              name="evidenceRequirements"
              required
              minLength={10}
              maxLength={500}
              rows={4}
              placeholder="Describe the photo and notes your circle will expect. Be honest about what a photo can and cannot show."
            />
          </label>
          <label>
            Allowed photo source
            <select name="capturePolicy" defaultValue="camera_or_upload">
              <option value="camera_or_upload">Camera or uploaded photo</option>
              <option value="camera_only">Camera capture only</option>
            </select>
          </label>
          <div className="quiet-info">
            <ShieldCheck size={19} />
            <p>
              A plausible photo cannot prove that an action happened. Evidence is reviewed by peers.
              AI does not prove completion.
            </p>
          </div>
          <h2>03 · Keep the stakes friendly</h2>
          <div className="form-row">
            <label>
              Virtual penalty per missed day
              <Input
                name="penalty"
                inputMode="decimal"
                defaultValue="5.00"
                pattern="[0-9]+([.][0-9]{1,2})?"
                required
              />
            </label>
            <label>
              Maximum total penalty
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
            Grace days
            <Input name="graceDays" type="number" min={0} max={7} defaultValue={1} required />
          </label>
          <p className="field-hint">
            VC are virtual credits with no cash value. No payments are collected. Virtual accounting
            launches in milestone 04.
          </p>
          <div className="reward-policy">
            <strong>Discipline rewards · policy v1</strong>
            <p>
              80% completion eligibility. Rewards proportional to discipline scores. Grace days
              exclude the earliest misses. Remainder credits follow a deterministic tie-break.
            </p>
          </div>
        </section>
        <section className="panel publish-panel">
          <LockKeyhole size={22} />
          <div>
            <h3>One shared version of the rules.</h3>
            <p>
              Publishing fixes these rules. You and your friends must each accept them. Activation
              locks the roster and creates deadlines.
            </p>
          </div>
          {error ? <ErrorMessage message={error} /> : null}
          <Button disabled={busy || !!circleError || circle?.archived} type="submit">
            {busy ? 'Publishing…' : 'Publish proposal'}
            <ArrowUpRight size={18} />
          </Button>
        </section>
      </form>
    </>
  );
}
export function ChallengePage() {
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
            <Link to={`/app/challenges/${c.id}/evidence`}>Submit & review proof</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/app/challenges/${c.id}/competition`}>
              {c.status === 'completed' ? 'Final results' : 'Standings & virtual pool'}
            </Link>
          </Button>
        </div>
      ) : null}
      {actionError ? <ErrorMessage message={actionError} /> : null}
      <div className="social-detail-grid">
        <section className="panel rules-panel">
          <div className="panel-heading">
            <h2>The rules, in plain sight</h2>
            <ShieldCheck size={21} />
          </div>
          <dl className="rules-grid">
            <div>
              <dt>Challenge dates</dt>
              <dd>
                {r.startDate} → {r.endDate}
              </dd>
            </div>
            <div>
              <dt>Daily upload window</dt>
              <dd>
                {r.opening ?? '00:00'}–{r.cutoff} · {r.timezone}
              </dd>
            </div>
            <div>
              <dt>Scheduled days</dt>
              <dd>{r.weekdays.map((d) => weekdays[d]).join(' · ')}</dd>
            </div>
            <div>
              <dt>Grace days</dt>
              <dd>{r.graceDays}</dd>
            </div>
            <div>
              <dt>Per missed day</dt>
              <dd>{credits(r.penaltyMinor)}</dd>
            </div>
            <div>
              <dt>Your maximum</dt>
              <dd>{credits(r.maxPenaltyMinor)}</dd>
            </div>
          </dl>
          <h3>What counts as evidence</h3>
          <p className="evidence-requirement">{r.evidenceRequirements}</p>
          <span className="pill">
            {r.capturePolicy === 'camera_only' ? 'Camera capture only' : 'Camera or upload'}
          </span>
          <div className="reward-policy">
            <strong>Proportional discipline rewards · v1</strong>
            <p>
              80% completion eligibility. No real money. Grace days excuse the earliest misses;
              accepted days count toward your discipline score.
            </p>
            <p>Virtual penalties and rewards are not processed in this milestone.</p>
          </div>
          <details className="rule-version">
            <summary>View the immutable rule fingerprint</summary>
            <code>{c.rulesHash}</code>
            <p>Each acceptance records this exact server-issued rule version.</p>
          </details>
        </section>
        <aside className="panel">
          <div className="panel-heading">
            <h2>Showing up together</h2>
            <span className="count-pill">{c.acceptedCount}</span>
          </div>
          {c.participants
            .filter((p) => p.status === 'accepted')
            .map((p) => (
              <div className="member-row" key={p.userId}>
                <Avatar name={p.displayName} />
                <div>
                  <strong>{p.displayName}</strong>
                  <span>Accepted {new Date(p.acceptedAt).toLocaleDateString()}</span>
                </div>
                <Check size={17} />
              </div>
            ))}
          <AcceptanceRoster challenge={c} />
          {!c.acceptedCount ? <p className="muted">Be the first to make the promise.</p> : null}
          {c.status === 'proposed' ? (
            c.ownStatus === 'accepted' ? (
              <div className="acceptance-box">
                <span className="pill pill-active">
                  <Check size={14} />
                  You accepted these rules
                </span>
                <Button variant="ghost" disabled={busy} onClick={() => void action('withdraw')}>
                  Withdraw before activation
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
                  I accept these dates, upload window, evidence rules, grace days, virtual penalties
                  and cap.
                </label>
                <Button disabled={!agreed || busy} onClick={() => void action('accept')}>
                  {busy ? 'Saving…' : 'Accept rules & join'}
                  <Check size={17} />
                </Button>
              </div>
            )
          ) : null}
          {c.canManage && c.status === 'proposed' ? (
            <div className="activation-box">
              <LockKeyhole size={21} />
              <h3>Ready for day one?</h3>
              <p>
                At least two people must accept. Only accepted members participate; unaccepted
                Circle members sit out. Activation locks the rules and roster. No one can enroll or
                withdraw afterward.
              </p>
              <Button
                disabled={busy || c.acceptedCount < 2}
                onClick={() => void action('activate')}
              >
                Activate & lock roster
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => void action('cancel')}>
                Cancel proposal
              </Button>
            </div>
          ) : null}
          {c.status === 'active' ? (
            <div className="quiet-info">
              <LockKeyhole size={21} />
              <div>
                <p>The shared promise is locked.</p>
                <Link className="text-link" to={`/app/challenges/${c.id}/evidence`}>
                  Submit & review proof →
                </Link>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
      {c.obligations.length ? (
        <section className="panel schedule-panel">
          <div className="panel-heading">
            <h2>Your frozen schedule</h2>
            <CalendarDays size={21} />
          </div>
          <p>
            Server-generated deadlines follow {r.timezone}. Your timestamps are fixed across clock
            changes.
          </p>
          <div className="schedule-list">
            {c.obligations.map((o) => (
              <div className="schedule-row" key={o.id}>
                <span>{o.localDate}</span>
                <strong>
                  {new Intl.DateTimeFormat('en', {
                    timeZone: r.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  }).format(new Date(o.deadlineAt))}
                </strong>
                <span className="pill">
                  {new Date(o.deadlineAt) > new Date() ? 'Scheduled' : 'Window closed'}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
