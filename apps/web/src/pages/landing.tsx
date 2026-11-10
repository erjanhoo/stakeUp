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
          <a href="#how-it-works">{t('The idea')}</a>
          <Link to="/join">{t('Join circle')}</Link>
        </nav>
        <Button asChild size="sm" variant="outline">
          <Link to={profile ? '/app' : '/login'}>
            {t(profile ? 'Open your space' : 'Log in')}
            <ArrowUpRight size={15} />
          </Link>
        </Button>
      </header>
      <main>
        <section className="kl-hero">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="eyebrow">
              <span className="status-dot" /> {t('PRIVATE CIRCLES. SHARED INTENTION.')}
            </span>
            <h1>
              {t('Private accountability.')}
              <br />
              <em>{t('Real social stakes.')}</em>
            </h1>
            <p>{t('Make a commitment, show up, and grow with friends who get it.')}</p>
            <div className="kl-actions">
              <Button asChild>
                <Link to={destination}>
                  {t('Find your momentum')}
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
              <PiggyBank size={24} />
              <span>{t('Virtual credits · no cash value')}</span>
              <span className="pill">{t('Illustration')}</span>
            </div>
            <span className="eyebrow">{t('THE SHARED PROMISE')}</span>
            <h2>
              {t('Good habits.')}
              <br />
              {t('Great company.')}
            </h2>
            <div className="kl-score">
              <span>VC</span>
              <strong>
                100%<small>{t('virtual')}</small>
              </strong>
            </div>
            <p>{t('No deposits. No withdrawals. Just a reason to keep your word.')}</p>
            <div className="kl-proof">
              <div className="kl-proof-icon">
                <Camera size={20} />
              </div>
              <div>
                <strong>{t('Private by default.')}</strong>
                <p>{t('Your people, your promise')}</p>
              </div>
              <Lock size={15} />
            </div>
            <div className="kl-proof">
              <div className="kl-proof-icon orange">
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong>{t('People make the decision.')}</strong>
                <p>{t('Encouragement never counts as a review vote.')}</p>
              </div>
            </div>
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
          <div className="kl-emblem" aria-hidden="true">
            <Users size={72} strokeWidth={1} />
            <span>STAKEUP / TOGETHER</span>
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
              </motion.article>
            ))}
          </div>
        </section>
        <section className="kl-bottom">
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
                'New challenges let you reserve a scheduled grace day before its upload deadline, within your accepted allowance.',
              ],
            ].map(([question, answer]) => (
              <details key={question}>
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
