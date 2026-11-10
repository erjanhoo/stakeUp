import { useI18n } from '../lib/i18n';
import './landing-trail.css';
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Camera,
  Flame,
  Users,
  ShieldCheck,
  MoveUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Brand } from '../components/common';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth';

export function Landing() {
  const { t } = useI18n();

  const { profile } = useAuth();
  const destination = profile ? '/app' : '/register';
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <nav aria-label={t('Main navigation')}>
          <a href="#how-it-works">{t('The idea')}</a>
          <a href="#why-together">{t('Why together?')}</a>
        </nav>
        <Button asChild variant="outline" size="sm">
          <Link to={profile ? '/app' : '/login'}>
            {profile ? t('Open your space') : t('Log in')} <ArrowUpRight size={16} />
          </Link>
        </Button>
      </header>
      <main>
        <section className="hero">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="hero-label">
              <span className="status-dot" /> {t('BETTER HABITS. BETTER COMPANY.')}{' '}
            </div>
            <h1>
              {t('Big goals.')} <br />
              {t('Small steps.')} <br />
              <span>{t('Your people.')}</span>
              <span className="heading-star">✳</span>
            </h1>
            <p>
              {t('You’ve got the ambition. Bring the accountability.')}{' '}
              <br className="desktop-break" />{' '}
              {t('Make a commitment, show up, and grow with friends who get it.')}{' '}
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link to={destination}>
                  {t('Find your momentum')} <ArrowUpRight size={19} />
                </Link>
              </Button>
              <span>
                {t('Less “one day.”')} <br />
                <strong>{t('More day one.')}</strong>
              </span>
            </div>
            <div className="hero-fine">
              <ShieldCheck size={15} />{' '}
              {t('Private circles. Friendly stakes. Always virtual.')}{' '}
            </div>
          </motion.div>
          <div
            className="hero-art"
            aria-label={t('An illustration of friends building consistent habits')}
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="art-coordinate top-coordinate">{t('THE SHOW-UP EFFECT ↗')}</div>
            <div className="commitment-card">
              <div className="illustration-label">
                <span className="tiny-icon">
                  <Flame size={18} />
                </span>{' '}
                {t('THE DAILY PROMISE')} <span>01 / 03</span>
              </div>
              <h2>
                {t('Show up.')} <br />
                {t('Stack wins.')}{' '}
              </h2>
              <div className="habit-line">
                <span>{t('Commit to something good')}</span>
                <span className="illustration-check">
                  <Check size={15} />
                </span>
              </div>
              <div className="habit-line">
                <span>{t('Keep each other going')}</span>
                <span className="illustration-check">
                  <Check size={15} />
                </span>
              </div>
              <div className="habit-line">
                <span>{t('Make consistency your thing')}</span>
                <span className="illustration-check">
                  <Check size={15} />
                </span>
              </div>
              <div className="art-week">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <span key={i} className={i < 5 ? 'day-done' : ''}>
                    {i < 5 ? <Check size={17} /> : day}
                  </span>
                ))}
              </div>
              <div className="illustration-caption">
                {t('A little progress. A lot of possibility.')}
              </div>
            </div>
            <div className="floating-proof">
              <span className="proof-camera">
                <Camera size={23} />
              </span>
              <div>
                <strong>{t('A little proof.')}</strong>
                <span>{t('A big commitment.')}</span>
              </div>
              <MoveUpRight size={17} />
            </div>
            <div className="together-sticker">
              <Users size={26} />
              <span>
                {t('IN GOOD')} <br />
                <strong>{t('COMPANY.')}</strong>
              </span>
            </div>
            <div className="art-coordinate bottom-coordinate">
              {t('CONSISTENCY LOOKS GOOD ON YOU.')}
            </div>
          </div>
        </section>
        <div className="manifesto-strip">
          <span>{t('FOR THE EARLY RISERS')}</span>
          <span>✳</span>
          <span>{t('THE ONE-MORE-REP PEOPLE')}</span>
          <span>✳</span>
          <span>{t('THE CHAPTER-A-DAY CREW')}</span>
          <span>✳</span>
          <span>{t('AND THE JUST-GETTING-STARTED')}</span>
        </div>
        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t('A SIMPLE IDEA. A STRONGER YOU.')}</span>
              <h2>{t('Your goals need a circle.')}</h2>
            </div>
            <p>
              {t('Motivation comes and goes.')} <br />
              {t('Your people keep showing up.')}{' '}
            </p>
          </div>
          <div className="commitment-trail">
            <svg
              className="trail-thread"
              viewBox="0 0 1000 700"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.path
                d="M70 40 C 900 -60, 1000 280, 420 300 S -180 540, 930 650"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="5 10"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.8 }}
              />
            </svg>
            <motion.article
              className="trail-scene scene-people"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7 }}
            >
              <div className="people-sculpture" aria-hidden="true">
                <span>{t('YOU')}</span>
                <span>
                  {t('YOUR')} <br />
                  {t('PEOPLE')}{' '}
                </span>
                <i>↗</i>
              </div>
              <div className="trail-copy">
                <span className="trail-index">{t('01 / FIND YOUR CORNER')}</span>
                <h3>
                  {t('Good company.')} <br />
                  <em>{t('Great momentum.')}</em>
                </h3>
                <p>
                  {t(
                    'One private circle. A shared ambition. Friends who notice when you show up—and help you get back to it when you don’t.',
                  )}{' '}
                </p>
              </div>
            </motion.article>
            <motion.article
              className="trail-scene scene-proof"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7 }}
            >
              <div className="trail-copy">
                <span className="trail-index">{t('02 / LEAVE A LITTLE EVIDENCE')}</span>
                <h3>
                  {t('Less promising.')} <br />
                  <em>{t('More doing.')}</em>
                </h3>
                <p>
                  {t(
                    'A photo. A little context. Your circle sees the effort and reviews it honestly. Progress has a paper trail.',
                  )}{' '}
                </p>
              </div>
              <div className="proof-sculpture" aria-hidden="true">
                <div className="proof-print">
                  <div className="print-sun" />
                  <div className="print-hill" />
                  <span>{t('THE SMALL WIN / TODAY')}</span>
                </div>
                <span className="proof-stamp">
                  {t('SHOWED')} <br />
                  {t('UP ↗')}{' '}
                </span>
              </div>
            </motion.article>
            <motion.article
              className="trail-scene scene-stakes"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7 }}
            >
              <div className="stakes-sculpture" aria-hidden="true">
                <span>✳</span>
                <div>
                  {t('ALL IN.')} <br />
                  <em>{t('TOGETHER.')}</em>
                </div>
                <small>{t('VIRTUAL STAKES. REAL INTENTION.')}</small>
              </div>
              <div className="trail-copy">
                <span className="trail-index">{t('03 / KEEP IT FRIENDLY')}</span>
                <h3>
                  {t('A reason to')} <br />
                  <em>{t('keep your word.')}</em>
                </h3>
                <p>
                  {t(
                    'Agree on the stakes before day one. Always virtual, always transparent. No deposits or payments—just a shared promise worth keeping.',
                  )}{' '}
                </p>
                <span className="field-hint">
                  {t('Virtual accounting arrives in the next milestone.')}{' '}
                </span>
              </div>
            </motion.article>
          </div>
        </section>
        <section className="together-section" id="why-together">
          <div className="together-symbol" aria-hidden="true">
            ✳
          </div>
          <div>
            <span className="eyebrow">{t('ACCOUNTABILITY, WITHOUT THE GUILT TRIP.')}</span>
            <h2>
              {t('You don’t need more willpower.')} <br />
              {t('You need someone in your corner.')}{' '}
            </h2>
            <p>
              {t(
                'Built for encouragement, transparent rules, and the kind of competition that brings everyone up.',
              )}{' '}
            </p>
            <Button asChild variant="secondary">
              <Link to={destination}>
                {t('Make this your day one')} <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <span>{t('Show up. Together.')}</span>
        <span>
          © {new Date().getFullYear()} {t('StakeUp · All stakes are virtual.')}
        </span>
      </footer>
    </div>
  );
}
