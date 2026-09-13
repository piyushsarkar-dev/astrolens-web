'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useGallery } from '@/lib/gallery-context';
import { User, Lock, LogOut, Save, Check, Key, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const { profile, updateProfile, changePassword, signOut } = useAuth();
  const { photos, albums } = useGallery();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [imgbbKey, setImgbbKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarUrl(profile.avatar_url || '');
      setImgbbKey(profile.imgbb_api_key || '');
    }
  }, [profile]);

  const favoritesCount = photos.filter(p => p.is_favorite && !p.is_deleted).length;
  const totalCount = photos.filter(p => !p.is_deleted).length;
  const hasKey = !!profile?.imgbb_api_key;

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await updateProfile({ name, avatar_url: avatarUrl || null });
    setSavingProfile(false);
    if (!error) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    }
  };

  const handleSaveKey = async () => {
    setKeyError(null);
    if (!imgbbKey.trim()) {
      setKeyError('Please enter a valid API key');
      return;
    }
    setSavingKey(true);
    const { error } = await updateProfile({ imgbb_api_key: imgbbKey.trim() });
    setSavingKey(false);
    if (error) {
      setKeyError(error);
    } else {
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    }
  };

  const handleRemoveKey = async () => {
    setRemovingKey(true);
    setImgbbKey('');
    const { error } = await updateProfile({ imgbb_api_key: null });
    setRemovingKey(false);
    if (error) {
      setKeyError(error);
    } else {
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPw) {
      setPwError('Passwords do not match');
      return;
    }
    setSavingPw(true);
    const { error } = await changePassword(newPassword);
    setSavingPw(false);
    if (error) {
      setPwError(error);
    } else {
      setPwSaved(true);
      setNewPassword('');
      setConfirmPw('');
      setTimeout(() => setPwSaved(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-ink-300 mt-0.5">Manage your profile and security</p>
      </div>

      {/* Profile stats */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-ink-700 flex items-center justify-center text-xl font-medium text-ink-100 overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (profile?.name || profile?.email || '?').charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium truncate">{profile?.name || 'User'}</p>
            <p className="text-sm text-ink-300 truncate">{profile?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="text-center p-3 rounded-lg bg-ink-800/40">
            <p className="text-xl font-semibold tabular-nums">{totalCount}</p>
            <p className="text-xs text-ink-300 mt-0.5">Photos</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-ink-800/40">
            <p className="text-xl font-semibold tabular-nums">{albums.length}</p>
            <p className="text-xs text-ink-300 mt-0.5">Albums</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-ink-800/40">
            <p className="text-xl font-semibold tabular-nums">{favoritesCount}</p>
            <p className="text-xs text-ink-300 mt-0.5">Favorites</p>
          </div>
        </div>
      </div>

      {/* ImgBB API Key */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-4 h-4 text-lime" />
          <h3 className="text-sm font-medium">ImgBB API Key</h3>
          {hasKey ? (
            <span className="ml-auto text-xs text-lime flex items-center gap-1">
              <Check className="w-3 h-3" /> Connected
            </span>
          ) : (
            <span className="ml-auto text-xs text-ink-300">Not set</span>
          )}
        </div>
        <p className="text-xs text-ink-300 mb-4">
          Your personal ImgBB API key is used for all your uploads. It is stored securely and never exposed to the browser. Get a free key at{' '}
          <a href="https://api.imgbb.com" target="_blank" rel="noopener noreferrer" className="text-lime hover:underline inline-flex items-center gap-0.5">
            api.imgbb.com <ExternalLink className="w-3 h-3" />
          </a>
        </p>
        <div className="space-y-4">
          <div>
            <label className="label">API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                className="input pr-11"
                value={imgbbKey}
                onChange={e => setImgbbKey(e.target.value)}
                placeholder={hasKey ? '••••••••••••••••' : 'Enter your ImgBB API key'}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-100"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {keyError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {keyError}
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleSaveKey} disabled={savingKey} className="btn-primary text-xs">
              {savingKey ? 'Saving…' : hasKey ? 'Update key' : 'Save key'}
            </button>
            {hasKey && (
              <button onClick={handleRemoveKey} disabled={removingKey} className="btn-danger text-xs">
                <Trash2 className="w-3.5 h-3.5" />
                {removingKey ? 'Removing…' : 'Remove key'}
              </button>
            )}
            {keySaved && (
              <span className="text-xs text-lime flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
          {!hasKey && (
            <p className="text-xs text-ink-300 bg-ink-800/40 rounded-lg px-3 py-2">
              You need an ImgBB API key to upload photos. Your key is used server-side only — it is never sent to the browser or exposed in client code.
            </p>
          )}
        </div>
      </div>

      {/* Edit profile */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-lime" />
          <h3 className="text-sm font-medium">Edit Profile</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="label">Avatar URL (optional)</label>
            <input
              className="input"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary text-xs">
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
            {profileSaved && (
              <span className="text-xs text-lime flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-lime" />
          <h3 className="text-sm font-medium">Change Password</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="•••••••••"
            />
          </div>
          {pwError && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {pwError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={handleChangePassword} disabled={savingPw} className="btn-primary text-xs">
              {savingPw ? 'Updating…' : 'Update password'}
            </button>
            {pwSaved && (
              <span className="text-xs text-lime flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Password updated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button onClick={() => signOut()} className="btn-danger w-full">
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
