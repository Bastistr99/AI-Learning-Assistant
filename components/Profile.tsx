import React, { useState } from 'react';
import { User, Mail, Shield, Bot, Lock, Check, X, ChevronRight, LogOut, Eye, ZapOff, Moon, Server, Cloud } from 'lucide-react';
import { UserProfile, AppSettings } from '../types';

interface ProfileProps {
  user: UserProfile;
  settings: AppSettings;
  onUpdateUser: (user: UserProfile) => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, settings, onUpdateUser, onUpdateSettings }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(user);
  const [showToast, setShowToast] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(editForm);
    setShowEditModal(false);
    triggerToast('Profile updated successfully');
  };

  const toggleAi = () => {
    const newVal = !settings.aiEnabled;
    onUpdateSettings({ ...settings, aiEnabled: newVal });
    triggerToast(newVal ? 'AI features enabled' : 'AI features disabled');
  };

  const toggleEmail = () => {
    const newVal = !settings.emailNotifications;
    onUpdateSettings({ ...settings, emailNotifications: newVal });
  };

  const updateAccessibility = (key: keyof typeof settings.accessibility) => {
      const newAccess = { ...settings.accessibility, [key]: !settings.accessibility[key] };
      onUpdateSettings({ ...settings, accessibility: newAccess });
      triggerToast(`${(key as string).replace(/([A-Z])/g, ' $1').trim()} ${newAccess[key] ? 'Enabled' : 'Disabled'}`);
  }

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleSecurityAction = () => {
      triggerToast('Password reset link sent to email');
  };

  return (
    <div className="p-4 md:p-10 w-full max-w-6xl animate-fade-in relative pb-24 md:pb-10">
      {/* Toast Notification */}
      {showToast && (
          <div className="fixed top-8 right-8 bg-primary text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-fade-in-up">
              <Check size={18} className="text-accent" />
              <span className="font-medium text-sm capitalize">{showToast}</span>
          </div>
      )}

      <h1 className="text-3xl font-bold text-primary mb-8">Settings & Privacy</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: User Card */}
          <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-8 text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500 border-4 border-white shadow-lg mb-4">
                      {user.avatar}
                  </div>
                  <h2 className="text-xl font-bold text-primary">{user.name}</h2>
                  <p className="text-sm text-secondaryText mb-4">{user.role}</p>
                  <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-primary text-xs font-bold border border-accent/30 mb-6">
                      Pro Plan
                  </span>
                  
                  <button 
                    onClick={() => {
                        setEditForm(user);
                        setShowEditModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-primary hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-accent"
                    aria-label="Edit Profile Information"
                  >
                      Edit Profile
                  </button>
              </div>
          </div>

          {/* RIGHT COLUMN: Settings */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* ACCESSIBILITY SECTION */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                      <Eye size={20} className="text-primary"/>
                      Accessibility
                  </h3>
                  
                  <div className="space-y-6">
                      {/* Color Blind Mode */}
                      <div className="flex items-center justify-between">
                          <div>
                              <h4 className="font-bold text-sm text-primary">Color Blind Mode</h4>
                              <p className="text-xs text-secondaryText">Use high-contrast patterns and distinct colors for charts (Blue/Orange).</p>
                          </div>
                          <button 
                            onClick={() => updateAccessibility('colorBlindMode')}
                            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-primary ${settings.accessibility.colorBlindMode ? 'bg-primary' : 'bg-gray-200'}`}
                            aria-label={`Toggle Color Blind Mode ${settings.accessibility.colorBlindMode ? 'Off' : 'On'}`}
                          >
                              <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 transform ${settings.accessibility.colorBlindMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </button>
                      </div>

                      {/* Reduced Motion */}
                      <div className="flex items-center justify-between">
                          <div>
                              <h4 className="font-bold text-sm text-primary">Reduced Motion</h4>
                              <p className="text-xs text-secondaryText">Minimize animations and transitions.</p>
                          </div>
                          <button 
                            onClick={() => updateAccessibility('reducedMotion')}
                            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-primary ${settings.accessibility.reducedMotion ? 'bg-primary' : 'bg-gray-200'}`}
                            aria-label={`Toggle Reduced Motion ${settings.accessibility.reducedMotion ? 'Off' : 'On'}`}
                          >
                              <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 transform ${settings.accessibility.reducedMotion ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </button>
                      </div>
                  </div>
              </div>

              {/* AI & PRIVACY SECTION */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                      <Bot size={120} />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-2 bg-primary text-white rounded-lg">
                          <Bot size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-primary">AI Usage & Privacy</h3>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5 mb-6 text-sm text-secondaryText leading-relaxed border border-gray-100 space-y-4">
                      <div className="flex items-start gap-3">
                          <Bot size={18} className="text-primary mt-0.5 shrink-0" />
                          <div>
                              <span className="font-bold text-primary block text-xs uppercase tracking-wide mb-1">Model Architecture</span>
                              <p>Powered by Google's <strong>Gemini 3 Flash</strong>. This multimodal model processes video frames to interpret engagement and confusion levels.</p>
                          </div>
                      </div>

                      <div className="flex items-start gap-3">
                          <Cloud size={18} className="text-primary mt-0.5 shrink-0" />
                          <div>
                              <span className="font-bold text-primary block text-xs uppercase tracking-wide mb-1">Data Processing Location</span>
                              <p>Data is transmitted securely to <strong>Google Cloud</strong> servers for real-time inference.</p>
                          </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                          <Shield size={18} className="text-blue-600 mt-0.5 shrink-0" />
                          <div>
                              <span className="font-bold text-blue-800 block text-xs uppercase tracking-wide mb-1">Data Retention & Privacy</span>
                              <p className="text-xs text-blue-900 leading-relaxed">
                                  While this application does not save video feeds to our own database, data sent to the Gemini API is processed by Google. 
                                  Google may retain data for a limited period to improve their services, subject to the <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer" className="underline font-bold hover:text-blue-700">Google Generative AI Terms of Service</a>. 
                                  By enabling AI features, you consent to this processing.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                          <label className="text-sm font-bold text-primary block">Enable AI Assistance</label>
                          <span className="text-xs text-secondaryText">Allow data transmission to Google Gemini</span>
                      </div>
                      
                      <button 
                        onClick={toggleAi}
                        className={`w-14 h-8 rounded-full p-1 transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-primary ${settings.aiEnabled ? 'bg-primary' : 'bg-gray-200'}`}
                        aria-label={`Toggle AI ${settings.aiEnabled ? 'Off' : 'On'}`}
                      >
                          <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 transform ${settings.aiEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                  </div>
              </div>

              {/* GENERAL SETTINGS */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                   {/* Personal Info */}
                   <button 
                        onClick={() => {
                            setEditForm(user);
                            setShowEditModal(true);
                        }}
                        className="w-full p-6 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 group text-left focus:outline-none focus:bg-gray-50"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                            <User size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-primary">Personal Information</h4>
                            <p className="text-xs text-secondaryText">Update your name and role</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                   </button>

                   {/* Email Notifications */}
                   <div className="p-6 flex items-center gap-4 border-b border-gray-50">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${settings.emailNotifications ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500'}`}>
                            <Mail size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-primary">Email Notifications</h4>
                            <p className="text-xs text-secondaryText">Receive weekly insight reports</p>
                        </div>
                        <button 
                            onClick={toggleEmail}
                            className={`w-10 h-6 rounded-full p-0.5 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary ${settings.emailNotifications ? 'bg-accent' : 'bg-gray-200'}`}
                            aria-label={`Toggle Email Notifications ${settings.emailNotifications ? 'Off' : 'On'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${settings.emailNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                   </div>
              </div>

              <button className="w-full p-4 rounded-2xl border border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-red-200">
                  <LogOut size={20} />
                  Sign Out
              </button>
          </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-primary">Edit Profile</h3>
                      <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 focus:ring-2 focus:ring-primary">
                          <X size={20} />
                      </button>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider mb-2">Full Name</label>
                          <input 
                            type="text" 
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider mb-2">Role / Title</label>
                          <input 
                            type="text" 
                            value={editForm.role}
                            onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider mb-2">Email (Read Only)</label>
                          <input 
                            type="email" 
                            value={editForm.email}
                            disabled
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500"
                          />
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-secondaryText hover:bg-gray-50"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-gray-800 transition-colors shadow-lg"
                          >
                              Save Changes
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Profile;