import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, TrendingUp, ExternalLink, Zap } from 'lucide-react';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import ModuleFederationPipeline from '../components/ModuleFederationPipeline';

const PipelinePage: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Module Federation approach - no complex bridge logic needed
  // Data sync happens through the ModuleFederationPipeline component

  return (
    <div className="w-full overflow-hidden relative" style={{ height: 'calc(100vh - 80px)', paddingTop: '60px' }}>
      {/* Full Screen Pipeline Component */}
      <div className="h-full w-full">
        <ModuleFederationPipeline showHeader={false} />
      </div>
    </div>
  );
};

export default PipelinePage;