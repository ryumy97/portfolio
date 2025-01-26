import Header from '../components/header';
import Link from '../components/link';
import { TransitionIn } from '../components/transition';

const NotFound = () => {
  return (
    <TransitionIn>
      <Header />
      <Link href="/">Home</Link>
    </TransitionIn>
  );
};

export default NotFound;
