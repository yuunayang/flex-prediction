import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart, ReferenceDot } from 'recharts';

/**
 * RiskRewardDemo - 用于 Framer 作品集的自动播放演示动效
 * 展示滑块拖动效果，曲线和数字随之变化
 * 用户不可交互，纯展示用途
 */
const RiskRewardDemo: React.FC = () => {
  // ==================== 配置常量 ====================
  const OVER_MIN = 26.5;
  const OVER_MAX = 55.5;
  const OVER_RANGE = OVER_MAX - OVER_MIN; // 29

  const COLORS = {
    over: '#00C896',
    under: '#f59e0b',
  };

  // ==================== 状态管理 ====================
  const direction = 'over'; // 固定为 Over 模式展示
  const [targetScore, setTargetScore] = useState(34.5);
  
  // 使用 useRef 存储动画方向，避免重新创建 interval 导致的跳动
  const animationPhaseRef = useRef<'forward' | 'backward'>('forward');

  // ==================== 自动动画逻辑 ====================
  useEffect(() => {
    // 动画参数
    const minScore = OVER_MIN + 8;   // 起始点 ~34.5
    const maxScore = OVER_MIN + 22;  // 终点 ~48.5
    const stepSize = 0.3;            // 更小的步长，更平滑
    const intervalMs = 80;           // 更长的间隔，速度更慢

    const animationInterval = setInterval(() => {
      setTargetScore(prev => {
        if (animationPhaseRef.current === 'forward') {
          const next = prev + stepSize;
          if (next >= maxScore) {
            animationPhaseRef.current = 'backward';
            return maxScore;
          }
          return next;
        } else {
          const next = prev - stepSize;
          if (next <= minScore) {
            animationPhaseRef.current = 'forward';
            return minScore;
          }
          return next;
        }
      });
    }, intervalMs);

    return () => clearInterval(animationInterval);
  }, []); // 空依赖数组，只创建一次 interval

  // ==================== 计算逻辑 ====================
  const OVER_DATA_POINTS = useMemo(() => [
    { score: 26.5, multiplier: 1.05 },
    { score: 32.5, multiplier: 1.25 },
    { score: 38.5, multiplier: 1.67 },
    { score: 45.5, multiplier: 2.85 },
    { score: 55.5, multiplier: 8.00 },
  ], []);

  const interpolate = useCallback((score: number) => {
    if (score <= OVER_DATA_POINTS[0].score) return OVER_DATA_POINTS[0].multiplier;
    if (score >= OVER_DATA_POINTS[OVER_DATA_POINTS.length - 1].score) return OVER_DATA_POINTS[OVER_DATA_POINTS.length - 1].multiplier;
    
    for (let i = 0; i < OVER_DATA_POINTS.length - 1; i++) {
      if (score >= OVER_DATA_POINTS[i].score && score <= OVER_DATA_POINTS[i + 1].score) {
        const t = (score - OVER_DATA_POINTS[i].score) / (OVER_DATA_POINTS[i + 1].score - OVER_DATA_POINTS[i].score);
        return OVER_DATA_POINTS[i].multiplier + t * (OVER_DATA_POINTS[i + 1].multiplier - OVER_DATA_POINTS[i].multiplier);
      }
    }
    return OVER_DATA_POINTS[0].multiplier;
  }, [OVER_DATA_POINTS]);

  const calculateMultiplier = useCallback((score: number) => {
    const baseMultiplier = interpolate(score);
    return parseFloat(Math.max(1.05, baseMultiplier).toFixed(2));
  }, [interpolate]);

  const calculateImpliedProb = useCallback((multiplier: number) => {
    return Math.round((1 / multiplier) * 100);
  }, []);

  const getCurrentSliderValue = useCallback((target: number) => {
    return target - OVER_MIN;
  }, []);

  // 生成完整的图表基础数据（只生成一次）
  const fullChartData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= OVER_RANGE; i += 0.5) {
      const score = OVER_MIN + i;
      const multiplier = calculateMultiplier(score);
      data.push({
        xValue: i,
        score,
        multiplier,
      });
    }
    return data;
  }, [calculateMultiplier, OVER_RANGE]);

  // 根据当前滑块位置计算 active/inactive 区域
  const chartData = useMemo(() => {
    const currentSliderVal = getCurrentSliderValue(targetScore);
    return fullChartData.map(point => ({
      ...point,
      activeMultiplier: point.xValue <= currentSliderVal ? point.multiplier : null,
      inactiveMultiplier: point.xValue >= currentSliderVal ? point.multiplier : null,
    }));
  }, [fullChartData, targetScore, getCurrentSliderValue]);

  const currentMultiplier = calculateMultiplier(targetScore);
  const currentSliderValue = getCurrentSliderValue(targetScore);
  const sliderPercent = (currentSliderValue / OVER_RANGE) * 100;

  return (
    <div className="font-sans text-gray-800 select-none w-full max-w-[340px]">
      {/* Over/Under 切换 - 纯展示 */}
      <div className="flex bg-gray-100 p-0.5 rounded-lg mb-4">
        <div className="flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 bg-white text-[#00C896] shadow-sm ring-1 ring-black/5">
          <TrendingUp size={14} />
          Over
        </div>
        <div className="flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 text-gray-500">
          <TrendingDown size={14} />
          Under
        </div>
      </div>

      {/* 图表区域 */}
      <div className="relative h-40 w-full [&_*]:outline-none pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="demoColorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[direction]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS[direction]} stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="demoColorInactive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="xValue"
              type="number"
              domain={[0, OVER_RANGE]}
              ticks={[0, 7, 14, 22, 29]}
              tick={(props: any) => {
                const { x, y, payload } = props;
                const xVal = Number(payload.value);
                const score = OVER_MIN + xVal;
                const isFirstOrLast = xVal === 0 || xVal === OVER_RANGE;
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
              domain={[1, 9]}
              tickFormatter={(val) => `${val}x`}
            />
            <Area 
              type="monotone" 
              dataKey="inactiveMultiplier" 
              stroke="#d1d5db"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1} 
              fill="url(#demoColorInactive)" 
              isAnimationActive={false}
              connectNulls={false}
              activeDot={false}
              dot={false}
            />
            <Area 
              type="monotone" 
              dataKey="activeMultiplier" 
              stroke={COLORS[direction]} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#demoColorActive)" 
              isAnimationActive={false}
              connectNulls={false}
              activeDot={false}
              dot={false}
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
        <div className="absolute -top-1 right-6 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-md border border-gray-100/50 text-[10px] font-medium text-[#00C896]">
           Implied Prob: {calculateImpliedProb(currentMultiplier)}%
        </div>
      </div>

      {/* 滑块控制区 - 带手指动画 */}
      <div className="mt-5 mb-3 relative">
        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex justify-between">
          <span>Set Your Target Score</span>
          <span className="font-semibold text-[#00C896]">
            Over {targetScore.toFixed(1)} pts
          </span>
        </label>
        
        {/* 滑块轨道 */}
        <div className="relative h-2">
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(to right, ${COLORS[direction]} 0%, ${COLORS[direction]} ${sliderPercent}%, #e5e7eb ${sliderPercent}%, #e5e7eb 100%)`,
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          />
          
          {/* 滑块 Thumb */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-7 h-[18px] rounded-[9px]"
            style={{
              left: `calc(${sliderPercent}% - 14px)`,
              background: `
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
                )
              `,
              boxShadow: `
                0 2px 8px rgba(0, 0, 0, 0.12),
                0 1px 3px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.04),
                inset 1px 0 0 rgba(255, 255, 255, 0.8),
                inset -1px 0 0 rgba(0, 0, 0, 0.02)
              `
            }}
          />
          
          {/* 手指图标 - 跟随滑块 */}
          <div 
            className="absolute pointer-events-none"
            style={{
              left: `calc(${sliderPercent}% - 10px)`,
              top: '16px',
            }}
          >
            {/* 手指 SVG */}
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none"
              className="drop-shadow-lg"
              style={{
                transform: 'rotate(-20deg)',
              }}
            >
              {/* 手指主体 */}
              <path 
                d="M12 2C10.9 2 10 2.9 10 4V12.5L7.4 10.8C6.6 10.3 5.6 10.5 5 11.2C4.5 11.9 4.6 12.9 5.3 13.5L10.3 18C11 18.7 12 19 13 19H16C18.2 19 20 17.2 20 15V9C20 7.9 19.1 7 18 7C17.5 7 17 7.2 16.7 7.5C16.4 6.6 15.5 6 14.5 6C14 6 13.5 6.2 13.2 6.5C12.9 5.6 12 5 11 5C10.7 5 10.3 5.1 10 5.2V4C10 2.9 10.9 2 12 2Z" 
                fill="#FFDBB4"
                stroke="#E8C4A0"
                strokeWidth="0.5"
              />
              {/* 手指细节线条 */}
              <path 
                d="M13 9V13M16 9V13" 
                stroke="#E8C4A0" 
                strokeWidth="0.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between text-[10px] text-gray-500 px-0.5">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
      </div>
    </div>
  );
};

export default RiskRewardDemo;
