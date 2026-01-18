import React, { useState } from 'react';
import { 
  User, 
  FolderOpen, 
  BarChart2, 
  Sparkles,
  Calendar as CalendarIcon
} from 'lucide-react';
import { NavItem } from '../types';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  const mainMenuItems = [
    { id: NavItem.Classroom, icon: Sparkles, label: 'Classroom' },
    { id: NavItem.Courses, icon: FolderOpen, label: 'Courses' },
    { id: NavItem.Calendar, icon: CalendarIcon, label: 'Schedule' },
    { id: NavItem.Insights, icon: BarChart2, label: 'Insights' },
  ];

  const profileItem = { id: NavItem.Profile, icon: User, label: 'Profile' };

  const renderNavItem = (item: typeof profileItem, isProfile = false) => {
    const isActive = activeItem === item.id;
    return (
        <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex items-center font-medium transition-all duration-200 group relative
                /* Mobile Styles */
                flex-col justify-center rounded-xl p-1 text-[10px] gap-1
                /* Desktop Styles */
                md:flex-row md:text-sm md:w-full md:h-12
                
                ${isActive 
                  ? 'text-primary md:bg-gray-50 md:text-primary' 
                  : 'text-secondaryText hover:bg-gray-50 hover:text-primary'
                }
                
                ${isHovered 
                    ? 'md:px-6 md:justify-start md:gap-3' 
                    : 'md:justify-center md:px-0 lg:justify-start lg:px-6 lg:gap-3'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
        >
              {/* Icon Container */}
              <div className={`flex items-center justify-center shrink-0 md:w-10 md:h-10 rounded-xl transition-colors`}>
                 <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary transition-colors'} md:w-5 md:h-5`}
                  />
              </div>
              
              <span className="md:hidden font-semibold">{item.label}</span>

              <span className={`hidden md:block overflow-hidden whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'} lg:opacity-100 lg:w-auto`}>
                {item.label}
              </span>
              
              {isActive && (
                <div className={`hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-l-full
                  ${!isHovered ? 'lg:block' : ''}
                `}></div>
              )}
        </button>
    );
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed z-50 shadow-sm bg-surface border-gray-100 transition-all duration-300 ease-in-out
        /* Mobile: Bottom Nav */
        bottom-0 left-0 w-full h-16 border-t flex flex-row items-center justify-between px-6
        /* Desktop: Left Sidebar */
        md:top-0 md:h-screen md:border-r md:flex-col md:justify-start md:px-0 md:bottom-auto
        
        /* Width Logic: Collapsed on tablet (md), Expanded on laptop (lg) */
        md:w-20 
        lg:w-64
        ${isHovered ? 'md:w-64 md:shadow-2xl' : ''}
      `}
      role="navigation"
      aria-label="Main Navigation"
    >
      {/* Header / Logo Area */}
      <div className={`
        hidden md:flex items-center gap-3 transition-all duration-300 h-24
        ${!isHovered ? 'justify-center px-0 lg:justify-start lg:px-6' : 'px-6'}
      `}>
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-accent shadow-lg shadow-black/10 shrink-0">
          <Sparkles size={20} fill="currentColor" />
        </div>
        
        <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'} lg:opacity-100 lg:w-auto`}>
          <span className="font-bold text-base text-primary tracking-tight">AI Teacher</span>
          <span className="text-xs text-secondaryText font-medium">Assistant</span>
        </div>
      </div>

      <div className={`hidden md:block h-[1px] bg-gray-100 mb-6 mx-auto transition-all duration-300 ${isHovered ? 'w-[85%]' : 'w-[50%]'} lg:w-[85%]`} />

      {/* Navigation Items */}
      <nav className="flex-1 w-full flex flex-row md:flex-col justify-around md:justify-start md:space-y-2 md:pb-6">
        
        {/* Main Items */}
        <div className="contents md:flex md:flex-col md:gap-2">
            {mainMenuItems.map((item) => renderNavItem(item))}
        </div>

        {/* Spacer for Desktop */}
        <div className="hidden md:block md:flex-1"></div>
        
        {/* Divider for Profile */}
        <div className={`hidden md:block mx-auto h-[1px] bg-gray-100 mb-2 transition-all duration-300 ${isHovered ? 'w-[85%]' : 'w-[50%]'} lg:w-[85%]`} />

        {/* Profile Item (Bottom on Desktop, Right on Mobile) */}
        {renderNavItem(profileItem, true)}

      </nav>
    </div>
  );
};

export default Sidebar;