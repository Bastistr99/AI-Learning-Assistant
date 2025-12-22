import React from 'react';
import { 
  User, 
  Users, 
  FolderOpen, 
  BarChart2, 
  Sparkles 
} from 'lucide-react';
import { NavItem } from '../types';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate }) => {
  const menuItems = [
    { id: NavItem.Profile, icon: User, label: 'Profile' },
    { id: NavItem.Classroom, icon: Sparkles, label: 'Classroom' }, // Using Sparkles as it's the "Action" tab
    { id: NavItem.Lectures, icon: FolderOpen, label: 'Lectures' },
    { id: NavItem.Insights, icon: BarChart2, label: 'Insights' },
  ];

  return (
    <div className="w-64 h-screen bg-surface border-r border-gray-100 flex flex-col fixed left-0 top-0 z-20 shadow-sm">
      {/* Header / Logo Area */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-accent shadow-lg shadow-black/10">
          <Sparkles size={20} fill="currentColor" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base text-primary tracking-tight">AI Teacher</span>
          <span className="text-xs text-secondaryText font-medium">Assistant</span>
        </div>
      </div>

      <div className="w-full h-[1px] bg-gray-100 mb-6 mx-auto w-[85%]" />

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-secondaryText hover:bg-gray-50 hover:text-primary'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? 'text-accent' : 'text-gray-400 group-hover:text-primary transition-colors'}
              />
              <span>{item.label}</span>
              
              {/* Active Indicator (Glowing Dot) */}
              {isActive && (
                <div className="absolute right-4 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(204,255,0,0.8)]"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Info placeholder */}
      <div className="p-4 mt-auto mb-4">
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
             JD
           </div>
           <div className="flex flex-col">
             <span className="text-xs font-bold text-primary">John Doe</span>
             <span className="text-[10px] text-secondaryText">Professor</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;