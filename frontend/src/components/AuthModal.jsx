import React, { useCallback, useEffect, useState } from 'react';
import { ModalHeader } from './ModalShell';
import useEscape from '../hooks/useEscape';
import { authApi } from '../api/client';
import { DEFAULT_ACCENT } from '../utils/accent';

const LOGIN_ID_PATTERN = '[A-Za-z0-9_]{4,50}';
const LOGIN_ID_REGEX = new RegExp(`^${LOGIN_ID_PATTERN}$`);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_REGEX = /^\d{6}$/;
const RESEND_SECONDS = 60;

const EMPTY_SIGNUP = { email: '', loginId: '', password: '', nickname: '' };
const EMPTY_RESET = { loginId: '', email: '', newPassword: '', confirm: '' };

function Field({ id, label, hint, error, ...inputProps }) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} className="cyber-input" {...inputProps} />
      {error ? <div className="field-error">{error}</div> : hint && <div className="field-hint">{hint}</div>}
    </>
  );
}

function useEmailCode(purpose) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [pending, setPending] = useState('');
  const [message, setMessage] = useState({});

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const reset = useCallback(() => {
    setSent(false);
    setCode('');
    setVerified(false);
    setPending('');
    setMessage({});
  }, []);

  const send = async (email, loginId) => {
    if (pending || cooldown > 0 || verified) return;
    if (!EMAIL_REGEX.test(email.trim())) {
      setMessage({ error: '이메일 형식이 아닙니다.' });
      return;
    }
    setPending('send');
    setMessage({});
    try {
      await authApi.sendCode(email.trim(), purpose, loginId);
      setSent(true);
      setCode('');
      setCooldown(RESEND_SECONDS);
      setMessage({ hint: '인증번호를 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요. 10분 동안 유효합니다.' });
    } catch (err) {
      setMessage({ error: err.message });
    } finally {
      setPending('');
    }
  };

  const verify = async (check) => {
    if (pending) return null;
    const value = code.trim();
    if (!CODE_REGEX.test(value)) {
      setMessage({ error: '인증번호 6자리를 입력해 주세요.' });
      return null;
    }
    setPending('verify');
    setMessage({});
    try {
      const result = await check(value);
      setVerified(true);
      setMessage({ hint: '이메일 인증이 완료되었습니다.' });
      return result ?? true;
    } catch (err) {
      setMessage({ error: err.message });
      return null;
    } finally {
      setPending('');
    }
  };

  return { sent, code, setCode, verified, cooldown, pending, message, reset, send, verify };
}

function EmailCodeFields({ idPrefix, email, onEmailChange, state, onSend, onVerify, autoFocus }) {
  const sendLabel =
    state.pending === 'send'
      ? '보내는 중...'
      : state.verified
        ? '인증 완료'
        : state.cooldown > 0
          ? `재발송 (${state.cooldown}초)`
          : state.sent
            ? '재발송'
            : '인증번호 보내기';

  return (
    <>
      <label htmlFor={`${idPrefix}-email`}>이메일*</label>
      <div className="input-with-button">
        <input id={`${idPrefix}-email`} name="email" type="email" className="cyber-input" placeholder="example@email.com"
          autoComplete="email" maxLength={100} value={email} onChange={onEmailChange}
          readOnly={state.verified} required autoFocus={autoFocus} />
        <button type="button" className="cyber-button" onClick={onSend}
          disabled={state.verified || Boolean(state.pending) || state.cooldown > 0}>
          {sendLabel}
        </button>
      </div>

      {state.sent && !state.verified && (
        <>
          <label htmlFor={`${idPrefix}-code`}>인증번호*</label>
          <div className="input-with-button">
            <input id={`${idPrefix}-code`} className="cyber-input" placeholder="숫자 6자리" inputMode="numeric"
              autoComplete="one-time-code" maxLength={6} value={state.code}
              onChange={(e) => state.setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onVerify();
                }
              }} />
            <button type="button" className="cyber-button" onClick={onVerify} disabled={Boolean(state.pending)}>
              {state.pending === 'verify' ? '확인 중...' : '확인'}
            </button>
          </div>
        </>
      )}

      {state.message.error ? (
        <div className="field-error">{state.message.error}</div>
      ) : (
        state.message.hint && <div className="field-hint">{state.message.hint}</div>
      )}
    </>
  );
}

