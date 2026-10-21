/*
 * Logisim Revisited. GPL-3.0-or-later; see LICENSE.
 * Logic challenges: the goal, a verifier that exhaustively tests the circuit, progressive hints and a shareable result.
 */
import { useEffect, useState } from 'react';
import { getDailyChallenge, LOGIC_CHALLENGES, verifyCircuitTruthTable, type Circuit, type LogicChallenge, type VerificationResult } from '@logisim/core';
import { Icon } from './icons';

interface Props {
  challenge: LogicChallenge | null;
  circuit: Circuit;
  onStart(c: LogicChallenge): void;
  onExit(): void;
  onHighlight(components: string[]): void;
}

export function ChallengePanel({ challenge, circuit, onStart, onExit, onHighlight }: Props) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [hints, setHints] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setResult(null);
    setHints(0);
    setCopied(false);
  }, [challenge?.id]);

  useEffect(() => {
    onHighlight(challenge && hints > 0 ? challenge.coachStages[hints - 1].highlightComponents : []);
  }, [challenge, hints]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!challenge) {
    const today = new Date().toISOString().slice(0, 10);
    const daily = getDailyChallenge(today);
    return (
      <div className="challenges">
        <section className="card">
          <div className="eyebrow">Today · {today}</div>
          <div className="card-title">{daily.title}</div>
          <p className="muted small">{daily.goal}</p>
          <button className="btn small" onClick={() => onStart(daily)}>
            <Icon name="play" size={16} /> Start daily challenge
          </button>
        </section>
        <h3>All challenges</h3>
        {LOGIC_CHALLENGES.map((c) => (
          <button key={c.id} className="list-item" onClick={() => onStart(c)}>
            <span>
              <strong>{c.title}</strong>
              <span className="muted small"> · level {c.level}</span>
            </span>
            <Icon name="chevron" size={16} />
          </button>
        ))}
      </div>
    );
  }

  const verify = () => {
    try {
      setResult(verifyCircuitTruthTable(circuit, challenge.inputNames, challenge.outputNames, challenge.expectedFn));
    } catch {
      setResult({ passed: false, totalRows: 0, passedRows: 0, firstFailure: null });
    }
  };
  const share = async () => {
    const text = `Logisim Revisited · ${challenge.title} ✓ (${challenge.score} pts)\n${location.href.split(/[?#]/)[0]}?challenge=${challenge.id}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      prompt('Copy your result:', text);
    }
  };
  const f = result?.firstFailure;

  return (
    <div className="challenges">
      <section className="card">
        <div className="eyebrow">Level {challenge.level} · {challenge.score} pts</div>
        <div className="card-title">{challenge.title}</div>
        <p>{challenge.goal}</p>
        <div className="row">
          <button className="btn" onClick={verify}>
            <Icon name="check" size={16} /> Check my circuit
          </button>
          <button className="btn alt" onClick={onExit}>
            Leave
          </button>
        </div>
        {result && (
          <div className={`verdict ${result.passed ? 'pass' : 'fail'}`} role="status">
            {result.passed ? (
              <>
                <strong>Solved!</strong> All {result.totalRows} input combinations are correct.
                <div className="row">
                  <button className="btn small" onClick={share}>
                    <Icon name="share" size={16} /> {copied ? 'Copied' : 'Share result'}
                  </button>
                </div>
              </>
            ) : f ? (
              <>
                <strong>
                  {result.passedRows}/{result.totalRows} rows correct.
                </strong>{' '}
                With inputs <span className="mono">{JSON.stringify(f.inputs)}</span> expected <span className="mono">{JSON.stringify(f.expected)}</span> but got{' '}
                <span className="mono">{JSON.stringify(f.actual)}</span>.
              </>
            ) : (
              <strong>Could not check this circuit. Make sure the input and output pins keep their labels.</strong>
            )}
          </div>
        )}
      </section>
      <section className="card">
        <div className="card-title">Hints</div>
        <ol className="stages">
          {challenge.coachStages.slice(0, hints).map((s, i) => (
            <li key={i} className={i === hints - 1 ? 'current' : ''}>
              <strong>{s.label}</strong>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <button className="btn small alt" disabled={hints >= challenge.coachStages.length} onClick={() => setHints((h) => h + 1)}>
          <Icon name="bulb" size={16} /> {hints === 0 ? 'Coach me' : hints >= challenge.coachStages.length ? 'No more hints' : 'Next hint'}
        </button>
      </section>
    </div>
  );
}
