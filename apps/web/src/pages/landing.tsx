import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Users,
  Camera,
  ClipboardCheck,
  PiggyBank,
  KeyRound,
  Check,
  Lock,
  UserRound,
  EyeOff,
  Scale,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Brand } from '../components/common';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import './kinetic-landing.css';
export function Landing() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const destination = profile ? '/app' : '/register';
  const steps = [
    {
      icon: Users,
      title: 'Form a private Circle',
      text: 'Invite your people. Your challenges, photos and progress stay inside your Circle.',
    },
    {
      icon: ClipboardCheck,
      title: 'Accept the same rules',
      text: 'Choose the days, upload window and virtual penalty. Each participant accepts before the roster locks.',
    },
    {
      icon: Camera,
      title: 'Show the effort',
      text: 'Submit a private photo and context during your window. A photo is evidence, not a guarantee of completion.',
    },
    {
      icon: ShieldCheck,
      title: 'Review fairly',
      text: 'Independent peers review the proof. Uncertain decisions stay open, and disputed penalties wait for resolution.',
    },
    {
      icon: PiggyBank,
      title: 'Make consistency count',
      text: 'Eligible finishers share virtual penalty credits according to transparent discipline scores. No real money.',
    },
  ];
  return (
    <div className="kinetic-landing">
      <header className="kl-header">
        <Brand />
        <nav aria-label={t('Main navigation')}>
          <a className="kl-nav-active" href="#overview">
            {t('Overview')}
          </a>
          <Link to="/join">{t('Join circle')}</Link>
          <a href="#how-it-works">{t('How it works')}</a>
        </nav>
        <div className="kl-header-actions">
          <Button asChild size="sm" variant="outline">
            <Link to={profile ? '/app' : '/login'}>
              {t(profile ? 'Open your space' : 'Log in')}
              <ArrowUpRight size={15} />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to={destination}>{t('Start a circle')}</Link>
          </Button>
          <Link
            to={profile ? '/app/settings' : '/login'}
            className="kl-account"
            aria-label={t('Your account')}
          >
            <UserRound size={18} />
          </Link>
        </div>
      </header>
      <main>
        <section id="overview" className="kl-hero">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="eyebrow">
              <span className="status-dot" /> {t('PRIVATE CIRCLES. SHARED INTENTION.')}
            </span>
            <h1>
              {t('Private accountability with')}{' '}
              <em>
                {t('real')} <span>{t('social stakes.')}</span>
              </em>
            </h1>
            <p>{t('Make a commitment, show up, and grow with friends who get it.')}</p>
            <div className="kl-actions">
              <Button asChild>
                <Link to={destination}>
                  {t('Start a circle')}
                  <ArrowUpRight size={18} />
                </Link>
              </Button>
              <Link className="kl-invite" to="/join">
                <KeyRound size={16} />
                {t('I have an invitation')}
              </Link>
            </div>
            <div className="kl-facts">
              <div>
                <strong>01</strong>
                <span>{t('One shared version of the rules.')}</span>
              </div>
              <div>
                <strong>0</strong>
                <span>{t('Real-money payments')}</span>
              </div>
              <div>
                <strong>80%</strong>
                <span>{t('Reward eligibility')}</span>
              </div>
            </div>
          </motion.div>
          <div className="kl-pool">
            <div className="kl-pool-head">
              <PiggyBank size={28} />
              <div>
                <strong>{t('Virtual Credit (VC)')}</strong>
                <small>{t('No cash value')}</small>
              </div>
              <span className="pill">100% {t('virtual')}</span>
            </div>
            <div className="kl-standard">
              <div>
                <small>{t('THE SHARED PROMISE')}</small>
                <strong>
                  100% <span>{t('virtual')}</span>
                </strong>
                <p>{t('One shared version of the rules.')}</p>
              </div>
              <div className="kl-token-ring">
                <PiggyBank size={27} />
              </div>
            </div>
            <section className="kl-zero-risk">
              <ShieldCheck size={20} />
              <div>
                <h2>{t('Only virtual stakes.')}</h2>
                <p>{t('No deposits. No withdrawals. Just a reason to keep your word.')}</p>
              </div>
            </section>
            <ul className="kl-protocol-list">
              <li>
                <Lock size={18} />
                <span>{t('Private photo evidence')}</span>
                <small>{t('CIRCLE ONLY')}</small>
              </li>
              <li>
                <EyeOff size={18} />
                <span>{t('No public feed')}</span>
                <small>{t('INVITE ONLY')}</small>
              </li>
              <li>
                <Scale size={18} />
                <span>{t('People make the decision.')}</span>
                <small>{t('PEER REVIEW')}</small>
              </li>
            </ul>
            <footer>
              <span>{t('All stakes are virtual. Always.')}</span>
              <span>{t('Private by default.')}</span>
            </footer>
          </div>
        </section>
        <section id="why-together" className="kl-statement">
          <div>
            <span className="eyebrow">{t('PROGRESS IS A TEAM SPORT.')}</span>
            <h2>{t('Your goals need a circle.')}</h2>
            <p>
              {t(
                'One private circle. A shared ambition. Friends who notice when you show up—and help you get back to it when you don’t.',
              )}
            </p>
          </div>
          <div className="kl-editorial">
            <img
              src="/images/stitch-athletes.jpg"
              alt={t('Two friends preparing for a workout')}
              width={800}
              height={600}
            />
            <span>{t('YOUR PEOPLE. YOUR PROMISE.')}</span>
          </div>
        </section>
        <section id="how-it-works" className="kl-process">
          <div className="kl-section-heading">
            <div>
              <span className="eyebrow">{t('ONE DAY AT A TIME')}</span>
              <h2>{t('The accountability rhythm.')}</h2>
            </div>
            <p>{t('Clear rules. Friendly stakes. No real money.')}</p>
          </div>
          <div className="kl-steps">
            {steps.map((step, index) => (
              <motion.article
                className="trail-scene"
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <div>
                  <span>0{index + 1}</span>
                  <step.icon size={21} />
                </div>
                <h3>{t(step.title)}</h3>
                <p>{t(step.text)}</p>
                <footer>
                  <strong>
                    {t(
                      [
                        'INVITE ONLY',
                        'SHARED RULES',
                        'PRIVATE PHOTO',
                        'PEER REVIEW',
                        'VIRTUAL REWARDS',
                      ][index],
                    )}
                  </strong>
                  <span>
                    {t(
                      [
                        'Your people, your promise',
                        'Accept before activation',
                        'Server receipt time',
                        'Independent reviewers',
                        'No cash value',
                      ][index],
                    )}
                  </span>
                </footer>
              </motion.article>
            ))}
          </div>
        </section>
        <section className="kl-bottom">
          <aside className="kl-examples">
            <div className="kl-section-heading">
              <div>
                <span className="eyebrow">{t('ILLUSTRATIVE CIRCLES')}</span>
                <h2>{t('Built around real life.')}</h2>
              </div>
            </div>
            <p>{t('Private by default. These are examples, not a public feed.')}</p>
            {[
              ['Dawn Runners', 'Morning movement', '/images/stitch-watch.jpg', '06:00–08:30'],
              ['Deep Work', 'Make time to focus', '/images/stitch-focus.jpg', '13:00–17:00'],
            ].map(([name, detail, img, window], i) => (
              <article className="kl-example" key={name}>
                <header>
                  <span className="kl-example-symbol">
                    {i ? <ClipboardCheck size={22} /> : <Users size={22} />}
                  </span>
                  <div>
                    <h3>{t(name)}</h3>
                    <small>{t(detail)}</small>
                  </div>
                  <span className="st-status st-status-safe">{t('Illustration')}</span>
                </header>
                <div>
                  <img src={img} alt="" width={64} height={56} loading="lazy" />
                  <div>
                    <strong>
                      {t(i ? 'A quieter hour. A shared goal.' : 'One small effort, together.')}
                    </strong>
                    <span>{t('Your people, your promise')}</span>
                  </div>
                  <ShieldCheck size={24} />
                </div>
                <footer>
                  <span>{t('Daily upload window')}</span>
                  <strong>{window}</strong>
                </footer>
              </article>
            ))}
          </aside>
          <div className="kl-faq-column">
            <div className="kl-faq">
              <span className="eyebrow">{t('THE RULES, IN PLAIN SIGHT')}</span>
              <h2>{t('A few good questions.')}</h2>
              {[
                [
                  'Can I exchange credits for real money?',
                  'No. VC are simulated points with no cash value. There are no deposits, payments or withdrawals.',
                ],
                [
                  'Who sees my proof?',
                  'Only current members of your private Circle can view its submitted photos. There is no public feed.',
                ],
                [
                  'Does AI verify my activity?',
                  'The current development mock checks image readability only. It does not analyze the photo or prove completion. Peers make review decisions.',
                ],
                [
                  'What if I need a rest day?',
                  'In challenges with chosen grace days, an available pass excuses a scheduled or missed day without a photo. Finalized results stay locked.',
                ],
              ].map(([question, answer]) => (
                <details
                  key={question}
                  open={question === 'Can I exchange credits for real money?'}
                >
                  <summary>{t(question)}</summary>
                  <p>{t(answer)}</p>
                </details>
              ))}
            </div>
            <div className="kl-start">
              <PiggyBank size={38} />
              <h2>
                {t('Your people.')}
                <br />
                {t('Your next small win.')}
              </h2>
              <p>{t('Just you, your people, and a promise to show up.')}</p>
              <Button asChild>
                <Link to={destination}>
                  {t('Make this your day one')}
                  <ArrowRight size={17} />
                </Link>
              </Button>
              <span>
                <Check size={14} />
                {t('All stakes are virtual. Always.')}
              </span>
            </div>
          </div>
        </section>
      </main>
      <footer className="kl-footer">
        <Brand />
        <span>{t('PROGRESS IS A TEAM SPORT.')}</span>
        <span>{t('All stakes are virtual. Always.')}</span>
      </footer>
    </div>
  );
}
