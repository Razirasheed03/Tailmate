// src/pages/user/profile/Personal.tsx
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import userService from '@/services/userService';

const Personal = () => {
  const { user, login } = useAuth(); // login(token, user) will update context; token stays same here
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const startEdit = () => {
    setValue(user?.username || '');
    setErr(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setErr(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = (value || '').trim();
    if (!username || username.length < 3) {
      setErr('Username must be at least 3 characters');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      // PUT /api/user/update with { username }, withCredentials handled in userService
      const { data } = await userService.updateProfile({ username });
      const payload = data?.data ?? data;

      // Update AuthContext and localStorage auth_user so the new name reflects across app
      const newUser = {
        ...(user || {}),
        username: payload?.username ?? username,
      };
      // Keep the same access token in localStorage (not changed by profile update)
      const token = localStorage.getItem('auth_token') || '';
      login(token, newUser as any);

      setEditing(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Update failed';
      setErr(msg); // e.g., "Username already taken" from 409
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>

      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Username</label>

          {!editing ? (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-gray-900">{user?.username || '-'}</span>
              <button
                onClick={startEdit}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Edit
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-2">
              <input
                className="border rounded px-3 py-2 w-full"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter new username"
                autoFocus
              />
              {err && <p className="text-sm text-rose-600">{err}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2 rounded border text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-2 rounded bg-orange-600 text-white text-sm disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-gray-900">{user?.email || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Personal;
