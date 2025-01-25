import Intro from '../components/intro';

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="absolute inset-0">
      {children}
      <Intro />
    </div>
  );
};

export default layout;
