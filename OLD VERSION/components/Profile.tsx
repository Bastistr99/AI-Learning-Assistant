import React from 'react';
import { User, Mail, Shield, Bell, LogOut } from 'lucide-react';

const Profile: React.FC = () => {
  return (
    <div className="p-10 w-full max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-primary mb-8">My Profile</h1>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500 border-4 border-white shadow-lg">
                JD
            </div>
            <div>
                <h2 className="text-2xl font-bold text-primary">John Doe</h2>
                <p className="text-secondaryText">Professor of Computer Science</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-accent/20 text-primary text-xs font-bold border border-accent/30">
                    Pro Plan
                </span>
            </div>
        </div>

        <div className="space-y-1">
            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                    <User size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm text-primary">Personal Information</h4>
                    <p className="text-xs text-secondaryText">Edit your details and bio</p>
                </div>
                <div className="text-secondaryText text-sm">Edit</div>
            </div>

            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Mail size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm text-primary">Email Notifications</h4>
                    <p className="text-xs text-secondaryText">Manage your email preferences</p>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Shield size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm text-primary">Security & Login</h4>
                    <p className="text-xs text-secondaryText">Change password and 2FA</p>
                </div>
            </div>
            
             <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Bell size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm text-primary">App Settings</h4>
                    <p className="text-xs text-secondaryText">Display and sound settings</p>
                </div>
            </div>
        </div>
      </div>

      <button className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
          <LogOut size={20} />
          Sign Out
      </button>
    </div>
  );
};

export default Profile;