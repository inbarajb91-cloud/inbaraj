import { loadBase } from '@/lib/resume';
import ResumeLayout from '@/components/ResumeLayout';

export default function HomePage() {
  const data = loadBase();
  return <ResumeLayout data={data} isolated={false} />;
}
