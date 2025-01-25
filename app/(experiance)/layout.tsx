import Cursor from '../components/cursor';
import Intro from '../components/intro';

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-background absolute inset-0">
      {children}
      <Cursor />
      <Intro />
    </div>
  );
};

export default layout;
