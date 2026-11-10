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
                <span>YOU</span>
                <span>
                  YOUR
                  <br />
                  PEOPLE
                </span>
                <i>↗</i>
              </div>
              <div className="trail-copy">
                <span className="trail-index">01 / FIND YOUR CORNER</span>
                <h3>
                  Good company.
                  <br />
                  <em>Great momentum.</em>
                </h3>
                <p>
                  One private circle. A shared ambition. Friends who notice when you show up—and
                  help you get back to it when you don’t.
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
                <span className="trail-index">02 / LEAVE A LITTLE EVIDENCE</span>
                <h3>
                  Less promising.
                  <br />
                  <em>More doing.</em>
                </h3>
                <p>
                  A photo. A little context. Your circle sees the effort and reviews it honestly.
                  Progress has a paper trail.
                </p>
              </div>
              <div className="proof-sculpture" aria-hidden="true">
                <div className="proof-print">
                  <div className="print-sun" />
                  <div className="print-hill" />
                  <span>THE SMALL WIN / TODAY</span>
                </div>
                <span className="proof-stamp">
                  SHOWED
                  <br />
                  UP ↗
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
                  ALL IN.
                  <br />
                  <em>TOGETHER.</em>
                </div>
                <small>VIRTUAL STAKES. REAL INTENTION.</small>
              </div>
              <div className="trail-copy">
                <span className="trail-index">03 / KEEP IT FRIENDLY</span>
                <h3>
                  A reason to
                  <br />
                  <em>keep your word.</em>
                </h3>
                <p>
                  Agree on the stakes before day one. Always virtual, always transparent. No
                  deposits or payments—just a shared promise worth keeping.
                </p>
                <span className="field-hint">
                  Virtual accounting arrives in the next milestone.
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
