import { motion } from 'motion/react';
import { Lock, Check, Sparkles, Coins, Paintbrush } from 'lucide-react';
import { Wallpaper, UserStats } from '../types';
import { WALLPAPERS } from '../data/wallpapers';

interface WallpaperStoreProps {
  stats: UserStats;
  onUnlockWallpaper: (id: string, cost: number) => void;
  onSelectWallpaper: (id: string) => void;
}

export default function WallpaperStore({
  stats,
  onUnlockWallpaper,
  onSelectWallpaper
}: WallpaperStoreProps) {
  return (
    <div id="wallpaper-rewards-shop" className="bg-[#f5f2e8] border border-[#e2dec9] rounded-[2rem] p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e2dec9] mb-6">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#5a5a40] flex items-center space-x-2">
            <Paintbrush className="text-[#c2a44d]" size={20} />
            <span>Spiritual Theme Shop</span>
          </h2>
          <p className="text-xs text-[#8a8a6d] mt-1 font-sans">
            Accumulate discipline reward points to unlock beautiful premium landscape backgrounds and holy geometry canvases.
          </p>
        </div>
        
        <div className="bg-[#efede0] px-4 py-2 border border-[#d6d2b5] rounded-full flex items-center gap-2 self-start sm:self-center shadow-xs">
          <Coins className="text-[#c2a44d]" size={15} />
          <span className="text-sm font-sans font-bold text-[#5a5a40] tracking-wider uppercase">
            {stats.points} PTS AVAILABLE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {WALLPAPERS.map((wp) => {
          const isUnlocked = stats.unlockedWallpapers.includes(wp.id);
          const isActive = stats.activeWallpaperId === wp.id || (!stats.activeWallpaperId && wp.id === 'default');
          const canAfford = stats.points >= wp.cost;

          return (
            <motion.div
              key={wp.id}
              whileHover={{ y: -3 }}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 ${
                isActive 
                  ? 'border-[#5a5a40] shadow-sm bg-[#5a5a40]/2' 
                  : isUnlocked 
                    ? 'border-[#e2dec9] hover:border-[#8a8a6d]/40' 
                    : 'border-[#e2dec9] opacity-90'
              }`}
            >
              {/* Wallpaper image preview */}
              <div className="relative aspect-[9/16] w-full max-h-[170px] sm:max-h-[200px] rounded-xl overflow-hidden bg-[#fdfbf7] border border-[#e2dec9]">
                <img
                  src={wp.imageSrc}
                  alt={wp.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition duration-300 hover:scale-105"
                />

                {/* If locked, overlay lock badge */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-1">
                    <div className="p-2.5 bg-[#fdfbf7] rounded-full border border-[#e2dec9] text-[#5a5a40] shadow-sm">
                      <Lock size={15} />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-sans text-white font-black bg-[#5a5a40] px-2 py-0.5 rounded shadow">
                      {wp.cost} Points
                    </span>
                  </div>
                )}

                {/* Active selection tag */}
                {isActive && (
                  <div className="absolute top-2 right-2 bg-[#5a5a40] text-[#fdfbf7] text-[10px] font-sans font-black tracking-widest px-2.5 py-1 rounded-full shadow flex items-center space-x-1">
                    <Check size={10} strokeWidth={4} />
                    <span>ACTIVE</span>
                  </div>
                )}
              </div>

              {/* Wallpaper Details info */}
              <div className="mt-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#5a5a40] flex items-center justify-between">
                    <span className="font-serif">{wp.name}</span>
                    {wp.cost > 0 && !isUnlocked && (
                      <span className="text-[10px] text-[#5a5a40] font-sans font-bold bg-[#efede0] px-2 py-0.5 rounded-md border border-[#d6d2b5]">
                        {wp.cost} pts
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-[#8a8a6d] mt-1.5 leading-relaxed">
                    {wp.description}
                  </p>
                </div>

                {/* Unlock / Set background CTA button */}
                <div className="mt-4">
                  {isUnlocked ? (
                    <button
                      onClick={() => onSelectWallpaper(wp.id)}
                      disabled={isActive}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold font-sans tracking-wider uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                        isActive
                          ? 'bg-[#efede0] text-[#8a8a6d] border border-[#d6d2b5] cursor-default'
                          : 'bg-transparent border border-[#5a5a40] text-[#5a5a40] hover:bg-[#5a5a40] hover:text-white'
                      }`}
                    >
                      <Sparkles size={12} />
                      <span>{isActive ? 'Theme Applied' : 'Activate Theme'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnlockWallpaper(wp.id, wp.cost)}
                      disabled={!canAfford}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold font-sans tracking-wide transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        canAfford
                          ? 'bg-[#5a5a40] text-white hover:opacity-90 shadow-xs'
                          : 'bg-[#efede0] text-[#8a8a6d]/60 border border-[#e2dec9] cursor-not-allowed'
                      }`}
                    >
                      <Lock size={12} />
                      <span>Unlock Wallpaper ({wp.cost} pt)</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
