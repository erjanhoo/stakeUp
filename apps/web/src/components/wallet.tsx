import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Wallet as WalletIcon } from 'lucide-react';
import { currencySchema, creditsToMinor, type Wallet } from '@stakeup/contracts';
import { api, message } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useMoney } from '../lib/money';
import { useResource } from '../lib/social';
import { ErrorMessage, Loading } from './common';
import { HelpTip } from './help-tip';
import { About } from './about';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function WalletPanel({ compact = false }: { compact?: boolean }) {
  const { t, language } = useI18n(),
    { profile, refresh } = useAuth(),
    money = useMoney();
  const { data, error, reload } = useResource<Wallet>('/me/wallet');
  const [amount, setAmount] = useState('100.00'),
    [cardName, setCardName] = useState(''),
    [cardNumber, setCardNumber] = useState(''),
    [expiry, setExpiry] = useState(''),
    [securityCode, setSecurityCode] = useState(''),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(''),
    [success, setSuccess] = useState('');
  const request = useRef<{ amountMinor: number; requestId: string } | null>(null);
  async function topUp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setActionError('');
    setSuccess('');
    try {
      if (
        !cardName.trim() ||
        cardNumber.replace(/\s/g, '') !== '4242424242424242' ||
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) ||
        securityCode !== '123'
      )
        throw new Error(t('Use the demo card details shown below.'));
      const [expiryMonth, expiryYear] = expiry.split('/').map(Number);
      if (new Date(2000 + expiryYear, expiryMonth, 1).getTime() <= Date.now())
        throw new Error(t('Choose a future expiry date.'));
      const amountMinor = creditsToMinor(amount);
      if (!request.current || request.current.amountMinor !== amountMinor)
        request.current = { amountMinor, requestId: crypto.randomUUID() };
      await api<Wallet>('/me/wallet/top-up', {
        method: 'POST',
        body: JSON.stringify(request.current),
      });
      request.current = null;
      setSecurityCode('');
      await reload();
      setSuccess(t('Balance updated.'));
    } catch (e) {
      setActionError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="st-module wallet-panel" id="wallet">
      <div className="st-module-heading">
        <h2>
          <WalletIcon size={20} />
          {t('Your balance')}
          <HelpTip title="How your balance works">
            Top up your balance here. Challenge results appear after settlement; pending stakes are
            listed separately.
          </HelpTip>
        </h2>
        {compact && (
          <Link className="st-text-link" to="/app/settings#wallet">
            {t('Top up')}
            <Plus size={16} />
          </Link>
        )}
      </div>
      {!data && !error && <Loading />}
      {data && (
        <>
          <strong className="wallet-amount">{money(data.balanceMinor)}</strong>
          {data.pendingPenaltyMinor > 0 && (
            <p className="wallet-pending">
              {money(data.pendingPenaltyMinor)} {t('in pending stakes')}
            </p>
          )}
        </>
      )}
      {!compact && (
        <>
          <label className="currency-field">
            {t('Display currency')}
            <select
              value={profile?.currency ?? 'USD'}
              disabled={busy}
              onChange={async (e) => {
                setBusy(true);
                setActionError('');
                try {
                  await api('/me/currency', {
                    method: 'PATCH',
                    body: JSON.stringify({ currency: e.target.value }),
                  });
                  await refresh();
                } catch (e) {
                  setActionError(message(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {currencySchema.options.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <form className="wallet-topup form-stack" onSubmit={topUp}>
            <label>
              {t('Top-up amount')}
              <Input
                inputMode="decimal"
                type="number"
                min="1"
                max="100000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <div className="wallet-quick-amounts">
              {['100.00', '500.00', '1000.00'].map((a) => (
                <button
                  type="button"
                  key={a}
                  aria-pressed={amount === a}
                  onClick={() => setAmount(a)}
                >
                  {money(Number(a) * 100)}
                </button>
              ))}
            </div>
            <fieldset className="mock-card" disabled={busy}>
              <legend>
                {t('Demo payment card')}{' '}
                <HelpTip title="Demo card details">
                  Use card 4242 4242 4242 4242, any name, a future expiry date and security code
                  123. These fields stay in your browser and are never sent or saved.
                </HelpTip>
              </legend>
              <p>{t('Use demo card 4242 4242 4242 4242 | code 123')}</p>
              <label>
                {t('Name on card')}
                <Input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                  maxLength={80}
                  autoComplete="off"
                  placeholder="Alex Morgan"
                />
              </label>
              <label>
                {t('Card number')}
                <Input
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 16)
                        .replace(/(.{4})/g, '$1 ')
                        .trim(),
                    )
                  }
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="4242 4242 4242 4242"
                />
              </label>
              <div className="mock-card-row">
                <label>
                  {t('Expiry date')}
                  <Input
                    value={expiry}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setExpiry(
                        digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits,
                      );
                    }}
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="MM/YY"
                  />
                </label>
                <label>
                  {t('Security code')}
                  <Input
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    required
                    inputMode="numeric"
                    type="password"
                    autoComplete="off"
                    placeholder="123"
                  />
                </label>
              </div>
            </fieldset>
            <Button disabled={busy} type="submit">
              <Plus size={17} />
              {t(busy ? 'Adding…' : 'Add to balance')}
            </Button>
          </form>
          {success && (
            <p role="status" className="wallet-success">
              {success}
            </p>
          )}
          <About title="About your balance">
            <p>
              {t(
                'Top-ups are added immediately. Final challenge stakes and rewards appear after settlement. Pending stakes are shown separately until reviews and the appeal window close.',
              )}
            </p>
            <p>
              {t(
                'Currency changes the display unit for all amounts. Existing amounts keep their number; no exchange rate is applied.',
              )}
            </p>
          </About>
          {data && (
            <details className="about-dropdown">
              <summary>
                {t('Balance history')}
                <ArrowRight size={16} />
              </summary>
              <div className="wallet-history">
                {data.entries.length ? (
                  data.entries.map((entry) => (
                    <div key={entry.id}>
                      <span>
                        <strong>
                          {t(entry.kind === 'top_up' ? 'Balance top-up' : entry.kind)}
                        </strong>
                        <small>{new Date(entry.createdAt).toLocaleString(language)}</small>
                      </span>
                      <strong>
                        {entry.kind === 'penalty' ? '−' : '+'}
                        {money(entry.amountMinor)}
                      </strong>
                    </div>
                  ))
                ) : (
                  <p>{t('Your top-ups and challenge results will appear here.')}</p>
                )}
              </div>
            </details>
          )}
        </>
      )}
      {(error || actionError) && <ErrorMessage message={error || actionError} />}
    </section>
  );
}
