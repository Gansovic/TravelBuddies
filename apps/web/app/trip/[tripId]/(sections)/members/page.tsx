'use client';

import { useState, useEffect } from 'react';
import { TripService } from '@travelbuddies/utils';
import type { TripMember, InviteTripMemberInput } from '@travelbuddies/utils';

interface TripMembersPageProps {
  params: {
    tripId: string;
  };
}

/**
 * Trip Members Section Page
 * Shows current members and allows inviting new ones
 */
export default function TripMembersPage({ params }: TripMembersPageProps) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteTripMemberInput>({
    email: '',
    role: 'viewer'
  });

  const tripService = TripService.getInstance();

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const membersData = await tripService.getTripMembers(params.tripId);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading members:', error);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteForm.email?.trim()) {
      alert('Email is required');
      return;
    }

    try {
      setInviteLoading(true);
      const success = await tripService.inviteMember(params.tripId, {
        email: inviteForm.email.trim(),
        role: inviteForm.role
      });

      if (success) {
        setShowInviteModal(false);
        setInviteForm({ email: '', role: 'viewer' });
        // Reload members to show the new invitation
        await loadMembers();
      } else {
        alert('Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [params.tripId]);

  const getRoleBadge = (role: string) => {
    const styles = {
      owner: 'bg-purple-100 text-purple-800',
      editor: 'bg-blue-100 text-blue-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return styles[role as keyof typeof styles] || styles.viewer;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadMembers}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Members</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          + Invite Member
        </button>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm">
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
            <p className="text-gray-600 mb-6">Invite people to join your trip!</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              Invite First Member
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Avatar placeholder */}
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {member.user_name ? member.user_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {member.user_name || 'Unknown User'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                      
                      {member.user_email && (
                        <p className="text-sm text-gray-600 mb-2">{member.user_email}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Joined {formatDate(member.joined_at)}</span>
                        {member.contribution_stats && (
                          <>
                            <span>•</span>
                            <span>{member.contribution_stats.moment_count} moments</span>
                            {member.contribution_stats.favorite_moment_types.length > 0 && (
                              <>
                                <span>•</span>
                                <span>
                                  Favorite: {member.contribution_stats.favorite_moment_types.slice(0, 2).join(', ')}
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity indicator */}
                  {member.contribution_stats && member.contribution_stats.moment_count > 0 && (
                    <div className="text-right">
                      <div className="text-lg font-medium text-green-600">
                        {member.contribution_stats.moment_count}
                      </div>
                      <div className="text-xs text-gray-500">moments</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
            
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="member@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as 'editor' | 'viewer' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="viewer">Viewer - Can view trip content</option>
                  <option value="editor">Editor - Can add and edit content</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={inviteLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}