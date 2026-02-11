import { useState, useEffect } from 'react';
import RiskRewardInterface from './components/RiskRewardInterface';
import StandardTrade from './components/StandardTrade';

function App() {
  const [currentPage, setCurrentPage] = useState<'standard' | 'flex'>('standard');
  const [flexDirection, setFlexDirection] = useState<'over' | 'under'>('over');
  const [isEmbedMode, setIsEmbedMode] = useState(false);

  // 检查URL参数，判断是否为嵌入模式
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const embed = urlParams.get('embed');
    if (embed === 'true' || embed === '1') {
      setIsEmbedMode(true);
      setCurrentPage('flex'); // 嵌入模式直接显示Flex Prediction
      
      // 嵌入模式下隐藏滚动条
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      // 清理
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleEnterFlexMode = (direction: 'over' | 'under') => {
    setFlexDirection(direction);
    setCurrentPage('flex');
  };

  const handleBackToStandard = () => {
    setCurrentPage('standard');
  };

  // 嵌入模式：只显示Flex Prediction，支持响应式缩放
  if (isEmbedMode) {
    return (
      <RiskRewardInterface 
        initialDirection={flexDirection}
        embedMode={true}
      />
    );
  }

  if (currentPage === 'flex') {
    return (
      <RiskRewardInterface 
        initialDirection={flexDirection}
        onBack={handleBackToStandard}
      />
    );
  }

  return <StandardTrade onEnterFlexMode={handleEnterFlexMode} />;
}

export default App;
