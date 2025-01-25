import Link from '../components/link';
import { TransitionIn } from '../components/transition';

const NotFound = () => {
  return (
    <TransitionIn>
      <div>Not Found</div>
      <Link href="/">Home</Link>
    </TransitionIn>
  );
};

export default NotFound;
