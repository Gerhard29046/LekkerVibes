// Default shapes for the preference maps stored on users/{uid}. Firestore is
// schemaless, so these are additive: existing docs simply don't have the key
// yet and get the defaults merged in client-side until the user saves.

export const DEFAULT_NOTIFICATION_PREFS = {
  channels: {
    newFollower: { inApp: true, push: true, email: false },
    followRequest: { inApp: true, push: true, email: true },
    connectionRequest: { inApp: true, push: true, email: false },
    acceptedConnection: { inApp: true, push: true, email: false },
    profileInteraction: { inApp: true, push: false, email: false },
    communityPost: { inApp: true, push: false, email: false },
    communityReply: { inApp: true, push: true, email: false },
    communityMention: { inApp: true, push: true, email: false },
    communityInvitation: { inApp: true, push: true, email: true },
    membershipResult: { inApp: true, push: true, email: true },
    communityEvent: { inApp: true, push: true, email: false },
    followedGroupActivity: { inApp: true, push: false, email: false },
    followedGroupEvent: { inApp: true, push: true, email: false },
    followedGroupAnnouncement: { inApp: true, push: true, email: false },
    followedGroupSchedule: { inApp: true, push: true, email: false },
    eventReminder: { inApp: true, push: true, email: false },
    eventCancellation: { inApp: true, push: true, email: true },
    eventChange: { inApp: true, push: true, email: true },
    eventChatReply: { inApp: true, push: false, email: false },
    similarEventNearby: { inApp: true, push: false, email: false },
    matchingInterest: { inApp: true, push: false, email: false },
    weekendRecommendations: { inApp: true, push: false, email: false },
    nearbyTrending: { inApp: false, push: false, email: false },
    savedPlaceUpdate: { inApp: true, push: false, email: false },
  },
  paused: false,
};

export const NOTIFICATION_GROUPS = [
  {
    id: 'follow',
    label: 'Follow & connections',
    color: 'coral',
    items: [
      { key: 'newFollower', label: 'New follower', description: 'Someone starts following your profile.' },
      { key: 'followRequest', label: 'Follow request', description: 'Someone asks to follow your profile.' },
      { key: 'connectionRequest', label: 'Connection request', description: 'Someone from a shared community wants to connect.' },
      { key: 'acceptedConnection', label: 'Accepted connection', description: 'Someone accepts your connection request.' },
      { key: 'profileInteraction', label: 'Profile interaction', description: 'Activity on your public profile.' },
    ],
  },
  {
    id: 'community',
    label: 'Communities',
    color: 'sky',
    items: [
      { key: 'communityPost', label: 'New community post', description: 'A new post appears in one of your communities.' },
      { key: 'communityReply', label: 'Reply to my post', description: 'Someone replies to something you posted.' },
      { key: 'communityMention', label: 'Mention', description: 'Someone mentions you in a community.' },
      { key: 'communityInvitation', label: 'Community invitation', description: "You're invited to join a community." },
      { key: 'membershipResult', label: 'Membership request result', description: 'Your join request is approved or declined.' },
      { key: 'communityEvent', label: 'New community event', description: 'A community you belong to creates an event.' },
    ],
  },
  {
    id: 'groups',
    label: 'Groups followed',
    color: 'lime',
    items: [
      { key: 'followedGroupActivity', label: 'New activity from followed groups', description: 'Updates from groups you follow without joining.' },
      { key: 'followedGroupEvent', label: 'New event', description: 'A followed group creates a new event.' },
      { key: 'followedGroupAnnouncement', label: 'Important announcement', description: 'Major announcements from followed groups.' },
      { key: 'followedGroupSchedule', label: 'Schedule change', description: 'A followed group changes timing or plans.' },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    color: 'peach',
    items: [
      { key: 'eventReminder', label: 'Event reminder', description: "A reminder before an event you're going to." },
      { key: 'eventCancellation', label: 'Event cancellation', description: 'An event you joined is cancelled.' },
      { key: 'eventChange', label: 'Time or venue changed', description: 'Details change for an event you joined.' },
      { key: 'eventChatReply', label: 'Someone replied in event chat', description: 'New messages in an event chat.' },
      { key: 'similarEventNearby', label: 'New similar event nearby', description: 'Something similar to events you like pops up nearby.' },
    ],
  },
  {
    id: 'discovery',
    label: 'Discovery',
    color: 'lavender',
    items: [
      { key: 'matchingInterest', label: 'New activity matching interests', description: 'Fresh activities that match your interests.' },
      { key: 'weekendRecommendations', label: 'Weekend recommendations', description: 'A curated set of ideas for your weekend.' },
      { key: 'nearbyTrending', label: 'Nearby trending activity', description: "What's picking up near you right now." },
      { key: 'savedPlaceUpdate', label: 'Saved-place update', description: 'Something changes about a place you saved.' },
    ],
  },
];

export const DEFAULT_MESSAGE_PREFS = {
  communityMessages: true,
  eventChatMessages: true,
  groupChatMessages: true,
  mentions: true,
  replies: true,
  reactions: false,
  showPreviews: true,
  allowModeratorContact: true,
  chatSound: true,
  pushAlerts: true,
};

export const DEFAULT_COMMUNITY_PREFS = {
  autoFollowOnJoin: true,
  invitationNotifications: true,
  approvalNotifications: true,
  announcementAlerts: true,
  eventAlertsFromCommunities: true,
  showCommunitiesOnProfile: true,
  allowMembersToConnect: true,
};

export const DEFAULT_GROUP_FOLLOW_PREFS = {
  newPostAlerts: true,
  newEventAlerts: true,
  importantOnly: false,
  showFollowedGroupsOnProfile: true,
};

export const DEFAULT_DISCOVERY_PREFS = {
  preferredCategories: [],
  preferredMoods: [],
  preferredDays: [],
  preferredTimeOfDay: 'any',
  transportPreference: 'any',
  familyFriendly: false,
  alcoholFree: false,
  beginnerFriendly: false,
  faithCommunity: false,
  accessibilityFriendly: false,
  pricePreference: 'any',
  indoorOutdoor: 'any',
};

export const DISCOVERY_MOODS = [
  { key: 'meetPeople', label: 'Meet people', color: 'coral' },
  { key: 'beActive', label: 'Be active', color: 'teal' },
  { key: 'chilled', label: 'Something chilled', color: 'peach' },
  { key: 'goOutTonight', label: 'Go out tonight', color: 'ocean' },
  { key: 'outdoors', label: 'Outdoors', color: 'lime' },
  { key: 'alcoholFree', label: 'Alcohol-free', color: 'sky' },
  { key: 'faithCommunity', label: 'Faith community', color: 'peach' },
  { key: 'creative', label: 'Creative', color: 'coral' },
  { key: 'beginnerFriendly', label: 'Beginner-friendly', color: 'sky' },
  { key: 'familyActivity', label: 'Family activity', color: 'lime' },
];

export const DISCOVERY_CATEGORIES = [
  'Sport & fitness', 'Outdoors & nature', 'Food & drink', 'Arts & culture',
  'Music & nightlife', 'Wellness', 'Faith & community', 'Family friendly',
  'Learning & workshops', 'Volunteering',
];

export const DEFAULT_LOCATION_PREFS = {
  suburb: '',
  radiusKm: 20,
  useCurrentLocation: false,
  showExactLocationOnProfile: false,
  useLocationForRecommendations: true,
  rememberRecentAreas: true,
};

export const RADIUS_OPTIONS = [5, 10, 20, 30, 50, null]; // null = "Anywhere"
