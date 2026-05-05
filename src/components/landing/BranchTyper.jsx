import { useTypingCycle } from '../../hooks/landing/useTypingCycle';
import ColorLetters from './ColorLetters';
import { C } from '../../styles/tokens';

export default function BranchTyper({ branchNames = ['Francisco Villa', 'Sol Naciente'] }) {
  const { suffix, showCursor } = useTypingCycle(branchNames);

  return (
    <div className="lp-branch-lockup relative font-display leading-tight text-center select-none">
      <div className="lp-branch-logo text-6xl sm:text-7xl lg:text-8xl">
        <ColorLetters text="Full Party" />
      </div>

      <div
        className="lp-branch-welcome mt-3 flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl"
        style={{ minHeight: '1.25em' }}
      >
        <span className="font-display" style={{ color: C.textBody }}>Bienvenido a&nbsp;</span>
        <span className="font-display" style={{ color: C.textBody }}>Suc.&nbsp;</span>
        <ColorLetters text={suffix} />
        <span
          className="cursor-blink inline-block rounded-sm self-center ml-0.5"
          style={{ width: 2, height: '0.8em', background: C.pink, opacity: showCursor ? 1 : 0 }}
        />
      </div>
    </div>
  );
}
