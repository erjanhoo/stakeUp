import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Camera,
  Flame,
  Users,
  ShieldCheck,
  MoveUpRight,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Brand } from '../components/common';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth';

export function Landing() {
  const { profile } = useAuth();
  const destination = profile ? '/app' : '/register';
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#how-it-works">The idea</a>
          <a href="#why-together">Why together?</a>
        </nav>
        <Button asChild variant="outline" size="sm">
          <Link to={profile ? '/app' : '/login'}>
            {profile ? 'Open your space' : 'Log in'} <ArrowUpRight size={16} />
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
              <span className="status-dot" /> BETTER HABITS. BETTER COMPANY.
            </div>
            <h1>
              Big goals.
              <br />
              Small steps.
              <br />
              <span>Your people.</span>
              <span className="heading-star">✳</span>
            </h1>
            <p>
              You’ve got the ambition. Bring the accountability.
              <br className="desktop-break" /> Make a commitment, show up, and grow with friends who
              get it.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link to={destination}>
                  Find your momentum <ArrowUpRight size={19} />
                </Link>
              </Button>
              <span>
                Less “one day.”
                <br />
                <strong>More day one.</strong>
              </span>
            </div>
            <div className="hero-fine">
              <ShieldCheck size={15} /> Private circles. Friendly stakes. Always virtual.
            </div>
          </motion.div>
          <div
            className="hero-art"
            aria-label="An illustration of friends building consistent habits"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="art-coordinate top-coordinate">THE SHOW-UP EFFECT ↗</div>
            <div className="commitment-card">
              <div className="illustration-label">
                <span className="tiny-icon">
                  <Flame size={18} />
                </span>{' '}
                THE DAILY PROMISE <span>01 / 03</span>
              </div>
              <h2>
                Show up.
                <br />
                Stack wins.
              </h2>
              <div className="habit-line">
                <span>Commit to something good</span>
                <span className="illustration-check">
                  <Check size={15} />
                </span>
              </div>
              <div className="habit-line">
                <span>Keep each other going</span>
                <span className="illustration-check">
                  <Check size={15} />
                </span>
              </div>
              <div className="habit-line">
                <span>Make consistency your thing</span>
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
              <div className="illustration-caption">A little progress. A lot of possibility.</div>
            </div>
            <div className="floating-proof">
              <span className="proof-camera">
                <Camera size={23} />
              </span>
              <div>
                <strong>A little proof.</strong>
                <span>A big commitment.</span>
              </div>
              <MoveUpRight size={17} />
            </div>
            <div className="together-sticker">
              <Users size={26} />
              <span>
                IN GOOD
                <br />
                <strong>COMPANY.</strong>
              </span>
            </div>
            <div className="art-coordinate bottom-coordinate">CONSISTENCY LOOKS GOOD ON YOU.</div>
          </div>
        </section>
        <div className="manifesto-strip">
          <span>FOR THE EARLY RISERS</span>
          <span>✳</span>
          <span>THE ONE-MORE-REP PEOPLE</span>
          <span>✳</span>
          <span>THE CHAPTER-A-DAY CREW</span>
          <span>✳</span>
          <span>AND THE JUST-GETTING-STARTED</span>
        </div>
        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A SIMPLE IDEA. A STRONGER YOU.</span>
              <h2>Your goals need a circle.</h2>
            </div>
            <p>
              Motivation comes and goes.
              <br />
              Your people keep showing up.
            </p>
          </div>
          <div className="how-grid">
            {[
              {
                number: '01',
                icon: Users,
                title: 'Bring your people.',
                copy: 'A private space for friends with a shared ambition. Small circles. Big encouragement.',
              },
              {
                number: '02',
                icon: Camera,
                title: 'Put in the proof.',
                copy: 'Make the rules together, then show your daily effort. Honest progress beats perfect promises.',
              },
              {
                number: '03',
                icon: Zap,
                title: 'Keep the stakes friendly.',
                copy: 'Virtual penalties make commitments feel real. No deposits, no payments. Just a reason to show up.',
              },
            ].map((item) => (
              <article className="how-card" key={item.number}>
                <div className="how-card-top">
                  <item.icon size={23} />
                  <span>{item.number}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="together-section" id="why-together">
          <div className="together-symbol" aria-hidden="true">
            ✳
          </div>
          <div>
            <span className="eyebrow">ACCOUNTABILITY, WITHOUT THE GUILT TRIP.</span>
            <h2>
              You don’t need more willpower.
              <br />
              You need someone in your corner.
            </h2>
            <p>
              Built for encouragement, transparent rules, and the kind of competition that brings
              everyone up.
            </p>
            <Button asChild variant="secondary">
              <Link to={destination}>
                Make this your day one <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <span>Show up. Together.</span>
        <span>© {new Date().getFullYear()} StakeUp · All stakes are virtual.</span>
      </footer>
    </div>
  );
}
