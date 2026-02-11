import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, SlidersHorizontal } from 'lucide-react';

interface StandardTradeProps {
  onEnterFlexMode: (direction: 'over' | 'under') => void;
}

const StandardTrade: React.FC<StandardTradeProps> = ({ onEnterFlexMode }) => {
  // 比赛数据
  const matchData = {
    homeTeam: 'KC',
    homeFullName: 'Chiefs',
    awayTeam: 'BUF',
    awayFullName: 'Bills',
    homeScore: 14,
    awayScore: 10,
    matchTime: 3,
    timeInQuarter: '8:42',
    isLive: true,
    date: 'Today',
    time: '8:30 PM',
    volume: '$12.4k',
  };

  // 市场预期总分
  const MARKET_LINE = 38.5;
  
  // 盘口选项 - 围绕市场预期总分38.5设置
  const lineOptions = [32.5, 35.5, 38.5, 41.5, 44.5];
  const [selectedLine, setSelectedLine] = useState(MARKET_LINE);
  
  // 当前选中的方向
  const [selectedDirection, setSelectedDirection] = useState<'over' | 'under' | null>(null);
  
  // 金额
  const [amount, setAmount] = useState(0);

  // 模拟赔率数据 - 用美分表示（prediction market 风格）
  // 基于Flex Prediction的数据：
  // Over 38.5 = 60% implied prob (1.67x), Under 38.5 = 40% implied prob (2.50x)
  const getPrice = (line: number, dir: 'over' | 'under') => {
    // Over: 盘口越高越难达到，价格越低
    // Under: 盘口越低越难达到，价格越低
    const diff = line - MARKET_LINE;
    
    if (dir === 'over') {
      // Over 38.5 ≈ 60¢, 每增加3分，价格降约8¢
      const base = 60;
      const adjustment = diff * -2.7;
      return Math.max(15, Math.min(85, Math.round(base + adjustment)));
    } else {
      // Under 38.5 ≈ 40¢, 每降低3分，价格降约8¢
      const base = 40;
      const adjustment = diff * 2.7;
      return Math.max(15, Math.min(85, Math.round(base + adjustment)));
    }
  };

  const overPrice = getPrice(selectedLine, 'over');
  const underPrice = getPrice(selectedLine, 'under');

  const handleQuickAmount = (add: number) => {
    setAmount(prev => Math.max(0, prev + add));
  };

  const potentialWin = selectedDirection 
    ? ((amount / (selectedDirection === 'over' ? overPrice : underPrice)) * 100 - amount).toFixed(2)
    : '0.00';

  const formatMatchTime = () => `Q${matchData.matchTime} ${matchData.timeInQuarter}`;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4 font-sans select-none">
      {/* iPhone 14 容器 - 390x844 */}
      <div 
        className="relative bg-gray-900 rounded-[50px] p-3 shadow-2xl"
        style={{ width: '390px', height: '844px' }}
      >
        {/* 动态岛 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-20" />
        
        {/* 屏幕内容 */}
        <div className="w-full h-full bg-gray-50 rounded-[38px] overflow-hidden relative flex flex-col">
          
          {/* 状态栏 */}
          <div className="h-11 bg-white flex items-end justify-between px-8 pb-1">
            <span className="text-xs font-semibold text-gray-900">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
              </svg>
              <svg className="w-4 h-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 22h2V2H2v20zm4 0h2V7H6v15zm4 0h2V12h-2v10zm4 0h2V2h-2v20zm4 0h2V7h-2v15z"/>
              </svg>
              <div className="flex items-center ml-0.5">
                <div className="w-6 h-3 border-2 border-gray-900 rounded-sm flex items-center p-0.5 relative">
                  <div className="w-full h-full bg-gray-900 rounded-[1px]"></div>
                </div>
                <div className="w-0.5 h-1.5 bg-gray-900 rounded-r-sm -ml-[1px]"></div>
              </div>
            </div>
          </div>

          {/* 可滚动内容区 */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            
            {/* 导航栏 */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100">
              <div className="flex items-center justify-between px-4 py-2">
                <button className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
                  <ChevronLeft size={18} className="text-gray-600" />
                </button>
                <p className="text-[11px] font-medium text-gray-500">
                  Sports · NFL
                </p>
                <div className="w-6"></div>
              </div>
            </div>

            {/* 比赛信息卡片 - 紧凑版 */}
            <div className="px-4 py-2">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-3 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                {/* 两队对阵 */}
                <div className="flex items-center justify-between">
                  {/* 主队 */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xs mb-1 shadow-md shadow-red-500/15">
                      {matchData.homeTeam}
                    </div>
                    <span className="text-xs font-medium text-gray-600">{matchData.homeFullName}</span>
                  </div>
                  
                  {/* 比分与状态 */}
                  <div className="flex flex-col items-center px-3">
                    {/* LIVE 标签 */}
                    {matchData.isLive && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">{formatMatchTime()}</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{matchData.homeScore}</span>
                      <span className="text-base text-gray-300 font-light">-</span>
                      <span className="text-2xl font-bold text-gray-900">{matchData.awayScore}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5">Total: {matchData.homeScore + matchData.awayScore}</span>
                  </div>
                  
                  {/* 客队 */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs mb-1 shadow-md shadow-blue-500/15">
                      {matchData.awayTeam}
                    </div>
                    <span className="text-xs font-medium text-gray-600">{matchData.awayFullName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals 市场区域 */}
            <div className="px-4 pt-1 pb-2">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* 市场标题 + Flex入口 */}
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">Totals</h3>
                      <span className="text-[10px] text-gray-400">$4.2k Vol.</span>
                    </div>
                    {/* Flex 情境化入口 */}
                    <button
                      onClick={() => onEnterFlexMode(selectedDirection || 'over')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100 border border-violet-200/70 hover:border-violet-300 transition-all group"
                    >
                      <SlidersHorizontal size={13} className="text-violet-500" />
                      <span className="text-[11px] font-semibold text-violet-600">Flex</span>
                      <ChevronRight size={12} className="text-violet-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* 盘口选择器 */}
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-center gap-0.5">
                    <button className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
                      <ChevronLeft size={14} className="text-gray-400" />
                    </button>
                    {lineOptions.map((line) => (
                      <button
                        key={line}
                        onClick={() => setSelectedLine(line)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          selectedLine === line
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {line}
                      </button>
                    ))}
                    <button className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Over/Under 选项 */}
                <div className="p-3">
                  <div className="flex gap-3 mb-2">
                    {/* Over 按钮 */}
                    <button
                      onClick={() => setSelectedDirection('over')}
                      className={`relative flex-1 p-3 rounded-xl border-2 transition-all flex flex-col justify-between overflow-hidden group ${
                        selectedDirection === 'over'
                          ? 'bg-[#00C896]/10 border-[#00C896] shadow-sm'
                          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full mb-1">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          selectedDirection === 'over' ? 'text-[#00C896]' : 'text-gray-500'
                        }`}>
                          Over {selectedLine}
                        </span>
                        <span className={`text-lg font-bold ${
                          selectedDirection === 'over' ? 'text-[#00C896]' : 'text-gray-900'
                        }`}>
                          {overPrice}¢
                        </span>
                      </div>
                      
                      {/* 迷你趋势图 (Sparkline) - 绿色 */}
                      <div className="h-8 w-full mt-1 opacity-80">
                        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                          <path 
                            d="M0,35 Q10,32 20,25 T40,28 T60,15 T80,20 T100,5" 
                            fill="none" 
                            stroke={selectedDirection === 'over' ? '#00C896' : '#10b981'} 
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-sm"
                          />
                          <path 
                            d="M0,35 Q10,32 20,25 T40,28 T60,15 T80,20 T100,5 V40 H0 Z" 
                            fill={selectedDirection === 'over' ? '#00C896' : '#10b981'} 
                            fillOpacity="0.1" 
                            stroke="none"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Under 按钮 */}
                    <button
                      onClick={() => setSelectedDirection('under')}
                      className={`relative flex-1 p-3 rounded-xl border-2 transition-all flex flex-col justify-between overflow-hidden group ${
                        selectedDirection === 'under'
                          ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full mb-1">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          selectedDirection === 'under' ? 'text-amber-500' : 'text-gray-500'
                        }`}>
                          Under {selectedLine}
                        </span>
                        <span className={`text-lg font-bold ${
                          selectedDirection === 'under' ? 'text-amber-500' : 'text-gray-900'
                        }`}>
                          {underPrice}¢
                        </span>
                      </div>

                      {/* 迷你趋势图 (Sparkline) - 橙色 */}
                      <div className="h-8 w-full mt-1 opacity-80">
                        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                          <path 
                            d="M0,15 Q15,20 30,10 T50,25 T70,18 T90,30 T100,35" 
                            fill="none" 
                            stroke={selectedDirection === 'under' ? '#f59e0b' : '#f59e0b'} 
                            strokeWidth="2" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-sm"
                          />
                           <path 
                            d="M0,15 Q15,20 30,10 T50,25 T70,18 T90,30 T100,35 V40 H0 Z" 
                            fill={selectedDirection === 'under' ? '#f59e0b' : '#f59e0b'} 
                            fillOpacity="0.1" 
                            stroke="none"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>

                  {/* Order Book Depth Bar (买卖力度条) */}
                  <div className="px-1">
                    <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-1">
                      <span>{overPrice}% Buy</span>
                      <span>{underPrice}% Sell</span>
                    </div>
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
                      <div 
                        className="h-full bg-[#00C896]" 
                        style={{ width: `${overPrice}%` }} 
                      />
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ width: `${underPrice}%` }} 
                      />
                      {/* 如果两者之和不足100%，剩下的就是灰色背景，表示Spread */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部留白给交易面板 */}
            <div className="h-48"></div>
          </div>

          {/* 底部交易面板 - 固定 */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            {/* 拖动条 */}
            <div className="flex justify-center py-1.5">
              <div className="w-9 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-4 pb-8">
              {/* 金额输入 */}
              <div className="flex items-center justify-between mb-2.5">
                <button 
                  onClick={() => setAmount(prev => Math.max(0, prev - 10))}
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus size={16} className="text-gray-600" />
                </button>
                <div className="flex-1 mx-2 text-center">
                  <span className="text-2xl font-bold text-gray-900">${amount}</span>
                </div>
                <button 
                  onClick={() => setAmount(prev => prev + 10)}
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus size={16} className="text-gray-600" />
                </button>
              </div>

              {/* 快捷金额按钮 */}
              <div className="flex gap-1.5 mb-2">
                {[1, 20, 100].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleQuickAmount(val)}
                    className="flex-1 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-600 transition-colors"
                  >
                    +${val}
                  </button>
                ))}
                <button
                  onClick={() => setAmount(1000)}
                  className="flex-1 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-600 transition-colors"
                >
                  Max
                </button>
              </div>

              {/* 潜在收益 - 始终显示 */}
              <div className="flex justify-between items-center py-2.5 px-1 mb-2 bg-gray-50/50 rounded-lg">
                <span className="text-gray-500 font-semibold text-sm">Est. Payout</span>
                <span className={`font-bold text-xl ${
                  selectedDirection && amount > 0 
                    ? selectedDirection === 'over' 
                      ? 'text-[#00C896]' 
                      : 'text-amber-500'
                    : 'text-gray-400'
                }`}>
                  {selectedDirection && amount > 0 ? `+$${potentialWin}` : '--'}
                </span>
              </div>

              {/* Buy 按钮 */}
              <button 
                disabled={!selectedDirection || amount === 0}
                className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-all ${
                  !selectedDirection || amount === 0
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : selectedDirection === 'over'
                      ? 'bg-[#00C896] hover:bg-[#00B085] active:scale-[0.98]'
                      : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.98]'
                }`}
              >
                {!selectedDirection 
                  ? 'Select Over or Under' 
                  : amount === 0 
                    ? 'Enter Amount' 
                    : `Buy ${selectedDirection === 'over' ? 'Over' : 'Under'} ${selectedLine}`}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardTrade;