function IntroStep({ onLogin, onSignup }) {
  return (
    <div className="auth-intro">
      <div className="auth-intro-title">[ 불러오는 중... ]</div>
      <div className="box-border modal-box auth-intro-box">
        <div className="auth-intro-text">
          <strong>일정 관리 및 조율이 편해지는 서비스, HOUR를 불러오는 중입니다.</strong>
          <br />
          <br />
          ⊙ 사람들마다 다른 일정 관리 시스템, 간편한 일정 조율 서비스의 부재.
          <br />
          &nbsp;&nbsp;&nbsp;일정을 재조율하는 것에 지치지 않으셨나요?
          <br />
          <br />
          그런 당신을 위한 서비스, HOUR입니다.
          <br />
          <br />
          <strong>한 가지 서비스로 편하게 좋아하는 사람을 만나러 가세요.</strong>
        </div>
        <div className="actions">
          <button type="button" className="cyber-button" onClick={onLogin}>로그인</button>
          <button type="button" className="cyber-button" onClick={onSignup}>회원가입</button>
        </div>
      </div>
    </div>
  );
}

export default function AuthModal({ onLoginSuccess }) {
  const [step, setStep] = useState('intro');
  const [login, setLogin] = useState({ loginId: '', password: '' });
  const [signup, setSignup] = useState(EMPTY_SIGNUP);
  const [findEmail, setFindEmail] = useState('');
  const [foundId, setFoundId] = useState('');
  const [reset, setReset] = useState(EMPTY_RESET);
  const [idState, setIdState] = useState('idle');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const signupCode = useEmailCode('SIGNUP');
  const findCode = useEmailCode('FIND_ID');
  const resetCode = useEmailCode('RESET_PASSWORD');

  const goTo = (next) => {
    setError('');
    setNotice('');
    setStep(next);
  };

  const backToIntro = () => {
    goTo('intro');
    setSignup(EMPTY_SIGNUP);
    setFindEmail('');
    setFoundId('');
    setReset(EMPTY_RESET);
    setIdState('idle');
    signupCode.reset();
    findCode.reset();
    resetCode.reset();
  };

  useEscape(backToIntro, step !== 'intro' && !busy);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLogin((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignup((prev) => ({ ...prev, [name]: value }));
    if (name === 'loginId') setIdState('idle');
    if (name === 'email') signupCode.reset();
    if (error) setError('');
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setReset((prev) => ({ ...prev, [name]: value }));
    if (name === 'email' || name === 'loginId') resetCode.reset();
    if (error) setError('');
  };

  const checkLoginId = async () => {
    const loginId = signup.loginId.trim();
    if (!LOGIN_ID_REGEX.test(loginId)) {
      setIdState('invalid');
      return false;
    }
    if (idState === 'available') return true;
    setIdState('checking');
    try {
      const { available } = await authApi.checkId(loginId);
      setIdState(available ? 'available' : 'taken');
      return available;
    } catch (err) {
      setIdState('idle');
      setError(err.message);
      return false;
    }
  };

  const run = (task) => async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = run(async () => {
    const me = await authApi.login(login.loginId.trim(), login.password);
    onLoginSuccess(me);
  });

  const sendSignupCode = () => signupCode.send(signup.email);
  const verifySignupCode = () =>
    signupCode.verify((code) => authApi.verifyCode(signup.email.trim(), 'SIGNUP', code));

  const handleSignup = run(async () => {
    if (!signupCode.verified) {
      setError('이메일 인증을 완료해 주세요.');
      return;
    }
    if (!(await checkLoginId())) return;

    const form = {
      email: signup.email.trim(),
      loginId: signup.loginId.trim(),
      password: signup.password,
      nickname: signup.nickname.trim(),
      pointColor: DEFAULT_ACCENT.light,
    };
    try {
      await authApi.signup(form);
    } catch (err) {
      if (err.message.includes('인증')) signupCode.reset();
      throw err;
    }
    const me = await authApi.login(form.loginId, form.password);
    onLoginSuccess(me);
  });

  const sendFindCode = () => findCode.send(findEmail);
  const verifyFindCode = async () => {
    const result = await findCode.verify((code) => authApi.findId(findEmail.trim(), code));
    if (result?.loginId) {
      setFoundId(result.loginId);
      goTo('findIdDone');
    }
  };
  const handleFindSubmit = (e) => {
    e.preventDefault();
    if (findCode.sent) verifyFindCode();
    else sendFindCode();
  };

  const sendResetCode = () => {
    if (!reset.loginId.trim()) {
      setError('아이디를 입력해 주세요.');
      return;
    }
    resetCode.send(reset.email, reset.loginId.trim());
  };
  const verifyResetCode = () =>
    resetCode.verify((code) => authApi.verifyCode(reset.email.trim(), 'RESET_PASSWORD', code));

  const changePassword = run(async () => {
    if (reset.newPassword !== reset.confirm) {
      setError('새 비밀번호가 서로 다릅니다.');
      return;
    }
    const loginId = reset.loginId.trim();
    await authApi.resetPassword(loginId, reset.email.trim(), reset.newPassword);
    setReset(EMPTY_RESET);
    resetCode.reset();
    setLogin({ loginId, password: '' });
    goTo('login');
    setNotice('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.');
  });

  const handleResetSubmit = (e) => {
    if (resetCode.verified) {
      changePassword(e);
      return;
    }
    e.preventDefault();
    if (resetCode.sent) verifyResetCode();
    else sendResetCode();
  };

  const idMessage = {
    checking: { hint: '아이디 확인 중...' },
    available: { hint: '사용 가능한 아이디입니다.' },
    taken: { error: '이미 사용 중인 아이디입니다.' },
    invalid: { error: '아이디는 영문, 숫자, _ 로 4~50자입니다.' },
  }[idState] ?? { hint: '영문, 숫자, _ 로 4~50자' };

  return (
    <div className="modal-overlay">
      {step === 'intro' && <IntroStep onLogin={() => goTo('login')} onSignup={() => goTo('signup')} />}

      {step === 'login' && (
        <form className="box-border modal-box" onSubmit={handleLogin}>
          <ModalHeader title="로그인" onClose={backToIntro} />
          {notice && <div className="form-notice" role="status">{notice}</div>}
          <Field id="login-id" name="loginId" label="아이디*" placeholder="아이디를 입력해 주세요" autoComplete="username"
            value={login.loginId} onChange={handleLoginChange} required autoFocus={!login.loginId} />
          <Field id="login-pw" name="password" label="비밀번호*" type="password" placeholder="비밀번호를 입력해 주세요"
            autoComplete="current-password" value={login.password} onChange={handleLoginChange} required
            autoFocus={Boolean(login.loginId)} />
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="auth-footer">
            <div className="auth-links">
              <button type="button" className="text-button" onClick={() => goTo('findId')}>아이디 찾기</button>
              <span aria-hidden="true">|</span>
              <button type="button" className="text-button" onClick={() => goTo('resetPw')}>비밀번호 찾기</button>
            </div>
            <button type="submit" className="cyber-button" disabled={busy}>
              {busy ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
      )}

      {step === 'signup' && (
        <form className="box-border modal-box" onSubmit={handleSignup}>
          <ModalHeader title="회원가입" onClose={backToIntro} />
          <EmailCodeFields idPrefix="su" email={signup.email} onEmailChange={handleSignupChange}
            state={signupCode} onSend={sendSignupCode} onVerify={verifySignupCode} autoFocus />
          <Field id="su-id" name="loginId" label="아이디*" placeholder="아이디를 입력해 주세요" autoComplete="username"
            pattern={LOGIN_ID_PATTERN} title="영문, 숫자, _ 로 4~50자"
            value={signup.loginId} onChange={handleSignupChange} onBlur={() => signup.loginId && checkLoginId()}
            required hint={idMessage.hint} error={idMessage.error} />
          <Field id="su-pw" name="password" label="비밀번호*" type="password" placeholder="비밀번호를 입력해 주세요"
            autoComplete="new-password" minLength={8} maxLength={64}
            value={signup.password} onChange={handleSignupChange} required hint="8자 이상" />
          <Field id="su-nick" name="nickname" label="닉네임*" placeholder="다른 사람에게 보일 이름" autoComplete="nickname"
            maxLength={50} value={signup.nickname} onChange={handleSignupChange} required />
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="actions actions--top">
            <button type="submit" className="cyber-button" disabled={busy}>
              {busy ? '가입 중...' : '가입하기'}
            </button>
          </div>
        </form>
      )}

      {step === 'findId' && (
        <form className="box-border modal-box" onSubmit={handleFindSubmit}>
          <ModalHeader title="아이디 찾기" onClose={backToIntro} />
          <p className="auth-guide">가입할 때 쓴 이메일로 인증번호를 보내 드려요.</p>
          <EmailCodeFields idPrefix="fi" email={findEmail}
            onEmailChange={(e) => {
              setFindEmail(e.target.value);
              findCode.reset();
            }}
            state={findCode} onSend={sendFindCode} onVerify={verifyFindCode} autoFocus />
          <div className="actions actions--top">
            <button type="button" className="cyber-button" onClick={() => goTo('login')}>로그인으로</button>
          </div>
        </form>
      )}

      {step === 'findIdDone' && (
        <div className="box-border modal-box">
          <ModalHeader title="아이디 찾기" onClose={backToIntro} />
          <p className="auth-guide">이 이메일로 가입한 아이디입니다.</p>
          <div className="found-id">{foundId}</div>
          <div className="actions actions--top">
            <button type="button" className="cyber-button"
              onClick={() => {
                setReset({ ...EMPTY_RESET, loginId: foundId, email: findEmail.trim() });
                resetCode.reset();
                goTo('resetPw');
              }}>
              비밀번호 찾기
            </button>
            <button type="button" className="cyber-button" autoFocus
              onClick={() => {
                setLogin({ loginId: foundId, password: '' });
                setFindEmail('');
                findCode.reset();
                goTo('login');
              }}>
              로그인하기
            </button>
          </div>
        </div>
      )}

      {step === 'resetPw' && (
        <form className="box-border modal-box" onSubmit={handleResetSubmit}>
          <ModalHeader title="비밀번호 찾기" onClose={backToIntro} />
          <p className="auth-guide">아이디와 가입한 이메일을 입력하면 인증 후 새 비밀번호를 정할 수 있어요.</p>
          <Field id="rp-id" name="loginId" label="아이디*" placeholder="아이디를 입력해 주세요" autoComplete="username"
            value={reset.loginId} onChange={handleResetChange} readOnly={resetCode.verified} required autoFocus />
          <EmailCodeFields idPrefix="rp" email={reset.email} onEmailChange={handleResetChange}
            state={resetCode} onSend={sendResetCode} onVerify={verifyResetCode} />

          {resetCode.verified && (
            <>
              <Field id="rp-pw" name="newPassword" label="새 비밀번호*" type="password" placeholder="새 비밀번호를 입력해 주세요"
                autoComplete="new-password" minLength={8} maxLength={64}
                value={reset.newPassword} onChange={handleResetChange} required hint="8자 이상" autoFocus />
              <Field id="rp-pw2" name="confirm" label="새 비밀번호 확인*" type="password" placeholder="한 번 더 입력해 주세요"
                autoComplete="new-password" minLength={8} maxLength={64}
                value={reset.confirm} onChange={handleResetChange} required
                error={reset.confirm && reset.confirm !== reset.newPassword ? '새 비밀번호가 서로 다릅니다.' : ''} />
            </>
          )}

          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="actions actions--top">
            <button type="button" className="cyber-button" onClick={() => goTo('login')} disabled={busy}>
              로그인으로
            </button>
            {resetCode.verified && (
              <button type="submit" className="cyber-button" disabled={busy}>
                {busy ? '변경 중...' : '비밀번호 변경'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
