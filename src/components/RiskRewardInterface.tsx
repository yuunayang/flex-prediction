import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, ArrowRight, ChevronLeft, Info } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceDot } from 'recharts';

interface RiskRewardInterfaceProps {
  initialDirection?: 'over' | 'under';
  onBack?: () => void;
  embed?: boolean;
}

const PHONE_W = 390;
const PHONE_H = 844;

const RiskRewardInterface: React.FC<RiskRewardInterfaceProps> = ({ 
  initialDirection = 'over',
  onBack,
  embed = false,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!embed || !wrapperRef.current) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const s = Math.min(width / PHONE_W, height / PHONE_H, 1);
        setScale(s);
      }
    });

    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [embed]);
  // ==================== 比赛实时状态 ====================
  // 模拟 NFL Live 比赛数据
  const [matchData, setMatchData] = useState({
    homeTeam: 'KC Chiefs',
    awayTeam: 'Bills',
    homeScore: 14,
    awayScore: 10,
    matchTime: 3, // 第几节 (1-4)
    timeInQuarter: '8:42', // 当前节剩余时间
    isLive: true,
  });

  // ==================== NFL 配置常量 ====================
  // 当前比分（已发生，用于参考）
  const _currentTotalScore = matchData.homeScore + matchData.awayScore; // 24
  void _currentTotalScore; // 保留供参考
  
  // 市场共识盘口（中间值）
  const MARKET_LINE = 38.5;
  
  // Over 模式配置：26.5 → 55.5
  // 左侧是低分（接近当前比分，容易达成，低风险），右侧是高分（难达成，高风险）
  const OVER_MIN = 26.5;
  const OVER_MAX = 55.5;
  const OVER_RANGE = OVER_MAX - OVER_MIN; // 29
  
  // Under 模式配置：28.5 → 55.5
  // 左侧是低分（难达成，高风险），右侧是高分（容易达成，低风险）
  const UNDER_MIN = 28.5;
  const UNDER_MAX = 55.5;
  const UNDER_RANGE = UNDER_MAX - UNDER_MIN; // 27
  
  // 主题色配置
  const COLORS = {
    over: '#00C896',
    under: '#f59e0b',
  };

  // ==================== 状态管理 ====================
  const [direction, setDirection] = useState<'over' | 'under'>(initialDirection);
  const [targetScore, setTargetScore] = useState(MARKET_LINE);
  const [investment, setInvestment] = useState(100);
  const [multiplierFlicker, setMultiplierFlicker] = useState(false);

  // 实时波动因子（模拟市场波动）
  const [volatilityFactor, setVolatilityFactor] = useState(0);

  // ==================== 实时数据模拟 ====================
  useEffect(() => {
    if (!matchData.isLive) return;

    // 模拟 NFL 比赛时间流逝（在第3节内循环，用于演示）
    const timeInterval = setInterval(() => {
      setMatchData(prev => {
        // 模拟时间倒计时
        const [mins, secs] = prev.timeInQuarter.split(':').map(Number);
        let newMins = mins;
        let newSecs = secs - 15; // 每次减少15秒
        
        if (newSecs < 0) {
          newSecs = 45;
          newMins = mins - 1;
        }
        
        // 在 5:00 - 10:00 之间循环
        if (newMins < 5) {
          newMins = 10;
          newSecs = 0;
        }
        
        return {
          ...prev,
          timeInQuarter: `${newMins}:${newSecs.toString().padStart(2, '0')}`,
        };
      });
    }, 3000); // 每 3 秒更新一次

    // 模拟 Multiplier 实时波动
    const volatilityInterval = setInterval(() => {
      setVolatilityFactor(Math.random() * 0.1 - 0.05); // -5% 到 +5%
      setMultiplierFlicker(true);
      setTimeout(() => setMultiplierFlicker(false), 200);
    }, 2000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(volatilityInterval);
    };
  }, [matchData.isLive]);
 
  // 当前模式的范围
  const currentRange = direction === 'over' ? OVER_RANGE : UNDER_RANGE;

  // 当分数范围变化时，调整目标分数
  useEffect(() => {
    if (direction === 'over') {
      if (targetScore < OVER_MIN) setTargetScore(OVER_MIN);
      if (targetScore > OVER_MAX) setTargetScore(OVER_MAX);
    } else {
      if (targetScore < UNDER_MIN) setTargetScore(UNDER_MIN);
      if (targetScore > UNDER_MAX) setTargetScore(UNDER_MAX);
    }
  }, [OVER_MIN, OVER_MAX, UNDER_MIN, UNDER_MAX, direction, targetScore]);

  // ==================== 计算逻辑 ====================
  // 基于用户提供的数值表进行线性插值计算
  
  // Over 数据点 (score → multiplier)
  // 目标分越低(接近当前比分24)越容易达成，风险越低
  // 目标分越高越难达成，风险越高
  const OVER_DATA_POINTS = [
    { score: 26.5, multiplier: 1.05, prob: 95 },   // Low Risk
    { score: 32.5, multiplier: 1.25, prob: 80 },   // Medium-Low
    { score: 38.5, multiplier: 1.67, prob: 60 },   // Medium (Market Line)
    { score: 45.5, multiplier: 2.85, prob: 35 },   // Medium-High
    { score: 55.5, multiplier: 8.00, prob: 12.5 }, // High Risk
  ];
  
  // Under 数据点 (score → multiplier)
  // 目标分越低(接近当前比分24)越难达成，风险越高
  // 目标分越高越容易达成，风险越低
  const UNDER_DATA_POINTS = [
    { score: 28.5, multiplier: 6.50, prob: 15 },   // High Risk
    { score: 34.5, multiplier: 3.30, prob: 30 },   // Medium-High
    { score: 38.5, multiplier: 2.50, prob: 40 },   // Medium (Market Line)
    { score: 44.5, multiplier: 1.42, prob: 70 },   // Medium-Low
    { score: 55.5, multiplier: 1.08, prob: 92 },   // Low Risk
  ];
  
  // 线性插值函数
  const interpolate = (score: number, dataPoints: typeof OVER_DATA_POINTS) => {
    // 边界处理
    if (score <= dataPoints[0].score) return dataPoints[0].multiplier;
    if (score >= dataPoints[dataPoints.length - 1].score) return dataPoints[dataPoints.length - 1].multiplier;
    
    // 找到所在区间并插值
    for (let i = 0; i < dataPoints.length - 1; i++) {
      if (score >= dataPoints[i].score && score <= dataPoints[i + 1].score) {
        const t = (score - dataPoints[i].score) / (dataPoints[i + 1].score - dataPoints[i].score);
        return dataPoints[i].multiplier + t * (dataPoints[i + 1].multiplier - dataPoints[i].multiplier);
      }
    }
    return dataPoints[0].multiplier;
  };
  
  const calculateMultiplier = useCallback((score: number, dir: 'over' | 'under') => {
    const dataPoints = dir === 'over' ? OVER_DATA_POINTS : UNDER_DATA_POINTS;
    const baseMultiplier = interpolate(score, dataPoints);
    
    // 添加实时波动 (±5%)
    const finalMultiplier = baseMultiplier * (1 + volatilityFactor);
    
    return parseFloat(Math.max(1.05, finalMultiplier).toFixed(2));
  }, [volatilityFactor]);
  
  // 计算隐含胜率 (Implied Probability)
  const calculateImpliedProb = useCallback((multiplier: number) => {
    // 隐含胜率 = 1 / 倍率 * 100%
    return Math.round((1 / multiplier) * 100);
  }, []);

  // 计算当前滑块位置 (0 到 currentRange)
  const getCurrentSliderValue = useCallback((target: number, dir: 'over' | 'under') => {
    if (dir === 'over') {
      // Over: 滑块从左到右，目标分从 26.5 到 55.5（风险递增）
      return target - OVER_MIN;
    } else {
      // Under: 滑块从左到右，目标分从 55.5 到 28.5（风险递增）
      // X轴从大到小显示，滑块右移=分数降低=风险增加
      return UNDER_MAX - target;
    }
  }, [OVER_MIN, UNDER_MAX]);

  // 生成图表数据
  const chartData = useMemo(() => {
    const data = [];
    const range = direction === 'over' ? OVER_RANGE : UNDER_RANGE;
    const currentSliderVal = getCurrentSliderValue(targetScore, direction);
    
    for (let i = 0; i <= range; i++) {
      // Over: X 轴位置 i 对应 score = 26.5 + i (从小到大: 26.5, 27.5, ..., 55.5)
      // Under: X 轴位置 i 对应 score = 55.5 - i (从大到小: 55.5, 54.5, ..., 28.5)
      const score = direction === 'over' 
        ? OVER_MIN + i 
        : UNDER_MAX - i;
      
      const multiplier = calculateMultiplier(score, direction);
      
      data.push({
        xValue: i, // X 轴位置
        score,
        activeMultiplier: i <= currentSliderVal ? multiplier : null,
        inactiveMultiplier: i >= currentSliderVal ? multiplier : null,
        multiplier,
      });
    }
    
    return data;
  }, [direction, targetScore, calculateMultiplier, getCurrentSliderValue, OVER_MIN, UNDER_MAX, OVER_RANGE, UNDER_RANGE]);

  const currentMultiplier = calculateMultiplier(targetScore, direction);
  
  // 金额验证
  const MIN_AMOUNT = 10;
  const MAX_AMOUNT = 9999999;
  
  const potentialReturn = (investment < MIN_AMOUNT || investment > MAX_AMOUNT)
    ? '--' 
    : (investment * currentMultiplier).toFixed(2);

  const isAmountTooLow = investment < MIN_AMOUNT;
  const isAmountTooHigh = investment > MAX_AMOUNT;
  const isAmountInvalid = isAmountTooLow || isAmountTooHigh;

  const [amountDisplay, setAmountDisplay] = useState<string>(String(investment));

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    rawValue = rawValue.replace(/[^\d]/g, '');
    if (rawValue.length > 1) {
      rawValue = rawValue.replace(/^0+/, '');
    }
    setAmountDisplay(rawValue);
    const numValue = rawValue === '' ? 0 : Number(rawValue);
    setInvestment(numValue);
  };

  const currentSliderValue = getCurrentSliderValue(targetScore, direction);
  const sliderPercent = (currentSliderValue / currentRange) * 100;

  const handleDirectionChange = (newDirection: 'over' | 'under') => {
    setDirection(newDirection);
    // 切换方向时重置为市场共识盘口（保守位置 = 42）
    setTargetScore(MARKET_LINE);
  };

  // 格式化 NFL 比赛时间
  const formatMatchTime = () => {
    return `Q${matchData.matchTime} ${matchData.timeInQuarter}`;
  };

  const phoneContent = (
    <>
      {/* iPhone 14 容器 - 390x844 */}
      <div 
        className="relative bg-gray-900 rounded-[50px] p-3 shadow-2xl"
        style={{ width: `${PHONE_W}px`, height: `${PHONE_H}px` }}
      >
        {/* 动态岛 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-20" />
        
        {/* 屏幕内容 */}
        <div className="w-full h-full bg-white rounded-[38px] overflow-hidden">
          
          {/* 状态栏 */}
          <div className="h-11 flex items-end justify-between px-8 pb-1">
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
        
          {/* 顶部导航与标题 */}
          <div className="px-5 pt-2 pb-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <button 
                  onClick={onBack}
                  className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-gray-400 text-[10px] tracking-wide ml-0.5">
                  Sports · NFL · AFC Championship
                </p>
              </div>
              {/* LIVE 标签 */}
              {matchData.isLive && (
                <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-red-600">LIVE</span>
                </div>
              )}
            </div>
            
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Flex Prediction
            </h1>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Adjust the target score to customize your risk.
            </p>
          </div>

          {/* 实时比分栏 - NFL 风格 */}
          <div className="mx-5 mt-3 mb-2 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg px-3 py-2 text-white">
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs font-medium text-gray-300">{matchData.homeTeam}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold">{matchData.homeScore}</span>
                <span className="text-gray-500 text-xs">-</span>
                <span className="text-lg font-bold">{matchData.awayScore}</span>
              </div>
              <span className="text-xs font-medium text-gray-300">{matchData.awayTeam}</span>
              <div className="bg-white/10 px-1.5 py-0.5 rounded-full ml-1">
                <span className="text-[10px] font-medium">{formatMatchTime()}</span>
              </div>
            </div>
          </div>

          {/* 核心交互区 */}
          <div className="px-5 pt-2 pb-4">
            
            {/* 方向切换 */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg mb-4">
              <button
                onClick={() => handleDirectionChange('over')}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  direction === 'over' 
                    ? 'bg-white text-[#00C896] shadow-sm ring-1 ring-black/5' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp size={14} />
                Over
              </button>
              <button
                onClick={() => handleDirectionChange('under')}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  direction === 'under' 
                    ? 'bg-white text-amber-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingDown size={14} />
                Under
              </button>
            </div>

            {/* 图表区域 */}
            <div className="relative h-40 w-full [&_*]:outline-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[direction]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[direction]} stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorInactive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="xValue"
                    ticks={direction === 'over' ? [0, 7, 14, 22, 29] : [0, 7, 14, 20, 27]}
                    tick={(props: any) => {
                      const { x, y, payload } = props;
                      const xVal = Number(payload.value);
                      // Over: X轴从小到大 26.5→55.5; Under: X轴从大到小 55.5→28.5
                      const score = direction === 'over' 
                        ? OVER_MIN + xVal 
                        : UNDER_MAX - xVal;
                      const range = direction === 'over' ? OVER_RANGE : UNDER_RANGE;
                      const isFirstOrLast = xVal === 0 || xVal === range;
                      return (
                        <text 
                          x={x} 
                          y={Number(y) + 10} 
                          textAnchor="middle" 
                          fontSize={9} 
                          fill={isFirstOrLast ? '#6b7280' : '#d1d5db'}
                          fontWeight={isFirstOrLast ? 500 : 400}
                        >
                          {score}
                        </text>
                      );
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{fontSize: 9, fill: '#9ca3af'}} 
                    axisLine={false}
                    tickLine={false}
                    domain={[1.4, 'auto']}
                    tickFormatter={(val) => `${val}x`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      
                      const activeItem = payload.find(p => p.dataKey === 'activeMultiplier' && p.value !== null);
                      const inactiveItem = payload.find(p => p.dataKey === 'inactiveMultiplier' && p.value !== null);
                      const multiplier = activeItem?.value ?? inactiveItem?.value;
                      const isActive = !!activeItem;
                      
                      if (!multiplier) return null;
                      
                      const xVal = Number(label);
                      // Over: X轴从小到大; Under: X轴从大到小
                      const score = direction === 'over' 
                        ? OVER_MIN + xVal 
                        : UNDER_MAX - xVal;
                      
                      return (
                        <div className="bg-white px-2 py-1.5 rounded-lg shadow-lg border border-gray-100">
                          <p className="text-xs font-medium text-gray-700">{direction === 'over' ? 'Over' : 'Under'} {score} pts</p>
                          <p className={`text-xs font-semibold ${isActive ? (direction === 'over' ? 'text-[#00C896]' : 'text-amber-600') : 'text-gray-400'}`}>
                            Multiplier: {multiplier}x
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inactiveMultiplier" 
                    stroke="#d1d5db"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorInactive)" 
                    animationDuration={200}
                    connectNulls={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="activeMultiplier" 
                    stroke={COLORS[direction]} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorActive)" 
                    animationDuration={200}
                    connectNulls={false}
                  />
                  <ReferenceDot 
                    x={currentSliderValue} 
                    y={currentMultiplier} 
                    r={4}
                    fill="white"
                    stroke={COLORS[direction]}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              {/* 浮动标签 - 隐含胜率 */}
              <div className={`absolute -top-1 right-6 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-md border border-gray-100/50 text-[10px] font-medium ${direction === 'over' ? 'text-[#00C896]' : 'text-amber-600'} ${multiplierFlicker ? 'opacity-70' : 'opacity-100'} transition-opacity`}>
                 Implied Prob: {calculateImpliedProb(currentMultiplier)}%
              </div>
            </div>

            {/* 滑块控制 */}
            <div className="mt-5 mb-5 relative">
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex justify-between">
                <span>Set Your Target Score</span>
                <span className={`font-semibold ${direction === 'over' ? 'text-[#00C896]' : 'text-amber-600'}`}>
                  {direction === 'over' ? 'Over' : 'Under'} {targetScore} pts
                </span>
              </label>
              <style>
                {`
                  .slider-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 28px;
                    height: 18px;
                    border-radius: 9px;
                    cursor: grab;
                    border: none;
                    position: relative;
                    /* 多层渐变 - 精致陶瓷/金属质感 */
                    background: 
                      /* 中间凹槽装饰线 - 更细腻 */
                      linear-gradient(to bottom, 
                        transparent 6px, 
                        rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.06) 7px, 
                        transparent 7px,
                        transparent 10px, 
                        rgba(0,0,0,0.06) 10px, rgba(0,0,0,0.06) 11px, 
                        transparent 11px
                      ),
                      /* 主体渐变 - 高级陶瓷白 */
                      linear-gradient(to bottom, 
                        #ffffff 0%, 
                        #fafafa 20%,
                        #f5f5f5 50%, 
                        #ebebeb 80%,
                        #e0e0e0 100%
                      );
                    box-shadow: 
                      /* 外部投影 - 柔和立体 */
                      0 2px 8px rgba(0, 0, 0, 0.12),
                      0 1px 3px rgba(0, 0, 0, 0.08),
                      /* 顶部高光边 */
                      inset 0 1px 0 rgba(255, 255, 255, 1),
                      /* 底部暗边 */
                      inset 0 -1px 0 rgba(0, 0, 0, 0.04),
                      /* 侧边微光 */
                      inset 1px 0 0 rgba(255, 255, 255, 0.8),
                      inset -1px 0 0 rgba(0, 0, 0, 0.02);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                  }
                  .slider-thumb::-webkit-slider-thumb:hover {
                    cursor: grab;
                    transform: scale(1.05);
                    box-shadow: 
                      0 4px 12px rgba(0, 0, 0, 0.15),
                      0 2px 4px rgba(0, 0, 0, 0.1),
                      0 0 10px 2px ${direction === 'over' ? 'rgba(0, 200, 150, 0.2)' : 'rgba(245, 158, 11, 0.2)'},
                      inset 0 1px 0 rgba(255, 255, 255, 1),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.04),
                      inset 1px 0 0 rgba(255, 255, 255, 0.8),
                      inset -1px 0 0 rgba(0, 0, 0, 0.02);
                  }
                  .slider-thumb::-webkit-slider-thumb:active {
                    cursor: grabbing;
                    transform: scale(0.98);
                    box-shadow: 
                      0 1px 4px rgba(0, 0, 0, 0.1),
                      0 1px 2px rgba(0, 0, 0, 0.06),
                      0 0 16px 4px ${direction === 'over' ? 'rgba(0, 200, 150, 0.25)' : 'rgba(245, 158, 11, 0.25)'},
                      inset 0 1px 0 rgba(255, 255, 255, 0.9),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.06);
                  }
                  .slider-thumb::-moz-range-thumb {
                    width: 28px;
                    height: 18px;
                    border-radius: 9px;
                    cursor: grab;
                    border: none;
                    background: 
                      linear-gradient(to bottom, 
                        transparent 6px, 
                        rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.06) 7px, 
                        transparent 7px,
                        transparent 10px, 
                        rgba(0,0,0,0.06) 10px, rgba(0,0,0,0.06) 11px, 
                        transparent 11px
                      ),
                      linear-gradient(to bottom, 
                        #ffffff 0%, 
                        #fafafa 20%,
                        #f5f5f5 50%, 
                        #ebebeb 80%,
                        #e0e0e0 100%
                      );
                    box-shadow: 
                      0 2px 8px rgba(0, 0, 0, 0.12),
                      0 1px 3px rgba(0, 0, 0, 0.08),
                      inset 0 1px 0 rgba(255, 255, 255, 1),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.04),
                      inset 1px 0 0 rgba(255, 255, 255, 0.8),
                      inset -1px 0 0 rgba(0, 0, 0, 0.02);
                  }
                `}
              </style>
              <input
                type="range"
                min={0}
                max={currentRange}
                value={currentSliderValue}
                onChange={(e) => {
                  const sliderVal = parseInt(e.target.value);
                  if (direction === 'over') {
                    // Over: 滑块从左到右，score从26.5到55.5
                    setTargetScore(OVER_MIN + sliderVal);
                  } else {
                    // Under: 滑块从左到右，score从55.5到28.5
                    setTargetScore(UNDER_MAX - sliderVal);
                  }
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, ${COLORS[direction]} 0%, ${COLORS[direction]} ${sliderPercent}%, #e5e7eb ${sliderPercent}%, #e5e7eb 100%)`,
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              />
              <div className="mt-1 flex justify-between text-[10px] text-gray-500 px-0.5">
                {/* 两种模式下滑块右移都代表风险增加 */}
                <span>Low Risk</span>
                <span>High Risk</span>
              </div>
            </div>

            {/* 核心数据展示面板 */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
              <div className="flex justify-between items-center mb-2.5">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">
                    Current Multiplier
                  </p>
                  <span className={`text-xl font-bold transition-all ${direction === 'over' ? 'text-[#00C896]' : 'text-amber-600'} ${multiplierFlicker ? 'opacity-60' : 'opacity-100'}`}>
                    {currentMultiplier.toFixed(2)}x
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Est. Payout</p>
                  <span className="text-xl font-bold text-gray-900">${potentialReturn}</span>
                </div>
              </div>
              
              {/* 金额输入 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <DollarSign size={14} className={isAmountInvalid ? 'text-red-400' : 'text-gray-400'} />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  className={`block w-full pl-7 pr-11 py-2 border rounded-lg focus:ring-2 text-gray-900 text-sm font-medium bg-white shadow-sm transition-colors outline-none ${
                    isAmountInvalid 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : direction === 'over' 
                        ? 'border-gray-200 focus:ring-[#00C896] focus:border-[#00C896]' 
                        : 'border-gray-200 focus:ring-amber-500 focus:border-amber-500'
                  }`}
                  placeholder="10"
                />
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <span className={`text-xs font-medium ${isAmountInvalid ? 'text-red-400' : 'text-gray-400'}`}>USDC</span>
                </div>
              </div>
              <div className="h-4 mt-0.5">
                {isAmountInvalid && (
                  <p className="text-[10px] text-red-500 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {isAmountTooLow && `Minimum amount is $${MIN_AMOUNT}`}
                    {isAmountTooHigh && `Maximum amount is $${MAX_AMOUNT.toLocaleString()}`}
                  </p>
                )}
              </div>
            </div>

            {/* 底部按钮 */}
            <button 
              disabled={isAmountInvalid}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                isAmountInvalid 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : direction === 'over' 
                    ? 'bg-[#00C896] hover:bg-[#00B085] shadow-md shadow-[#00C896]/20 active:scale-[0.98]' 
                    : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 active:scale-[0.98]'
              }`}
            >
              <span>{direction === 'over' ? 'Buy Over' : 'Buy Under'}</span>
              <ArrowRight size={16} />
            </button>

            {/* 风险提示 */}
            <div className="mt-2 flex items-start gap-1.5 text-[10px] text-gray-400 leading-relaxed">
              <Info size={12} className="flex-shrink-0 mt-0.5" />
              <p>
                Prediction markets involve risk. Multipliers adjust dynamically.
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );

  if (embed) {
    return (
      <div
        ref={wrapperRef}
        className="w-screen h-screen flex items-center justify-center overflow-hidden font-sans text-gray-800 select-none"
        style={{ background: 'transparent' }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          {phoneContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4 font-sans text-gray-800 select-none">
      {phoneContent}
    </div>
  );
};

export default RiskRewardInterface;
