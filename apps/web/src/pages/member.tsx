import { AchievementTrack } from '../components/achievement-track';
import { About } from '../components/about';
import { useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, Trophy } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/social';
import { useI18n } from '../lib/i18n';
import { api, message } from '../lib/api';
import { Avatar, ErrorMessage, Loading } from '../components/common';
import { Button } from '../components/ui/button';
export function AvatarUpload() {
  const { t } = useI18n(),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    setDone(false);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20000000)
        throw Error('Choose a JPEG, PNG or WebP photo smaller than 20 MB.');
      const image = await createImageBitmap(file),
        canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const side = Math.min(image.width, image.height);
      canvas
        .getContext('2d')!
        .drawImage(
          image,
          (image.width - side) / 2,
          (image.height - side) / 2,
          side,
          side,
          0,
          0,
          512,
          512,
        );
      image.close();
      await api('/me/avatar', {
        method: 'POST',
        body: JSON.stringify({ photo: canvas.toDataURL('image/jpeg', 0.85).split(',')[1] }),
      });
      window.dispatchEvent(new Event('stakeup:avatar'));
      setDone(true);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack avatar-upload" onSubmit={save}>
      <label>
        {t('Profile photo')}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setDone(false);
          }}
        />
      </label>
      <p>{t('Your photo is visible to teammates only. Location metadata is removed.')}</p>
      <Button disabled={!file || busy}>
        <Camera size={16} />
        {t(busy ? 'Saving…' : 'Save profile photo')}
      </Button>
      {done ? <p role="status">{t('Profile photo saved.')}</p> : null}
      {error ? <ErrorMessage message={error} /> : null}
    </form>
  );
}
interface Member {
  id: string;
  displayName: string;
  username: string;
  bio: string;
  createdAt: string;
  accepted: number;
  completed: number;
}
export function MemberPage() {
  const { id } = useParams(),
    { profile } = useAuth(),
    { t } = useI18n(),
    { data, error } = useResource<Member>(`/members/${id}`);
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Loading />;
  const points = data.accepted * 10 + data.completed * 50;
  return (
    <div className="member-page">
      <Link className="back-link" to="/app/circles">
        {t('Your circles')}
      </Link>
      <section className="st-module member-hero">
        <Avatar userId={data.id} name={data.displayName} large />
        <div>
          <h1>{data.displayName}</h1>
          <span>@{data.username}</span>
          <p>{data.bio}</p>
        </div>
        <strong>
          <Trophy />
          {points} {t('progress points')}
        </strong>
      </section>
      <div className="member-grid">
        <section className="st-module">
          <h2>{t('Achievements')}</h2>
          <AchievementTrack accepted={data.accepted} completed={data.completed} />
          <About title="About progress points">
            <p>
              {t(
                'Each accepted photo earns 10 points. Every completed challenge adds 50. Grace passes excuse a day; verified effort unlocks milestones.',
              )}
            </p>
          </About>
        </section>
        <aside className="st-module">
          <h2>{t('Your profile')}</h2>
          <p>
            {t(
              'Keep showing up to earn points, unlock new levels, and build a record of your effort.',
            )}
          </p>
          <p>
            {t(
              profile?.id === id
                ? 'Your progress includes all your challenges.'
                : 'Progress shown here comes from challenges you can both access.',
            )}
          </p>
          {profile?.id === id ? (
            <Link className="st-text-link" to="/app/settings">
              {t('Edit profile and settings')}
            </Link>
          ) : null}
          {profile?.id === id ? <AvatarUpload /> : null}
        </aside>
      </div>
    </div>
  );
}
