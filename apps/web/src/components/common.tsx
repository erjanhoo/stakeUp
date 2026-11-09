import { ArrowUpRight, Mountain, LoaderCircle, CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="StakeUp home">
      <span className="brand-icon">
        <Mountain size={23} strokeWidth={2.7} />
      </span>
      stake<span className="brand-up">up</span>
    </Link>
  );
}
export function Loading({ full = false }: { full?: boolean }) {
  return (
    <div className={full ? 'loading full' : 'loading'} role="status">
      <LoaderCircle className="spin" size={24} />
      <span>Getting things ready…</span>
    </div>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="error-message" role="alert">
      <CircleAlert size={18} />
      <span>{message}</span>
    </div>
  );
}
export function PhaseNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="phase-note">
      <span className="eyebrow">UP NEXT · MILESTONE 02</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <Button asChild variant="ghost">
        <Link to="/app/roadmap">
          See what’s coming <ArrowUpRight size={16} />
        </Link>
      </Button>
    </div>
  );
}
export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span className={`avatar ${large ? 'avatar-large' : ''}`} aria-hidden="true">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
