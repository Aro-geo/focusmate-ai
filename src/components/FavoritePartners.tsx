import React, { useState } from 'react';
import { Star, Users, Clock, MessageCircle, Settings } from 'lucide-react';

interface FocusPartner {
  id: string;
  name: string;
  avatar: string;
  timezone: string;
  focusScore: number; // 1-100
  sessionCount: number;
  preferredModes: ('work' | 'moving' | 'anything')[];
  isOnline: boolean;
  isFavorite: boolean;
  lastSeen?: Date;
}

interface FavoritePartnersProps {
  onRequestSession?: (partnerId: string) => void;
}

const FavoritePartners: React.FC<FavoritePartnersProps> = ({ onRequestSession }) => {
  const [partners, setPartners] = useState<FocusPartner[]>([
    {
      id: '1',
      name: 'Sarah M.',
      avatar: '👩‍💻',
      timezone: 'EST',
      focusScore: 92,
      sessionCount: 47,
      preferredModes: ['work', 'anything'],
      isOnline: true,
      isFavorite: true
    },
    {
      id: '2',
      name: 'David K.',
      avatar: '👨‍💼',
      timezone: 'PST',
      focusScore: 88,
      sessionCount: 23,
      preferredModes: ['work'],
      isOnline: false,
      isFavorite: true,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: '3',
      name: 'Maria L.',
      avatar: '👩‍🎨',
      timezone: 'CET',
      focusScore: 95,
      sessionCount: 71,
      preferredModes: ['work', 'moving', 'anything'],
      isOnline: true,
      isFavorite: true
    },
    {
      id: '4',
      name: 'Alex Chen',
      avatar: '👨‍🔬',
      timezone: 'JST',
      focusScore: 84,
      sessionCount: 15,
      preferredModes: ['work'],
      isOnline: false,
      isFavorite: false,
      lastSeen: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    }
  ]);

  const [showAllPartners, setShowAllPartners] = useState(false);

  const toggleFavorite = (partnerId: string) => {
    setPartners(prev => prev.map(partner => 
      partner.id === partnerId 
        ? { ...partner, isFavorite: !partner.isFavorite }
        : partner
    ));
  };

  const formatLastSeen = (lastSeen?: Date) => {
    if (!lastSeen) return 'Recently';
    const hours = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const getFocusScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const favoritePartners = partners.filter(p => p.isFavorite);
  const displayPartners = showAllPartners ? partners : favoritePartners;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          {showAllPartners ? 'All Focus Partners' : 'Favorite Partners'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAllPartners(!showAllPartners)}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full transition-colors"
          >
            {showAllPartners ? 'Show Favorites' : 'Show All'}
          </button>
          <button 
            className="text-gray-400 hover:text-gray-600"
            title="Partner settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {displayPartners.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No {showAllPartners ? '' : 'favorite '}partners yet</p>
          <p className="text-sm">Complete sessions to find compatible focus partners</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayPartners.map((partner) => (
            <div
              key={partner.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="text-3xl">{partner.avatar}</div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      partner.isOnline ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800">{partner.name}</h4>
                      <button
                        onClick={() => toggleFavorite(partner.id)}
                        className={`transition-colors ${
                          partner.isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      >
                        <Star className="w-4 h-4" fill={partner.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{partner.timezone}</span>
                      <span>•</span>
                      <span>{partner.sessionCount} sessions</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getFocusScoreColor(partner.focusScore)}`}>
                        {partner.focusScore}% focus
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {partner.preferredModes.map((mode) => (
                        <span
                          key={mode}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                        >
                          {mode === 'work' ? '💻' : mode === 'moving' ? '🚶' : '✨'} {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-right text-xs text-gray-500">
                    {partner.isOnline ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Online now
                      </span>
                    ) : (
                      formatLastSeen(partner.lastSeen)
                    )}
                  </div>
                  
                  {partner.isOnline && onRequestSession && (
                    <button
                      onClick={() => onRequestSession(partner.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Request Session
                    </button>
                  )}
                </div>
              </div>

              {/* Compatibility indicator */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Compatibility</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < Math.floor(partner.focusScore / 20) ? 'bg-blue-400' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-gray-500">{Math.floor(partner.focusScore / 20)}/5</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-600">{favoritePartners.length}</div>
            <div className="text-xs text-gray-600">Favorites</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {partners.filter(p => p.isOnline).length}
            </div>
            <div className="text-xs text-gray-600">Online</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-600">
              {Math.round(partners.reduce((acc, p) => acc + p.focusScore, 0) / partners.length)}%
            </div>
            <div className="text-xs text-gray-600">Avg Focus</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoritePartners;
