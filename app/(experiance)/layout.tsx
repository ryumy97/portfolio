import Cursor from '../components/cursor';
import Intro from '../components/intro';
import { TransitionOut } from '../components/transition';

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-background absolute inset-0 overflow-hidden">
      {children}
      <TransitionOut />
      <Cursor />
      <Intro />
    </div>
  );
};

export default layout;
