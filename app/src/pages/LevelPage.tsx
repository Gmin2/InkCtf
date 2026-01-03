import type { FC } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LEVELS } from '../constants';
import { MissionView } from '../components/MissionView';

interface LevelPageProps {
  theme: 'dark' | 'light';
}

export const LevelPage: FC<LevelPageProps> = ({ theme }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const levelIndex = parseInt(id || '1', 10) - 1;
  const level = LEVELS[levelIndex];

  if (!level) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-(--text-primary) mb-4">Level Not Found</h1>
          <p className="text-(--text-secondary) mb-8">The level you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="px-8 py-4 bg-ink-pink text-white font-black uppercase tracking-wider hover:brightness-110"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MissionView
      level={level}
      onBack={() => navigate('/')}
      onShowDocs={() => navigate('/docs')}
      theme={theme}
    />
  );
};
